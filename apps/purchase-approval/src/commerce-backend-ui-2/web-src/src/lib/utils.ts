/*
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

function assertNoError<T extends { error: unknown }>(
  result: T,
): asserts result is Extract<T, { error: null }> {
  if (result.error) {
    throw result.error;
  }
}

/** Throws a hook result's `error` if present, narrowing the result to its error-free shape. */
export function throwIfError<T extends { error: unknown }>(
  result: T,
): Extract<T, { error: null }> {
  assertNoError(result);
  return result;
}
