/**
 * Logs each back-in-stock notification for audit (no outbound send).
 *
 * @param {object} params - Action params
 * @param {object} _data - Transformed data
 * @param {object} preProcessed - { sku, subscriptions }
 * @returns {{ success: boolean }}
 */
function sendData(params, _data, preProcessed) {
  const { Core } = require("@adobe/aio-sdk");
  const logger = Core.Logger("notify-back-in-stock-sender", {
    level: params.LOG_LEVEL || "info",
  });

  const { sku, subscriptions = [] } = preProcessed;
  const timestamp = new Date().toISOString();

  for (const sub of subscriptions) {
    logger.info(
      `Back-in-stock notification (audit): sku=${sku ?? "unknown"} email=${sub.email} subscriptionId=${sub.id} at ${timestamp}`,
    );
  }

  return { success: true };
}

module.exports = {
  sendData,
};
