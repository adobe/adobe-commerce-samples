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
const {
  parseGridRequest,
  okGridResponse,
  errorGridResponse,
} = require("@adobe/aio-commerce-sdk/admin-ui/grid-columns");
const { getApprovalRequestsByOrderIds } = require("#lib/storage");

const ISO_MILLISECONDS_Z = /\.\d+Z$/;

// Commerce's ColumnsDataFormatter validates `datetime`/`date` values by
// round-tripping through PHP's DateTimeInterface::ATOM format
// (Y-m-d\TH:i:sP) and rejecting anything whose re-formatted output doesn't
// match byte-for-byte. That format has no milliseconds and renders UTC as
// "+00:00", not "Z" — both of which our raw ISO string (and any prior
// attempt) violated.
function toCommerceDatetime(isoString) {
  if (!isoString) {
    return null;
  }
  const d = new Date(isoString);
  return Number.isNaN(d.getTime())
    ? null
    : d.toISOString().replace(ISO_MILLISECONDS_Z, "+00:00");
}

async function main(params) {
  const logger = AioLogger("order-grid-data", {
    level: params.LOG_LEVEL || "info",
  });
  try {
    const { ids, gridType } = parseGridRequest(params);
    logger.info(
      `order-grid-data triggered: gridType=${gridType}, ${ids.length} id(s)`,
    );

    const rows = await getApprovalRequestsByOrderIds(ids, params);
    const byIncrementId = {};
    for (const r of rows) {
      byIncrementId[String(r.incrementId)] = r;
    }

    const data = {};
    for (const id of ids) {
      const r = byIncrementId[String(id)];
      data[id] = r
        ? {
            approval_status: r.status,
            approver: r.approvedBy ?? "",
            requested_at: toCommerceDatetime(r.createdAt),
          }
        : {
            approval_status: "",
            approver: "",
            requested_at: null,
          };
    }

    logger.info(
      `order-grid-data returning data for ${Object.keys(data).length} row(s)`,
    );
    return okGridResponse(data, {
      approval_status: "",
      approver: "",
      requested_at: null,
    });
  } catch (error) {
    logger.error(`order-grid-data failed: ${error.message}`);
    return errorGridResponse(
      500,
      error.message || "Failed to build order grid data",
    );
  }
}

exports.main = main;
