/**
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/*
 * Circuit breaker for sync echo loops (a.k.a. infinite-loop breaker).
 *
 * Bidirectional sync can echo forever: a change synced into one system triggers
 * that system's own event, which syncs back to the other, and round it goes.
 * This guard fingerprints each change it processes and, for a short TTL window,
 * recognizes the echo that comes back and lets the caller drop it. It is
 * domain-agnostic — callers supply the key and fingerprint for their entity.
 *
 *   withCircuitBreaker(handler, options) -> wrap an action's `main` with the guard
 *
 * Or drive the primitives directly:
 *   isEcho(state, change)   -> has this exact change just been processed?
 *   remember(state, change) -> record it so the next echo is recognized
 */

import crypto from "node:crypto";

import { init as initLibState } from "@adobe/aio-lib-state";

const INVALID_STATE_KEY_CHARS_REGEX = /[^a-zA-Z0-9-_.]/g;
const FINGERPRINT_ALGORITHM = "sha256";
const FINGERPRINT_ENCODING = "hex";
const DEFAULT_TTL = 60; // seconds

/**
 * @typedef {object} Change
 * @property {string} key - State key identifying the entity (e.g. a product SKU).
 * @property {object} fingerprint - The fields that define a meaningful change.
 * @property {string} event - The type of the event currently being handled.
 * @property {string[]} eventTypes - Event types the guard applies to; events of
 *   any other type are never treated as echoes.
 */

/**
 * Wraps an event handler with the circuit breaker: it drops echoes before the
 * handler runs, and records each processed change so the echo that follows is
 * recognized. Export the returned function as your action's `main`.
 *
 * The breaker owns the state lifecycle and the discard response, so the wrapped
 * handler only contains business logic. `remember` runs only after the handler
 * resolves, so a failed run isn't mistaken for a completed one and can retry.
 *
 * @param {(params: object) => Promise<object>} handler - The guarded handler.
 * @param {object} options
 * @param {string[]} options.eventTypes - Event types the guard applies to.
 * @param {(params: object) => { key: string, fingerprint: object }} options.identify
 *   - Derives the dedup identity (key + fingerprint) for the current event.
 * @param {number} [options.ttl] - Seconds to remember a change (default 60).
 * @param {(change: Change, params: object) => object} [options.onEcho] - Response
 *   returned when an echo is dropped; defaults to a 200 with a skip body.
 * @returns {(params: object) => Promise<object>} A runtime action `main`.
 */
export function withCircuitBreaker(
  handler,
  { eventTypes, identify, ttl, onEcho },
) {
  return async function main(params) {
    const state = await initLibState();
    const { key, fingerprint } = identify(params);
    const change = { event: params.type, eventTypes, fingerprint, key, ttl };

    if (await isEcho(state, change)) {
      return onEcho
        ? onEcho(change, params)
        : {
            body: { key, reason: "circuit-breaker", skipped: true },
            statusCode: 200,
          };
    }

    const result = await handler(params);
    await remember(state, change);
    return result;
  };
}

/**
 * Returns whether `change` is a replay of one just processed and therefore
 * should be discarded rather than acted on again.
 *
 * @param {object} state - An initialized `@adobe/aio-lib-state` instance.
 * @param {Change} change - The change derived from the current event.
 * @returns {Promise<boolean>} `true` when the change is an echo to drop.
 */
export async function isEcho(state, { key, fingerprint, event, eventTypes }) {
  if (!eventTypes.includes(event)) {
    return false;
  }

  const persisted = await state.get(sanitizeKey(key));
  if (!persisted) {
    return false;
  }

  return persisted.value === hash(fingerprint);
}

/**
 * Records the change so the echo that follows shortly after is recognized by
 * {@link isEcho}. Call this only after the change has been processed.
 *
 * @param {object} state - An initialized `@adobe/aio-lib-state` instance.
 * @param {Change & { ttl?: number }} change - The processed change; `ttl` is the
 *   number of seconds to remember it for (defaults to 60).
 * @returns {Promise<void>}
 */
export async function remember(state, { key, fingerprint, ttl }) {
  await state.put(sanitizeKey(key), hash(fingerprint), {
    ttl: ttl || DEFAULT_TTL,
  });
}

/**
 * Replaces characters not allowed in a state key with underscores.
 *
 * @param {string} key - The raw key.
 * @returns {string} A key safe to use with `@adobe/aio-lib-state`.
 */
function sanitizeKey(key) {
  return key.replace(INVALID_STATE_KEY_CHARS_REGEX, "_");
}

/**
 * Produces a stable hex digest of a fingerprint object.
 *
 * @param {object} fingerprint - The fields that define a meaningful change.
 * @returns {string} A hex-encoded SHA-256 digest.
 */
function hash(fingerprint) {
  return crypto
    .createHash(FINGERPRINT_ALGORITHM)
    .update(JSON.stringify(fingerprint))
    .digest(FINGERPRINT_ENCODING);
}
