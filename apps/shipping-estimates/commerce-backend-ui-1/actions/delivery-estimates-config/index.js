import { Core } from "@adobe/aio-sdk";

import {
  DEFAULT_CONFIG,
  getDeliveryConfig,
  saveDeliveryConfig,
} from "../../../lib/delivery-config.js";
import { checkMissingRequestInputs, errorResponse } from "../utils.js";

/**
 * Admin backend action for delivery estimates configuration CRUD.
 * GET: returns current config from aio-lib-state.
 * PUT: validates and saves config to aio-lib-state.
 *
 * @param {object} params action input parameters
 * @returns {Promise<{statusCode: number, body: object}>}
 */
export async function main(params) {
  const logger = Core.Logger("delivery-estimates-config", {
    level: params.LOG_LEVEL || "debug",
  });

  try {
    const requiredHeaders = ["Authorization"];
    const errorMessage = checkMissingRequestInputs(params, [], requiredHeaders);
    if (errorMessage) {
      return errorResponse(400, errorMessage, logger);
    }

    const method = (params.method || params.__ow_method || "GET").toUpperCase();

    if (method === "GET") {
      const config = await getDeliveryConfig({ logLevel: params.LOG_LEVEL });
      return {
        statusCode: 200,
        body: maskApiKey(config),
      };
    }

    if (method === "PUT" || method === "POST") {
      const body = parseBody(params);
      const validated = validateConfig(body);

      const current = await getDeliveryConfig({ logLevel: params.LOG_LEVEL });

      const toSave = { ...current, ...validated };
      if (validated.api_key === "••••••••" || validated.api_key === undefined) {
        toSave.api_key = current.api_key;
      }

      const saved = await saveDeliveryConfig(toSave, {
        logLevel: params.LOG_LEVEL,
      });

      logger.info("Delivery estimates config updated");

      return {
        statusCode: 200,
        body: maskApiKey(saved),
      };
    }

    return errorResponse(405, `Method ${method} not allowed`, logger);
  } catch (error) {
    logger.error("Config action error:", error);
    return errorResponse(500, error.message, logger);
  }
}

function parseBody(params) {
  if (params.__ow_body) {
    try {
      return JSON.parse(atob(params.__ow_body));
    } catch {
      return JSON.parse(params.__ow_body);
    }
  }

  const {
    enabled,
    api_base_url,
    api_key,
    origin,
    default_carriers,
    default_service_levels,
    cache_ttl_seconds,
    carrier_code_mapping,
  } = params;

  return {
    enabled,
    api_base_url,
    api_key,
    origin,
    default_carriers,
    default_service_levels,
    cache_ttl_seconds,
    carrier_code_mapping,
  };
}

function validateScalarFields(body) {
  const config = {};

  if (body.enabled !== undefined) {
    config.enabled = Boolean(body.enabled);
  }
  if (body.api_base_url !== undefined) {
    config.api_base_url = String(body.api_base_url).trim();
  }
  if (body.api_key !== undefined) {
    config.api_key = String(body.api_key);
  }
  if (body.cache_ttl_seconds !== undefined) {
    const ttl = Number(body.cache_ttl_seconds);
    config.cache_ttl_seconds =
      Number.isFinite(ttl) && ttl > 0 ? ttl : DEFAULT_CONFIG.cache_ttl_seconds;
  }

  return config;
}

function validateObjectFields(body) {
  const config = {};

  if (body.origin !== undefined && typeof body.origin === "object") {
    config.origin = {
      country_code: String(body.origin.country_code ?? "").trim(),
      postal_code: String(body.origin.postal_code ?? "").trim(),
      city: String(body.origin.city ?? "").trim(),
    };
  }

  if (Array.isArray(body.default_carriers)) {
    config.default_carriers = body.default_carriers.map((c) =>
      String(c).trim(),
    );
  }

  if (Array.isArray(body.default_service_levels)) {
    config.default_service_levels = body.default_service_levels.map((s) =>
      String(s).trim(),
    );
  }

  if (
    body.carrier_code_mapping !== undefined &&
    typeof body.carrier_code_mapping === "object" &&
    !Array.isArray(body.carrier_code_mapping)
  ) {
    config.carrier_code_mapping = Object.fromEntries(
      Object.entries(body.carrier_code_mapping).map(([k, v]) => [
        String(k).trim(),
        String(v).trim(),
      ]),
    );
  }

  return config;
}

function validateConfig(body) {
  return {
    ...validateScalarFields(body),
    ...validateObjectFields(body),
  };
}

function maskApiKey(config) {
  if (!config.api_key) {
    return config;
  }
  return {
    ...config,
    api_key: config.api_key.length > 4 ? "••••••••" : "",
    api_key_set: Boolean(config.api_key),
  };
}
