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
const { getApprovalRequests } = require("#lib/storage");
const { jsonResponse } = require("#lib/action-utils");

async function main(params) {
  const logger = AioLogger("approval-requests-list", {
    level: params.LOG_LEVEL || "info",
  });

  try {
    const query = params.__ow_query || {};
    const status = params.status || query.status;
    const limit = Math.min(
      Number.parseInt(params.limit || query.limit || "50", 10) || 50,
      100,
    );

    const list = await getApprovalRequests({ status, limit }, params);

    logger.info(`Returning ${list.length} approval request(s)`);

    return jsonResponse(200, list);
  } catch (err) {
    logger.error(`List error: ${err.message}`);
    return jsonResponse(500, { error: err.message });
  }
}

exports.main = main;
