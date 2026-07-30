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
const { getApprovalRequest, updateApprovalRequest } = require("./storage");
const {
  createCommerceClient,
  getOrder,
  addOrderComment,
} = require("./commerce-client");
const { jsonResponse, parseBody } = require("./action-utils");

/**
 * Shared logic for approve and reject actions.
 *
 * @param {object} params - Action params
 * @param {object} options
 * @param {string} options.actionName   - 'approve' | 'reject'
 * @param {string} options.newStatus    - 'approved' | 'rejected'
 * @param {Function} options.orderFn   - unholdOrder | cancelHeldOrder
 * @param {string} options.orderVerb   - 'unholded' | 'cancelled'
 */
async function processApprovalDecision(
  params,
  { actionName, newStatus, orderFn, orderVerb },
) {
  const logger = AioLogger(actionName, { level: params.LOG_LEVEL || "info" });

  const body = parseBody(params);
  const id = params.id || body.id;
  const comment = params.comment || body.comment || null;

  if (!id) {
    return jsonResponse(400, { error: "Missing approval request id" });
  }

  try {
    const request = await getApprovalRequest(id, params);
    if (!request) {
      return jsonResponse(404, { error: "Approval request not found" });
    }

    if (request.status !== "pending") {
      return jsonResponse(409, {
        error: `Request is already ${request.status}`,
      });
    }

    const { orderId } = request;
    const client = await createCommerceClient(params);

    if (!client) {
      return jsonResponse(400, {
        error:
          "Commerce client could not be initialised; approval request not updated.",
      });
    }

    if (!orderId) {
      return jsonResponse(400, {
        error:
          "Order ID is missing on the approval request; approval request not updated.",
      });
    }

    const result = await orderFn(client, orderId);
    logger.info(
      `Order ${orderId} ${actionName} result: ${JSON.stringify(result)}`,
    );

    if (result !== true) {
      return jsonResponse(400, {
        error: `Order ${orderId} could not be ${orderVerb} (Commerce returned: ${JSON.stringify(result)}); approval request not updated.`,
      });
    }

    logger.info(`Order ${orderId} ${orderVerb}.`);

    if (comment) {
      try {
        const order = await getOrder(client, orderId);
        await addOrderComment(client, orderId, comment, order.status, true);
        logger.info(`Comment added to order ${orderId}.`);
      } catch (err) {
        logger.error(
          `Failed to add comment to order ${orderId}: ${err.message}`,
        );
      }
    }

    const updated = await updateApprovalRequest(
      id,
      {
        status: newStatus,
        comment,
        approvedBy: params.approvedBy || body.approvedBy || "dashboard",
      },
      params,
    );

    logger.info(
      `${actionName.charAt(0).toUpperCase() + actionName.slice(1)}d request ${id}`,
    );

    return jsonResponse(200, updated);
  } catch (err) {
    logger.error(
      `${actionName.charAt(0).toUpperCase() + actionName.slice(1)} error: ${err.message}`,
    );
    return jsonResponse(500, { error: err.message });
  }
}

module.exports = { processApprovalDecision };
