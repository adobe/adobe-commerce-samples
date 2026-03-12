const { Core } = require("@adobe/aio-sdk");
const stateLib = require("@adobe/aio-lib-state");
const { getClient } = require("../../../oauth1a");

const STATE_KEY = "out-of-stock-subscriptions";
const DEFAULT_STOCK_ID = 1;

function buildSkuToSubs(subscriptions) {
  const skuToSubs = new Map();
  for (const sub of subscriptions) {
    const key = sub.sku;
    if (!skuToSubs.has(key)) {
      skuToSubs.set(key, []);
    }
    skuToSubs.get(key).push(sub);
  }
  return skuToSubs;
}

async function checkSkusAndCollectToRemove(client, skuToSubs, stockId, logger) {
  const toRemove = new Set();
  const timestamp = new Date().toISOString();
  for (const [sku, subs] of skuToSubs) {
    try {
      const resourceUrl = `inventory/is-product-salable/${encodeURIComponent(sku)}/${stockId}`;
      const salable = await client.get(resourceUrl);
      if (salable === true) {
        for (const sub of subs) {
          logger.info(
            `Back-in-stock notification (scheduled audit): sku=${sku} email=${sub.email} subscriptionId=${sub.id} at ${timestamp}`,
          );
          toRemove.add(sub.id);
        }
      }
    } catch (err) {
      logger.error(
        `Commerce is-product-salable failed for sku=${sku}: ${err.message}`,
      );
    }
  }
  return toRemove;
}

/**
 * Scheduled action: load subscriptions, check Commerce is-product-salable for each SKU,
 * log notifications for in-stock SKUs and remove those subscriptions.
 *
 * @param {object} params - LOG_LEVEL, STATE_REGION, COMMERCE_BASE_URL, COMMERCE_STORE_CODE
 */
async function main(params) {
  const logger = Core.Logger("notify-check-stock", {
    level: params.LOG_LEVEL || "info",
  });
  logger.info("Start scheduled check-stock");

  const baseUrl = params.COMMERCE_BASE_URL;
  if (!baseUrl || baseUrl === "$COMMERCE_BASE_URL") {
    logger.warn("COMMERCE_BASE_URL not set; skipping check-stock");
    return {
      statusCode: 200,
      body: { success: true, message: "Skipped: no Commerce URL" },
    };
  }

  let state;
  try {
    state = await stateLib.init({
      ...(params.STATE_REGION && { region: params.STATE_REGION }),
    });
  } catch (err) {
    logger.error(`State init failed: ${err.message}`);
    return { statusCode: 500, body: { success: false, error: err.message } };
  }

  const stateDoc = await state.get(STATE_KEY);
  const raw = stateDoc?.value;
  const data =
    typeof raw === "string" ? JSON.parse(raw) : raw ?? {};
  const subscriptions = data?.subscriptions ?? [];
  if (!Array.isArray(subscriptions) || subscriptions.length === 0) {
    logger.info("No subscriptions to check");
    return {
      statusCode: 200,
      body: { success: true, subscriptionsChecked: 0 },
    };
  }

  const skuToSubs = buildSkuToSubs(subscriptions);
  const client = getClient({ url: baseUrl, params }, logger);
  const stockId = params.COMMERCE_STOCK_ID ?? DEFAULT_STOCK_ID;
  const toRemove = await checkSkusAndCollectToRemove(
    client,
    skuToSubs,
    stockId,
    logger,
  );

  if (toRemove.size > 0) {
    const remaining = subscriptions.filter((s) => !toRemove.has(s.id));
    await state.put(STATE_KEY, JSON.stringify({ subscriptions: remaining }));
  }

  logger.info(`Check-stock finished; notified ${toRemove.size} subscriptions`);
  return {
    statusCode: 200,
    body: {
      success: true,
      subscriptionsChecked: subscriptions.length,
      notified: toRemove.size,
    },
  };
}

exports.main = main;
