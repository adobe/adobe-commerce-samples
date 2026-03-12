const { randomUUID } = require("node:crypto");
const { Core } = require("@adobe/aio-sdk");
const stateLib = require("@adobe/aio-lib-state");
const { stringParameters } = require("../lib/utils");
const {
  HTTP_CREATED,
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
 * POST a product review for a SKU.
 *
 * @param {object} params - Body: sku (required), rating (required 1-5), review? (optional), user? (optional)
 * @returns {{ statusCode: number, body: object }}
 */
async function main(params) {
  const logger = Core.Logger("product-reviews-reviews-post", {
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

    const { sku, rating, review, user } = validation.body;
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    const state = await stateLib.init();
    const key = stateKey(STATE_KEY_PREFIX, sku);
    const result = await state.get(key);
    let list = [];
    if (result?.value !== undefined && result?.value !== null) {
      const raw = result.value;
      list = typeof raw === "string" ? JSON.parse(raw) : raw;
    }
    if (!Array.isArray(list)) list = [];
    list.push({ id, sku, rating, review, user, createdAt });
    await state.put(key, JSON.stringify(list));

    logger.info("Review created");
    return {
      statusCode: HTTP_CREATED,
      body: { success: true, id },
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
