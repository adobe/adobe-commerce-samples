/*
Copyright 2024 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

/**
 * Encodes an object into a string with key values.
 * For instance, with default delimiters:
 * given the object {foo:'bar',baz:'qux'}
 * will return the string 'foo:bar,baz:qux'
 *
 * @param {object} object the value to encode
 * @param {string} pairDelimiter defaults to comma
 * @param {string} keyValueDelimiter defaults to colon
 * @returns {string} containing the encoded key values
 */
export function encode(object, pairDelimiter = ",", keyValueDelimiter = ":") {
  if (typeof object !== "object") {
    return "";
  }

  return Object.entries(object)
    .map(([key, value]) => `${key}${keyValueDelimiter}${value}`)
    .join(pairDelimiter);
}

/**
 * Decodes into a regular object a string which contains encoded key values.
 * For instance, with default delimiters:
 * given the string 'foo:bar,baz:qux'
 * will return the object {foo:'bar',baz:'qux'}
 *
 * @param {string} str the value to decode
 * @param {string} pairDelimiter defaults to comma
 * @param {string} keyValueDelimiter defaults to colon
 * @returns {object} containing the decoded key values
 */
export function decode(str, pairDelimiter = ",", keyValueDelimiter = ":") {
  if (typeof str !== "string" || str.trim() === "") {
    return {};
  }

  return str
    .split(pairDelimiter)
    .map((pair) => pair.split(keyValueDelimiter))
    .reduce((decoded, keyValue) => {
      if (keyValue.length !== 2) {
        throw new Error(`Can't decode the key value '${keyValue}'`);
      }
      decoded[keyValue[0]] = keyValue[1];
      return decoded;
    }, {});
}
