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
const { v4: uuidv4 } = require("uuid");
const {
  getApprovalConfig,
  createApprovalRequest,
  appendExecutionLog,
} = require("#lib/storage");
const { parseNumber, makeLogEntry } = require("#lib/action-utils");

function mapOrderPayload(params) {
  const order = params.data?.value?.order ?? {};
  return {
    orderId: order.entity_id ?? order.id,
    incrementId: order.increment_id,
    grandTotal: parseNumber(order.grand_total),
    status: order.status,
    state: order.state,
    storeName: order.store_name,
    customerEmail: order.customer_email,
    customerFirstname: order.customer_firstname,
    customerLastname: order.customer_lastname,
  };
}

async function main(params) {
  const logger = AioLogger("order-event-handler", {
    level: params.LOG_LEVEL || "info",
  });

  const logEntry = makeLogEntry(`evt-${Date.now()}`, "event");

  try {
    const config = await getApprovalConfig();
    const threshold = parseNumber(config.approvalThresholdAmount);
    const payload = mapOrderPayload(params);

    logEntry.orderId = payload.incrementId ?? payload.orderId;

    if (Number.isNaN(threshold) || threshold <= 0) {
      logger.info("No valid threshold; skipping approval request.");
      logEntry.result = "skipped";
      logEntry.message = "No threshold configured";
      await appendExecutionLog(logEntry, params);
      return { statusCode: 200, body: { message: "Skipped" } };
    }

    const grandTotal = Number.isNaN(payload.grandTotal)
      ? 0
      : payload.grandTotal;
    if (grandTotal < threshold) {
      logger.info(
        `Order ${payload.incrementId} below threshold; no approval request.`,
      );
      logEntry.result = "below_threshold";
      logEntry.message = "Below threshold";
      await appendExecutionLog(logEntry, params);
      return { statusCode: 200, body: { message: "Below threshold" } };
    }

    const now = new Date().toISOString();
    const approvalRequest = {
      id: uuidv4(),
      orderId: String(payload.orderId ?? ""),
      incrementId: String(payload.incrementId ?? ""),
      grandTotal,
      currency: config.currency || "USD",
      status: "pending",
      customerEmail: payload.customerEmail ?? "",
      customerName:
        [payload.customerFirstname, payload.customerLastname]
          .filter(Boolean)
          .join(" ")
          .trim() || "—",
      storeName: payload.storeName ?? "",
      createdAt: now,
      updatedAt: now,
      approvedBy: null,
      comment: null,
    };

    await createApprovalRequest(approvalRequest, params);
    logEntry.result = "approval_created";
    logEntry.message = approvalRequest.id;
    await appendExecutionLog(logEntry, params);

    logger.info(
      `Created approval request ${approvalRequest.id} for order ${payload.incrementId} (${grandTotal} ${config.currency})`,
    );

    return {
      statusCode: 200,
      body: {
        message: "Approval request created",
        approvalRequestId: approvalRequest.id,
        incrementId: approvalRequest.incrementId,
      },
    };
  } catch (err) {
    logger.error(`Order event handler failed: ${err.message}`);
    logEntry.status = "error";
    logEntry.message = err.message;
    try {
      await appendExecutionLog(logEntry, params);
    } catch {
      /* storage failure — do not block response */
    }
    return {
      statusCode: 200,
      body: { message: "Error creating approval request", error: err.message },
    };
  }
}

exports.main = main;
