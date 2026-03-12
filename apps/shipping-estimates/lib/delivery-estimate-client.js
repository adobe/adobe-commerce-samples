import { Core } from "@adobe/aio-sdk";
import got from "got";

const TRAILING_SLASHES = /\/+$/;

/**
 * Builds a location object from an address, filtering out empty fields.
 */
function buildLocation(address) {
  if (!(address?.country_code || address?.postal_code)) {
    return;
  }

  const loc = {};
  if (address.country_code) {
    loc.country_code = address.country_code;
  }
  if (address.postal_code) {
    loc.postal_code = address.postal_code;
  }
  if (address.city) {
    loc.city = address.city;
  }
  return loc;
}

/**
 * Builds the request body from the provided options.
 */
function buildRequestBody({
  origin,
  destination,
  shipDate,
  carriers,
  serviceLevels,
}) {
  const body = {};

  const originLoc = buildLocation(origin);
  if (originLoc) {
    body.origin = originLoc;
  }

  const destLoc = buildLocation(destination);
  if (destLoc) {
    body.destination = destLoc;
  }

  if (shipDate) {
    body.ship_date = shipDate;
  }
  if (carriers?.length) {
    body.carriers = carriers;
  }
  if (serviceLevels?.length) {
    body.service_levels = serviceLevels;
  }

  return body;
}

/**
 * Calls the external delivery estimate API.
 *
 * @param {object} options
 * @param {string} options.apiBaseUrl base URL of the delivery estimate API
 * @param {string} options.apiKey Bearer token for authentication
 * @param {object} [options.origin] origin address {country_code, postal_code, city}
 * @param {object} [options.destination] destination address {country_code, postal_code, city}
 * @param {string} [options.shipDate] ISO 8601 date (YYYY-MM-DD)
 * @param {string[]} [options.carriers] carrier codes to request
 * @param {string[]} [options.serviceLevels] service level codes to request
 * @param {string} [options.logLevel]
 * @returns {Promise<{estimates: object[], best_estimation: object|null}>}
 */
export async function fetchDeliveryEstimates(options) {
  const { apiBaseUrl, apiKey, logLevel = "info" } = options;
  const logger = Core.Logger("delivery-estimate-client", { level: logLevel });
  const emptyResult = { estimates: [], best_estimation: null };

  if (!(apiBaseUrl && apiKey)) {
    logger.warn("Delivery estimate API not configured (missing URL or key)");
    return emptyResult;
  }

  const body = buildRequestBody(options);
  const url = apiBaseUrl.replace(TRAILING_SLASHES, "");

  logger.debug(`Calling delivery estimate API: POST ${url}`);

  try {
    const response = await got
      .post(url, {
        json: body,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        responseType: "json",
        timeout: { request: 5000 },
        retry: { limit: 1 },
      })
      .json();

    logger.debug(
      `Delivery estimate API returned ${response?.estimates?.length ?? 0} estimates`,
    );

    return {
      estimates: response?.estimates ?? [],
      best_estimation: response?.best_estimation ?? null,
    };
  } catch (error) {
    logger.error(
      `Delivery estimate API error: ${error.message}`,
      error.response?.body,
    );
    return emptyResult;
  }
}
