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

/** The guarded event type used across the breaker tests. */
export const EVENT = "be-observer.catalog_product_update";

/** The fields that define a meaningful change for the test entity. */
export const FINGERPRINT = { name: "Anvil", price: 99.99, sku: "ANVIL-01" };

/** The breaker state key for the test entity. */
export const KEY = "product_ANVIL-01";

/**
 * Builds a `Change` (the input contract of `isEcho` / `remember`) for the test
 * entity, with `overrides` applied on top.
 *
 * @param {object} [overrides] - Fields to override on the default change.
 * @returns {object} A `Change` object.
 */
export const change = (overrides = {}) => ({
  event: EVENT,
  eventTypes: [EVENT],
  fingerprint: FINGERPRINT,
  key: KEY,
  ...overrides,
});

/** An `identify` option deriving the test entity's key + fingerprint. */
export const identify = () => ({ fingerprint: FINGERPRINT, key: KEY });

/** Runtime action params carrying the guarded event for the test entity. */
export const params = { data: { value: FINGERPRINT }, type: EVENT };
