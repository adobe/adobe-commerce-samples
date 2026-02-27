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
import { Core } from "@adobe/aio-sdk";

import { getAdobeCommerceClient } from "../../../lib/adobe-commerce.js";
import { checkMissingRequestInputs, errorResponse } from "../utils.js";

const actionMap = {
  POST: (adobeCommerce, operation, payload) => {
    adobeCommerce.post(operation, payload);
  },
  GET: (adobeCommerce, operation) => adobeCommerce.get(operation),
};

/**
 * Main function to handle the commerce actions.
 * @param {object} params The input parameters passed by Adobe I/O Runtime, including headers and query/body values.
 * @returns {Promise<{statusCode: number, body: object}>} The HTTP response with status code and body.
 */
export async function main(params) {
  const logger = Core.Logger("main", { level: params.LOG_LEVEL || "debug" });

  try {
    const requiredParams = ["operation", "COMMERCE_BASE_URL"];
    const requiredHeaders = ["Authorization"];
    const errorMessage = checkMissingRequestInputs(
      params,
      requiredParams,
      requiredHeaders,
    );
    if (errorMessage) {
      // return and log client errors
      return errorResponse(400, errorMessage, logger);
    }

    const { operation, method = "GET", payload = {} } = params;
    logger.debug(
      `operation: ${operation}, method: ${method}, payload: ${JSON.stringify(payload)}`,
    );

    if (!actionMap[method.toUpperCase()]) {
      return errorResponse(
        405,
        `Method ${method.toUpperCase()} not allowed`,
        logger,
      );
    }

    const adobeCommerce = await getAdobeCommerceClient(params);

    const content = await actionMap[method.toUpperCase()](
      adobeCommerce,
      operation,
      payload,
    );
    return {
      statusCode: 200,
      body: content || { success: true },
    };
  } catch (error) {
    // log any server errors
    logger.error("Commerce action error:", error);
    // return with 500
    return errorResponse(500, error, logger);
  }
}
