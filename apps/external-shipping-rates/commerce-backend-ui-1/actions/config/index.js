import { Core } from "@adobe/aio-sdk";

import { HTTP_BAD_REQUEST, HTTP_OK } from "../../../lib/http.js";
import {
  deleteConfigValue,
  getConfigValue,
  setConfigValue,
} from "../../../lib/key-values.js";

const CONFIG_KEY = "external_shipping_config";

/**
 * Backend action for external shipping configuration
 * Handles GET/POST/DELETE for merchant configuration
 *
 * @param {object} params - Action parameters
 * @returns {Promise<{statusCode: number, body: string}>} Response
 */
async function main(params) {
  const logger = Core.Logger("config-backend", {
    level: params.LOG_LEVEL || "info",
  });

  try {
    const method = params.__ow_method?.toUpperCase() || "GET";

    switch (method) {
      case "GET":
        return await getConfig(logger);
      case "POST":
        return await saveConfig(params, logger);
      case "DELETE":
        return await deleteConfig(logger);
      default:
        return {
          statusCode: HTTP_BAD_REQUEST,
          body: JSON.stringify({ error: "Method not allowed" }),
        };
    }
  } catch (error) {
    logger.error("Error in config backend:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}

/**
 * Retrieves configuration with masked API key
 *
 * @param {object} logger - Logger instance
 * @returns {Promise<{statusCode: number, body: string}>} Response
 */
async function getConfig(logger) {
  const configJson = await getConfigValue(CONFIG_KEY);

  if (!configJson) {
    return {
      statusCode: HTTP_OK,
      body: JSON.stringify({ config: null }),
    };
  }

  try {
    const config = JSON.parse(configJson);

    // Mask API key in response (security)
    if (config.apiKey) {
      const maskedKey = maskApiKey(config.apiKey);
      config.apiKey = maskedKey;
      config.apiKeyMasked = true;
    }

    return {
      statusCode: HTTP_OK,
      body: JSON.stringify({ config }),
    };
  } catch (error) {
    logger.error("Error parsing config:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Invalid configuration stored" }),
    };
  }
}

/**
 * Saves configuration with validation
 *
 * @param {object} params - Request parameters
 * @param {object} logger - Logger instance
 * @returns {Promise<{statusCode: number, body: string}>} Response
 */
async function saveConfig(params, logger) {
  const { serviceUrl, apiKey, warehouse, apiKeyMasked } = params;

  // Validation
  if (!(serviceUrl && apiKey && warehouse)) {
    return {
      statusCode: HTTP_BAD_REQUEST,
      body: JSON.stringify({
        error: "Missing required fields: serviceUrl, apiKey, warehouse",
      }),
    };
  }

  // Validate URL format
  try {
    new URL(serviceUrl);
  } catch {
    return {
      statusCode: HTTP_BAD_REQUEST,
      body: JSON.stringify({ error: "Invalid serviceUrl format" }),
    };
  }

  // Validate warehouse fields
  const requiredWarehouseFields = [
    "name",
    "street",
    "city",
    "state",
    "postalCode",
    "country",
  ];
  for (const field of requiredWarehouseFields) {
    if (!warehouse[field]) {
      return {
        statusCode: HTTP_BAD_REQUEST,
        body: JSON.stringify({ error: `Missing warehouse field: ${field}` }),
      };
    }
  }

  // If API key is masked, fetch existing key (not updating key)
  let finalApiKey = apiKey;
  if (apiKeyMasked) {
    const existingConfigJson = await getConfigValue(CONFIG_KEY);
    if (existingConfigJson) {
      const existingConfig = JSON.parse(existingConfigJson);
      finalApiKey = existingConfig.apiKey;
    }
  }

  // Store configuration (API key stored in plain text in state, encrypted by aio-lib-state)
  const config = {
    serviceUrl,
    apiKey: finalApiKey,
    warehouse,
  };

  await setConfigValue(CONFIG_KEY, JSON.stringify(config));

  logger.info("External shipping configuration saved");

  return {
    statusCode: HTTP_OK,
    body: JSON.stringify({ success: true, message: "Configuration saved" }),
  };
}

/**
 * Deletes configuration
 *
 * @param {object} logger - Logger instance
 * @returns {Promise<{statusCode: number, body: string}>} Response
 */
async function deleteConfig(logger) {
  await deleteConfigValue(CONFIG_KEY);
  logger.info("External shipping configuration deleted");

  return {
    statusCode: HTTP_OK,
    body: JSON.stringify({ success: true, message: "Configuration deleted" }),
  };
}

/**
 * Masks API key for display (show last 3 characters only)
 * Example: "my-secret-api-key" → "••••••••key"
 *
 * @param {string} apiKey - API key to mask
 * @returns {string} Masked API key
 */
function maskApiKey(apiKey) {
  if (!apiKey || apiKey.length <= 3) {
    return "••••••••";
  }
  const visiblePart = apiKey.slice(-3);
  const maskedPart = "•".repeat(Math.min(apiKey.length - 3, 8));
  return maskedPart + visiblePart;
}

export { main };
