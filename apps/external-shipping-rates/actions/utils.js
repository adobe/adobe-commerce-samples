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
 *
 * Returns a log ready string of the action input parameters.
 * The `Authorization` header content will be replaced by '<hidden>'.
 *
 * @param {object} params action input parameters.
 * @returns {string} the stringified parameters.
 */
export function stringParameters(params) {
  // hide authorization token without overriding params
  let headers = params.__ow_headers || {};
  if (headers.authorization) {
    headers = { ...headers, authorization: "<hidden>" };
  }
  return JSON.stringify({ ...params, __ow_headers: headers });
}

/**
 *
 * Returns the list of missing keys giving an object and its required keys.
 * A parameter is missing if its value is undefined or ''.
 * A value of 0 or null is not considered as missing.
 *
 * @param {object} obj object to check.
 * @param {array} required list of required keys.
 *        Each element can be multi level deep using a '.' separator e.g. 'myRequiredObj.myRequiredKey'
 *
 * @returns {array}
 * @private
 */
function getMissingKeys(obj, required) {
  return required.filter((r) => {
    const splits = r.split(".");
    const last = splits.at(-1);
    const traverse = splits
      .slice(0, -1)
      .reduce((tObj, split) => tObj[split] || {}, obj);
    return traverse[last] === undefined || traverse[last] === ""; // missing default params are empty string
  });
}

/**
 *
 * Returns the list of missing keys giving an object and its required keys.
 * A parameter is missing if its value is undefined or ''.
 * A value of 0 or null is not considered as missing.
 *
 * @param {object} params action input parameters.
 * @param {Array} requiredParams list of required input parameters.
 *        Each element can be multi level deep using a '.' separator e.g. 'myRequiredObj.myRequiredKey'.
 * @param {Array} requiredHeaders list of required input headers.
 * @returns {string} if the return value is not null, then it holds an error message describing the missing inputs.
 */
export function checkMissingRequestInputs(
  params,
  requiredParams = [],
  requiredHeaders = [],
) {
  let errorMessage = null;

  // input headers are always lowercase
  const lowerRequiredHeaders = requiredHeaders.map((h) => h.toLowerCase());
  // check for missing headers
  const missingHeaders = getMissingKeys(
    params.__ow_headers || {},
    lowerRequiredHeaders,
  );
  if (missingHeaders.length > 0) {
    errorMessage = `missing header(s) '${missingHeaders}'`;
  }

  // check for missing parameters
  const missingParams = getMissingKeys(params, requiredParams);
  if (missingParams.length > 0) {
    if (errorMessage) {
      errorMessage += " and ";
    } else {
      errorMessage = "";
    }
    errorMessage += `missing parameter(s) '${missingParams}'`;
  }

  return errorMessage;
}

/**
 *
 * Extracts the bearer token string from the Authorization header in the request parameters.
 *
 * @param {object} params action input parameters.
 * @returns {string|undefined} the token string or undefined if not set in request headers.
 */
export function getBearerToken(params) {
  if (params.__ow_headers?.authorization?.startsWith("Bearer ")) {
    return params.__ow_headers.authorization.substring("Bearer ".length);
  }
}
/**
 *
 * Returns an error response object and attempts to log.info the status code and error message
 *
 * @param {number} statusCode the error status code.
 *        e.g. 400
 * @param {string} message the error message.
 *        e.g. 'missing xyz parameter'
 * @param {*} [logger] an optional logger instance object with an `info` method
 *        e.g. `new require('@adobe/aio-sdk').Core.Logger('name')`
 * @returns {object} the error object, ready to be returned from the action main's function.
 */
export function errorResponse(statusCode, message, logger) {
  if (logger && typeof logger.info === "function") {
    logger.info(`${statusCode}: ${message}`);
  }
  return {
    error: {
      statusCode,
      body: {
        error: message,
      },
    },
  };
}
