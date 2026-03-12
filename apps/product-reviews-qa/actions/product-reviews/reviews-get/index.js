const { Core } = require("@adobe/aio-sdk");
const stateLib = require("@adobe/aio-lib-state");
const { stringParameters } = require("../lib/utils");
const {
  HTTP_OK,
  HTTP_BAD_REQUEST,
  HTTP_INTERNAL_ERROR,
} = require("../lib/constants");
const { validate } = require("./validator");

const STATE_KEY_PREFIX = "reviews.";
const STATE_KEY_SAFE = /[^a-zA-Z0-9-_.]/g;

function stateKey(prefix, sku) {
  return prefix + String(sku).replace(STATE_KEY_SAFE, "_");
}

/**
 * GET product reviews for a SKU with optional pagination.
 *
 * @param {object} params - Query params: sku (required), limit (optional), offset (optional)
 * @returns {{ statusCode: number, body: object }}
 */
async function main(params) {
  const logger = Core.Logger("product-reviews-reviews-get", {
    level: params.LOG_LEVEL || "info",
  });
  try {
    logger.info("Start processing request");
    logger.debug(`Params: ${stringParameters(params)}`);

    const validation = validate(params);
    if (!validation.valid) {
      return {
        statusCode: HTTP_BAD_REQUEST,
        body: { error: validation.error },
      };
    }

    const { sku, limit, offset } = validation;
    const state = await stateLib.init();
    const key = stateKey(STATE_KEY_PREFIX, sku);
    const result = await state.get(key);
    let list = [];
    if (result?.value !== undefined && result?.value !== null) {
      const raw = result.value;
      list = typeof raw === "string" ? JSON.parse(raw) : raw;
    }
    if (!Array.isArray(list)) list = [];
    const total = list.length;
    const data = list.slice(offset, offset + limit);

    logger.info("Success");
    return {
      statusCode: HTTP_OK,
      body: { data, total },
    };
  } catch (error) {
    logger.error(`Server error: ${error.message}`, error);
    return {
      statusCode: HTTP_INTERNAL_ERROR,
      body: { error: "Internal server error." },
    };
  }
}

exports.main = main;
