const { Core } = require("@adobe/aio-sdk");
const { stringParameters } = require("../../../utils");
const { HTTP_INTERNAL_ERROR } = require("../../../constants");
const {
  actionSuccessResponse,
  actionErrorResponse,
} = require("../../../responses");
const { validateData } = require("./validator");
const { transformData } = require("./transformer");
const { preProcess } = require("./pre");
const { sendData } = require("./sender");
const { postProcess } = require("./post");

/**
 * Back-in-stock event handler: when Commerce emits cataloginventory_stock_item_save_commit_after
 * with is_in_stock true, resolve product_id to SKU, find subscriptions, log notifications, remove subscriptions.
 *
 * @param {object} params - Includes data (stock item), LOG_LEVEL, STATE_REGION, COMMERCE_BASE_URL, etc.
 */
async function main(params) {
  const logger = Core.Logger("notify-back-in-stock", {
    level: params.LOG_LEVEL || "info",
  });
  logger.info("Start processing back-in-stock request");
  logger.debug(`Received params: ${stringParameters(params)}`);

  const data = params.data;

  try {
    const validation = validateData(data);
    if (!validation.success) {
      logger.debug(`Validation skipped or failed: ${validation.message}`);
      return actionSuccessResponse(
        `Skipped: ${validation.message ?? "not in stock"}`,
      );
    }

    const transformedData = transformData(data);
    const preProcessed = await preProcess(params, transformedData);

    if (preProcessed.subscriptions.length === 0) {
      logger.debug("No subscriptions found for this SKU");
      return actionSuccessResponse("No subscriptions to notify");
    }

    sendData(params, transformedData, preProcessed);
    await postProcess(params, transformedData, preProcessed, { success: true });

    logger.debug("Back-in-stock processing finished successfully");
    return actionSuccessResponse("Back-in-stock notifications logged");
  } catch (error) {
    logger.error(`Error processing back-in-stock: ${error.message}`);
    return actionErrorResponse(HTTP_INTERNAL_ERROR, error.message);
  }
}

exports.main = main;
