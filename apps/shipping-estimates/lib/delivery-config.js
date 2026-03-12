import stateLib from "@adobe/aio-lib-state";
import { Core } from "@adobe/aio-sdk";

const CONFIG_KEY = "delivery-estimates-config";
const CONFIG_TTL = 365 * 24 * 60 * 60;

const DEFAULT_CONFIG = {
  enabled: false,
  api_base_url: "",
  api_key: "",
  origin: { country_code: "", postal_code: "", city: "" },
  default_carriers: [],
  default_service_levels: [],
  cache_ttl_seconds: 3600,
  carrier_code_mapping: {},
};

/**
 * Reads the delivery estimates configuration from aio-lib-state.
 * Returns the merged config with defaults for any missing fields.
 *
 * @param {object} [options]
 * @param {string} [options.logLevel]
 * @returns {Promise<object>} the configuration object
 */
export async function getDeliveryConfig({ logLevel = "info" } = {}) {
  const logger = Core.Logger("delivery-config", { level: logLevel });

  try {
    const state = await stateLib.init();
    const entry = await state.get(CONFIG_KEY);

    if (!entry?.value) {
      logger.debug("No delivery config found in state, using defaults");
      return { ...DEFAULT_CONFIG };
    }

    const stored =
      typeof entry.value === "string" ? JSON.parse(entry.value) : entry.value;

    return { ...DEFAULT_CONFIG, ...stored };
  } catch (error) {
    logger.error("Error reading delivery config from state:", error);
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Saves the delivery estimates configuration to aio-lib-state.
 *
 * @param {object} config the configuration to save
 * @param {object} [options]
 * @param {string} [options.logLevel]
 * @returns {Promise<object>} the saved configuration
 */
export async function saveDeliveryConfig(config, { logLevel = "info" } = {}) {
  const logger = Core.Logger("delivery-config", { level: logLevel });

  const merged = { ...DEFAULT_CONFIG, ...config };

  try {
    const state = await stateLib.init();
    await state.put(CONFIG_KEY, JSON.stringify(merged), { ttl: CONFIG_TTL });
    logger.info("Delivery config saved to state");
    return merged;
  } catch (error) {
    logger.error("Error saving delivery config to state:", error);
    throw error;
  }
}

export { DEFAULT_CONFIG };
