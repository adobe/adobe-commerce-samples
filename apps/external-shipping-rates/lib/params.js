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
 * Checks if the given value is non-empty.
 *
 * @param {string} name of the parameter. Required because of `aio app dev` compatibility: inputs mapped to undefined env vars come as $<input_name> in dev mode, but as '' in prod mode.
 * @param {string} value of the parameter.
 * @returns {boolean} returns true if the value is non-empty, false otherwise.
 */
export function nonEmpty(name, value) {
  const v = value?.trim();
  return v && v !== `$${name}`;
}

/**
 * Checks if all required parameters are non-empty.
 * @param {object} params action input parameters.
 * @param {string[]} required list of required parameter names.
 * @returns {boolean} returns true if all required parameters are non-empty, false otherwise.
 */
export function allNonEmpty(params, required) {
  return required.every((name) => nonEmpty(name, params[name]));
}
