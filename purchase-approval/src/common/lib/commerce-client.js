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
const { pinStageRuntimeEnv } = require("./storage");

/**
 * Creates an AdobeCommerceHttpClient for the Commerce instance this app is
 * associated with. The base URL and deployment flavor come from the association
 * data the SDK stores automatically on app association; the caller supplies the
 * IMS auth params. Returns null when the client cannot be built — including when
 * the app is not associated (AppNotAssociatedError) — so callers degrade gracefully.
 */
async function createCommerceClient(params) {
  const logger = AioLogger("commerce-client", { level: "info" });
  try {
    // Association data is read from App Builder State, which defaults to the prod
    // store in a deployed action unless the stage env is pinned first.
    pinStageRuntimeEnv();
    const { getCommerceClient } = await import("@adobe/aio-commerce-lib-app");
    const { resolveImsAuthParams } = await import(
      "@adobe/aio-commerce-lib-auth"
    );
    return await getCommerceClient(resolveImsAuthParams(params));
  } catch (err) {
    logger.info("createCommerceClient error:", err.message);
    return null;
  }
}

/**
 * Fetch a single order.
 * GET /rest/V1/orders/:id
 */
function getOrder(client, orderId) {
  return client.get(`orders/${orderId}`).json();
}

/**
 * PUT the order on hold.
 * POST /rest/V1/orders/:id/hold
 */
function holdOrder(client, orderId) {
  return client.post(`orders/${orderId}/hold`).json();
}

/**
 * Remove hold from order.
 * POST /rest/V1/orders/:id/unhold
 */
async function unholdOrder(client, orderId) {
  const logger = AioLogger("commerce-client", { level: "info" });
  const response = await client.post(`orders/${orderId}/unhold`).json();
  logger.info(
    `unholdOrder response for order ${orderId}:`,
    JSON.stringify(response),
  );
  return response;
}

/**
 * Cancel an order.
 * POST /rest/V1/orders/:id/cancel
 */
async function cancelOrder(client, orderId) {
  const logger = AioLogger("commerce-client", { level: "info" });
  const response = await client.post(`orders/${orderId}/cancel`).json();
  logger.info(
    `cancelOrder response for order ${orderId}:`,
    JSON.stringify(response),
  );
  return response;
}

/**
 * Unhold then cancel a held order.
 * Commerce requires the hold to be removed before cancellation is possible.
 * Returns the cancel response (true on success).
 */
async function cancelHeldOrder(client, orderId) {
  await unholdOrder(client, orderId);
  return cancelOrder(client, orderId);
}

/**
 * Add a comment to an order.
 * POST /rest/V1/orders/:id/comments
 * @param {object} client - AdobeCommerceHttpClient
 * @param {string|number} orderId - Order entity_id
 * @param {string} comment - Comment text
 * @param {string} status - Current or target order status (required to avoid nulling the status)
 * @param {boolean} visibleOnFront
 */
function addOrderComment(
  client,
  orderId,
  comment,
  status,
  visibleOnFront = false,
) {
  return client
    .post(`orders/${orderId}/comments`, {
      json: {
        statusHistory: {
          comment,
          status,
          is_customer_notified: 0,
          is_visible_on_front: visibleOnFront ? 1 : 0,
        },
      },
    })
    .json();
}

module.exports = {
  createCommerceClient,
  getOrder,
  holdOrder,
  unholdOrder,
  cancelOrder,
  cancelHeldOrder,
  addOrderComment,
};
