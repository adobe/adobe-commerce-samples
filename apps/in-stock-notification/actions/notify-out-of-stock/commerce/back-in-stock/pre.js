const stateLib = require("@adobe/aio-lib-state");
const { getClient } = require("../../../oauth1a");
const { Core } = require("@adobe/aio-sdk");

const STATE_KEY = "out-of-stock-subscriptions";

/**
 * Loads subscriptions from state and resolves product_id to SKU via Commerce REST.
 *
 * @param {object} params - Action params (includes COMMERCE_BASE_URL, COMMERCE_STORE_CODE, etc.)
 * @param {object} transformed - { productId }
 * @returns {Promise<{ sku: string | null, subscriptionIds: string[] }>}
 */
async function preProcess(params, transformed) {
  const logger = Core.Logger("notify-back-in-stock-pre", {
    level: params.LOG_LEVEL || "info",
  });

  const state = await stateLib.init({
    ...(params.STATE_REGION && { region: params.STATE_REGION }),
  });

  const stateDoc = await state.get(STATE_KEY);
  const raw = stateDoc?.value;
  const data =
    typeof raw === "string" ? JSON.parse(raw) : raw ?? {};
  const subscriptions = data?.subscriptions ?? [];
  if (!Array.isArray(subscriptions)) {
    return { sku: null, subscriptionIds: [], subscriptions: [] };
  }

  let sku = null;
  const baseUrl = params.COMMERCE_BASE_URL;
  if (baseUrl && baseUrl !== "$COMMERCE_BASE_URL") {
    try {
      const client = getClient({ url: baseUrl, params }, logger);
      const searchCriteria = `searchCriteria[filter_groups][0][filters][0][field]=entity_id&searchCriteria[filter_groups][0][filters][0][value]=${transformed.productId}&searchCriteria[pageSize]=1`;
      const resourceUrl = `products?${searchCriteria}`;
      const response = await client.get(resourceUrl);
      const items = response?.items ?? response;
      if (Array.isArray(items) && items.length > 0 && items[0].sku) {
        sku = String(items[0].sku);
      }
    } catch (err) {
      logger.error(
        `Commerce API failed to resolve product_id to sku: ${err.message}`,
      );
    }
  }

  const forSku =
    sku !== null && sku !== ""
      ? subscriptions.filter((s) => s.sku === sku)
      : [];
  const subscriptionIds = forSku.map((s) => s.id);

  return {
    sku,
    subscriptionIds,
    subscriptions: forSku,
  };
}

module.exports = {
  preProcess,
};
