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

/**
 * In-memory stand-in for `@adobe/aio-lib-state`, backed by a real `Map`. Tests
 * exercise behavior through `get`/`put` and inspect `store` for what was
 * actually persisted, treating stored values as opaque.
 *
 * @returns {{ get: Function, put: Function, store: Map<string, object> }}
 */
export function createFakeState() {
  const store = new Map();
  return {
    get(key) {
      return Promise.resolve(store.get(key));
    },
    put(key, value, options) {
      store.set(key, { value, ...options });
      return Promise.resolve();
    },
    store,
  };
}
