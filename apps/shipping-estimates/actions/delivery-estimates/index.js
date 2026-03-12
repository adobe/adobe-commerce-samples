import crypto from "node:crypto";

import stateLib from "@adobe/aio-lib-state";
import { Core } from "@adobe/aio-sdk";

import { getDeliveryConfig } from "../../lib/delivery-config.js";
import { fetchDeliveryEstimates } from "../../lib/delivery-estimate-client.js";
import {
  HTTP_BAD_REQUEST,
  HTTP_INTERNAL_ERROR,
  HTTP_OK,
} from "../../lib/http.js";

const EMPTY_RESPONSE = { estimates: [], best_estimation: null };

/**
 * Builds a cache key from the request parameters.
 */
function buildCacheKey(destination, shipDate, carriers) {
  const parts = [
    destination?.country_code ?? "",
    destination?.postal_code ?? "",
    shipDate ?? "",
    ...(carriers ?? []).sort(),
  ];
  const hash = crypto
    .createHash("sha256")
    .update(parts.join("|"))
    .digest("hex");
  return `estimate-cache.${hash.slice(0, 32)}`;
}

/**
 * Storefront BFF action for delivery date estimates.
 * Called by the storefront (PDP/cart) via HTTP POST.
 * Wraps the external delivery estimate API, reads config from aio-lib-state,
 * and caches results.
 *
 * @param {object} params action input parameters
 * @returns {Promise<{statusCode: number, headers: object, body: object}>}
 */
async function deliveryEstimates(params) {
  const logger = Core.Logger("delivery-estimates", {
    level: params.LOG_LEVEL || "info",
  });

  try {
    const config = await getDeliveryConfig({ logLevel: params.LOG_LEVEL });

    if (!config.enabled) {
      logger.debug("Delivery estimates feature is disabled");
      return jsonResponse(HTTP_OK, EMPTY_RESPONSE);
    }

    if (!(config.api_base_url && config.api_key)) {
      logger.warn("Delivery estimates API not configured");
      return jsonResponse(HTTP_OK, EMPTY_RESPONSE);
    }

    const body = parseRequestBody(params);

    if (!(body.destination?.country_code || body.destination?.postal_code)) {
      return jsonResponse(HTTP_BAD_REQUEST, {
        error: "bad_request",
        message:
          "At least destination.country_code or destination.postal_code is required.",
      });
    }

    const carriers = body.carriers ?? config.default_carriers ?? [];
    const serviceLevels =
      body.service_levels ?? config.default_service_levels ?? [];

    const cacheKey = buildCacheKey(body.destination, body.ship_date, carriers);

    const state = await stateLib.init();
    const cached = await state.get(cacheKey);
    if (cached?.value) {
      logger.debug(`Cache hit for ${cacheKey}`);
      const cachedData =
        typeof cached.value === "string"
          ? JSON.parse(cached.value)
          : cached.value;
      return jsonResponse(HTTP_OK, cachedData);
    }

    logger.debug(
      `Calling external API: ${config.api_base_url} for ${body.destination?.postal_code}`,
    );

    const result = await fetchDeliveryEstimates({
      apiBaseUrl: config.api_base_url,
      apiKey: config.api_key,
      origin: config.origin,
      destination: body.destination,
      shipDate: body.ship_date,
      carriers,
      serviceLevels,
      logLevel: params.LOG_LEVEL,
    });

    if (result.estimates?.length > 0) {
      const cacheTtl = config.cache_ttl_seconds || 3600;
      await state.put(cacheKey, JSON.stringify(result), { ttl: cacheTtl });
      logger.debug(
        `Cached ${result.estimates.length} estimates with TTL ${cacheTtl}s`,
      );
    } else {
      logger.debug("No estimates returned from API, skipping cache");
    }

    return jsonResponse(HTTP_OK, result);
  } catch (error) {
    logger.error("Error in delivery-estimates action:", error);
    return jsonResponse(HTTP_INTERNAL_ERROR, {
      error: "internal_error",
      message: "An unexpected error occurred.",
    });
  }
}

/**
 * Parses the request body from either raw-http or standard web action format.
 */
function parseRequestBody(params) {
  if (params.__ow_body) {
    try {
      const decoded = atob(params.__ow_body);
      return JSON.parse(decoded);
    } catch {
      return {};
    }
  }

  const { destination, ship_date, carriers, service_levels } = params;
  return { destination, ship_date, carriers, service_levels };
}

/**
 * Returns a JSON response with CORS headers for storefront access.
 */
function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
    },
    body,
  };
}

export const main = deliveryEstimates;
