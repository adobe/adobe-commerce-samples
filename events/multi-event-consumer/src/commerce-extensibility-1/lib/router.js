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
 * Router for a multi-event consumer action.
 *
 * App Management lets several event subscriptions share the same
 * `runtimeActions` entry, so more than one event type can be delivered to a
 * single action. This helper matches the incoming CloudEvent `type` against a
 * map of I/O event codes and dispatches the event to its own handler action
 * via an OpenWhisk invoke — the shared action stays a thin dispatcher, and
 * each event's business logic lives in its own action. It is domain-agnostic:
 * the caller resolves each event's I/O event code (e.g. via
 * `resolveIoEventCode`) and supplies the code -> action routes.
 *
 *   withEventRouter(routes) -> wrap an action's `main` with the router
 */

import { badRequest, ok } from "@adobe/aio-commerce-sdk/core/responses";
import AioLogger from "@adobe/aio-lib-core-logging";
import openwhisk from "openwhisk";

/**
 * @typedef {object} Route
 * @property {string} code - The I/O event code, as it appears on the incoming
 *   CloudEvent `type`.
 * @property {string} action - Target runtime action, as `<package>/<action>`.
 */

/**
 * Wraps a runtime action with a router that dispatches the incoming event to
 * another action based on its type. Export the returned function as the
 * shared action's `main`.
 *
 * @param {Route[]} routes - Events this router recognizes and where to send them.
 * @returns {(params: object) => Promise<object>} A runtime action `main`.
 */
export function withEventRouter(routes) {
  const actionByEventCode = new Map(
    routes.map(({ code, action }) => [code, action]),
  );

  return async function main(params) {
    const logger = AioLogger("multi-event-consumer/router", {
      level: params.LOG_LEVEL || "info",
    });

    const action = actionByEventCode.get(params.type);
    if (!action) {
      logger.warn(`No route registered for event type "${params.type}".`);
      return badRequest({
        body: {
          message: `No route registered for event type "${params.type}".`,
          routed: false,
          type: params.type,
        },
      });
    }

    const ow = openwhisk();
    const invocation = await ow.actions.invoke({
      blocking: false,
      name: action,
      params,
    });

    logger.info(
      `Routed "${params.type}" to "${action}" (activation ${invocation.activationId}).`,
    );

    return ok({
      body: { action, activationId: invocation.activationId, routed: true },
    });
  };
}
