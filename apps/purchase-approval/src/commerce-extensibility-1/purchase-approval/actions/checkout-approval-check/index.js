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
  ok,
  successOperation,
  replaceOperation,
  addOperation,
} = require("@adobe/aio-commerce-sdk/webhooks/responses");
const { getApprovalConfig, appendExecutionLog } = require("#lib/storage");
const {
  createCommerceClient,
  holdOrder,
  addOrderComment,
} = require("#lib/commerce-client");
const { parseNumber, makeLogEntry } = require("#lib/action-utils");

const ORDER_ON_HOLD_STATUS = "holded";

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: webhook decision logic (threshold check, hold, comment, error paths) is naturally branchy; restructuring it is out of scope for this lint-tooling change
async function main(params) {
  const logger = AioLogger("checkout-approval-check", {
    level: params.LOG_LEVEL || "info",
  });
  const opSuccess = () => ok(successOperation());

  const requestId =
    params.__ow_headers?.["x-request-id"] || `req-${Date.now()}`;
  const logEntry = makeLogEntry(requestId, "webhook");

  try {
    const config = await getApprovalConfig();
    const threshold = parseNumber(config.approvalThresholdAmount);

    if (Number.isNaN(threshold) || threshold <= 0) {
      logEntry.status = "error";
      logEntry.message =
        "Invalid approval threshold in config; allowing checkout.";
      await appendExecutionLog(logEntry, params);
      logger.warn(logEntry.message);
      return opSuccess();
    }

    const order = params.order ?? {};
    const grandTotal = parseNumber(
      order.grand_total ?? order["result.grand_total"],
    );
    // Commerce REST order operations (hold/comment) are keyed by entity_id, but the execution log
    // displays the human-readable increment_id to match the order-event-handler path.
    const orderEntityId = order.entity_id ?? order["result.entity_id"] ?? null;
    const orderIncrementId =
      order.increment_id ?? order["result.increment_id"] ?? null;
    const orderId = orderEntityId ?? orderIncrementId;
    logEntry.orderId = orderIncrementId ?? orderEntityId;

    if (Number.isNaN(grandTotal)) {
      logEntry.result = "no_total";
      logEntry.message = "No grand_total in payload; allowing checkout.";
      await appendExecutionLog(logEntry, params);
      logger.warn(logEntry.message);
      return opSuccess();
    }

    const requiresApproval = grandTotal >= threshold;
    logEntry.result = requiresApproval ? "requires_approval" : "allowed";

    if (requiresApproval) {
      const approvalMessage =
        config.requireApprovalMessage ||
        "Order placed on hold pending purchase approval.";
      logEntry.message = approvalMessage;

      const client = await createCommerceClient(params);
      let holdReturnedTrue = false;
      if (client && orderId) {
        try {
          const holdResult = await holdOrder(client, orderId);
          holdReturnedTrue = holdResult === true;
          if (holdReturnedTrue) {
            logger.info(`Order ${orderId} placed on hold.`);
          } else {
            logger.warn(
              `Hold order ${orderId} did not return true: ${JSON.stringify(holdResult)}`,
            );
          }
        } catch (holdErr) {
          logger.error(`Failed to hold order ${orderId}: ${holdErr.message}`);
        }

        if (holdReturnedTrue) {
          try {
            await addOrderComment(
              client,
              orderId,
              approvalMessage,
              ORDER_ON_HOLD_STATUS,
              true,
            );
            logger.info(`Comment added to order ${orderId}.`);
          } catch (commentErr) {
            logger.error(
              `Failed to add comment to order ${orderId}: ${commentErr.message}`,
            );
          }
        }
      } else {
        logger.warn(
          "Commerce client unavailable or orderId missing; skipping hold.",
        );
      }

      await appendExecutionLog(logEntry, params);
      if (holdReturnedTrue) {
        const opReplaceOrderOnHold = () =>
          ok([
            replaceOperation("order/status", ORDER_ON_HOLD_STATUS),
            addOperation("order/custom_attributes_serializable", {
              approve_message: approvalMessage,
            }),
          ]);
        logger.info(
          `Response from webhook${JSON.stringify(opReplaceOrderOnHold())}`,
        );

        return opReplaceOrderOnHold();
      }
      return opSuccess();
    }

    logEntry.message = "Order below threshold; no approval required.";
    await appendExecutionLog(logEntry, params);
    return opSuccess();
  } catch (err) {
    logger.error(`Checkout approval check failed: ${err.message}`);
    logEntry.status = "error";
    logEntry.message = err.message;
    try {
      await appendExecutionLog(logEntry, params);
    } catch {
      /* storage failure — do not block response */
    }
    return opSuccess();
  }
}

exports.main = main;
