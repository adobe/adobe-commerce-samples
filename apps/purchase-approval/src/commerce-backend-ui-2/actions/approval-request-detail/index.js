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

const AioLogger = require("@adobe/aio-lib-core-logging");
const { getApprovalRequest } = require("#lib/storage");
const { jsonResponse } = require("#lib/action-utils");

const LEADING_SLASH = /^\//;

async function main(params) {
  const logger = AioLogger("approval-request-detail", {
    level: params.LOG_LEVEL || "info",
  });

  const id =
    params.id ||
    params.__ow_query?.id ||
    params.__ow_path?.replace(LEADING_SLASH, "");
  if (!id) {
    return jsonResponse(400, { error: "Missing approval request id" });
  }

  try {
    const request = await getApprovalRequest(id, params);
    if (!request) {
      return jsonResponse(404, { error: "Approval request not found" });
    }

    return jsonResponse(200, request);
  } catch (err) {
    logger.error(`Detail error: ${err.message}`);
    return jsonResponse(500, { error: err.message });
  }
}

exports.main = main;
