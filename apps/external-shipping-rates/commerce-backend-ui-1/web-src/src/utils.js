/*
Copyright 2025 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/
/**
 * Calls a backend Adobe I/O Runtime action with the given operation and payload.
 *
 * @param {object} props Component props containing IMS information
 * @param {string} action The action key from the config file
 * @param {string} operation The specific operation name for the backend to execute
 * @param {string} method The HTTP method to be passed to the backend
 * @param {object|null} payload The optional request payload
 * @returns {Promise<object>} The parsed JSON response from the backend
 */
// biome-ignore lint/nursery/useMaxParams: just for demo purposes
export async function callAction(
  props,
  action,
  operation,
  method = "GET",
  payload = null,
) {
  // config.json is generated when running app builder cli
  // eslint-disable-next-line node/no-missing-require,node/no-unpublished-require
  const actions = require("./config.json");

  const res = await fetch(actions[action], {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-gw-ims-org-id": props.imsOrgId,
      authorization: `Bearer ${props.imsToken}`,
    },
    body: JSON.stringify({
      operation,
      method,
      ...(payload ? { payload } : {}),
    }),
  });

  return await res.json();
}
