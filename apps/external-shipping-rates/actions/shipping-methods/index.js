/*
Copyright 2025 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import {
  getInstrumentationHelpers,
  instrumentEntrypoint,
} from "@adobe/aio-lib-telemetry";

import {
  webhookErrorResponse,
  webhookVerify,
} from "../../lib/adobe-commerce.js";
import { HTTP_OK } from "../../lib/http.js";
import { getConfigValue } from "../../lib/key-values.js";
import { checkoutMetrics } from "../checkout-metrics.js";
import { isWebhookSuccessful, telemetryConfig } from "../telemetry.js";

const CONFIG_KEY = "external_shipping_config";

/**
 * Fetches external shipping configuration from state storage
 * @returns {Promise<object|null>} Configuration object or null if not set
 */
async function getExternalShippingConfig() {
  try {
    const configJson = await getConfigValue(CONFIG_KEY);
    if (!configJson) {
      return null;
    }
    return JSON.parse(configJson);
  } catch (_error) {
    return null;
  }
}

/**
 * Transforms Commerce rate request to external API format
 * @param {object} rateRequest - Commerce webhook rate request
 * @param {object} warehouse - Warehouse configuration
 * @returns {object} External API request payload
 */
function transformToExternalRequest(rateRequest, warehouse) {
  const {
    dest_country_id: destCountry = "US",
    dest_postcode: destPostcode = "",
    dest_city: destCity = "",
    dest_region: destRegion = "",
    dest_street: destStreet = "",
    all_items: cartItems = [],
  } = rateRequest;

  // Calculate total weight from cart items
  const totalWeight = cartItems.reduce((sum, item) => {
    const weight = Number.parseFloat(item.weight || 0);
    const qty = Number.parseInt(item.qty || 1, 10);
    return sum + weight * qty;
  }, 0);

  return {
    shipment: {
      ship_to: {
        name: "Customer",
        address_line1: destStreet || "",
        city_locality: destCity || "",
        state_province: destRegion || "",
        postal_code: destPostcode || "",
        country_code: destCountry || "US",
      },
      ship_from: {
        name: warehouse.name || "Warehouse",
        phone: warehouse.phone || "",
        address_line1: warehouse.street || "",
        city_locality: warehouse.city || "",
        state_province: warehouse.state || "",
        postal_code: warehouse.postalCode || "",
        country_code: warehouse.country || "US",
      },
      packages: [
        {
          weight: {
            value: totalWeight || 1,
            unit: "pound",
          },
        },
      ],
    },
    rate_options: {
      carrier_ids: [],
    },
  };
}

/**
 * Transforms external API response to Commerce operations array
 * @param {object} externalResponse - External API response
 * @returns {Array} Commerce operations array
 */
function transformFromExternalResponse(externalResponse) {
  const operations = [];

  // Handle both response formats: { rates: [...] } or { rate_response: { rates: [...] } }
  const rates =
    externalResponse.rates || externalResponse.rate_response?.rates || [];

  for (const rate of rates) {
    const serviceCode = rate.service_code || rate.service_type || "unknown";
    const serviceName =
      rate.service_name || rate.carrier_friendly_name || "Shipping";

    // Extract price with priority: shipping_amount.amount > shipment_cost > cost
    let price = 0;
    if (rate.shipping_amount?.amount) {
      price = Number.parseFloat(rate.shipping_amount.amount);
    } else if (rate.shipment_cost) {
      price = Number.parseFloat(rate.shipment_cost);
    } else if (rate.cost) {
      price = Number.parseFloat(rate.cost);
    }

    operations.push({
      op: "add",
      path: "result",
      value: {
        carrier_code: "external_shipping",
        method: serviceCode,
        method_title: serviceName,
        price,
        cost: price,
      },
    });
  }

  return operations;
}

/**
 * Calls external shipping rates API
 * @param {string} serviceUrl - External API URL
 * @param {string} apiKey - API key for authentication (never logged)
 * @param {object} requestPayload - Request body
 * @param {object} logger - Logger instance
 * @returns {Promise<object>} Response object with success/error status
 */
async function callExternalAPI(serviceUrl, apiKey, requestPayload, logger) {
  try {
    const response = await fetch(serviceUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "API-Key": apiKey,
      },
      body: JSON.stringify(requestPayload),
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      if (response.status === 401) {
        logger.error("External API authentication failed (401)");
        return { error: "auth_failed" };
      }
      if (response.status === 400) {
        logger.error("External API bad request (400)");
        return { error: "bad_request" };
      }
      logger.error(`External API error: ${response.status}`);
      return { error: "api_error" };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    if (error.name === "AbortError" || error.name === "TimeoutError") {
      logger.error("External API timeout");
      return { error: "timeout" };
    }
    logger.error("External API call failed:", error.message);
    return { error: "network_error" };
  }
}

/**
 * Main shipping methods webhook handler
 * Integrates with external shipping rates API
 *
 * @param {object} params - Action parameters
 * @returns {Promise<{statusCode: number, body: string}>} Response with operations array
 * @see https://developer.adobe.com/commerce/extensibility/webhooks
 */
async function shippingMethods(params) {
  const { logger } = getInstrumentationHelpers();

  logger.debug("Starting external shipping rates process");

  try {
    // 1. Verify webhook signature
    const { success, error } = webhookVerify(params);
    if (!success) {
      logger.error(`Webhook verification failed: ${error}`);
      checkoutMetrics.shippingMethodsCounter.add(1, {
        status: "error",
        error_code: "verification_failed",
      });
      return webhookErrorResponse(
        `Failed to verify the webhook signature: ${error}`,
      );
    }

    // 2. Decode body (raw-http: true)
    const payload = JSON.parse(atob(params.__ow_body));
    const { rateRequest: request } = payload;

    logger.info("Received rate request for external shipping");

    // 3. Fetch configuration from state storage
    const config = await getExternalShippingConfig();
    if (!(config?.serviceUrl && config?.apiKey)) {
      logger.warn("External shipping service not configured");
      checkoutMetrics.shippingMethodsCounter.add(1, {
        status: "error",
        error_code: "not_configured",
      });
      // Return empty operations (fallback to other carriers)
      return {
        statusCode: HTTP_OK,
        body: JSON.stringify([]),
      };
    }

    // 4. Transform Commerce request to external API format
    const externalRequest = transformToExternalRequest(
      request,
      config.warehouse || {},
    );

    logger.debug("Calling external shipping API");

    // 5. Call external API
    const apiResponse = await callExternalAPI(
      config.serviceUrl,
      config.apiKey, // API key never logged
      externalRequest,
      logger,
    );

    // 6. Handle API errors (return empty for fallback)
    if (apiResponse.error) {
      logger.error(`External API error: ${apiResponse.error}`);
      checkoutMetrics.shippingMethodsCounter.add(1, {
        status: "error",
        error_code: apiResponse.error,
      });
      // Return empty operations (fallback to other carriers)
      return {
        statusCode: HTTP_OK,
        body: JSON.stringify([]),
      };
    }

    // 7. Transform external API response to Commerce operations
    const operations = transformFromExternalResponse(apiResponse.data);

    logger.info(`Generated ${operations.length} shipping method operations`);

    checkoutMetrics.shippingMethodsCounter.add(1, { status: "success" });

    return {
      statusCode: HTTP_OK,
      body: JSON.stringify(operations),
    };
  } catch (error) {
    logger.error("Error in shipping methods:", error);
    checkoutMetrics.shippingMethodsCounter.add(1, {
      status: "error",
      error_code: "exception",
    });
    // Return empty operations on exception (fallback)
    return {
      statusCode: HTTP_OK,
      body: JSON.stringify([]),
    };
  }
}

// Export the instrumented function as main
export const main = instrumentEntrypoint(shippingMethods, {
  ...telemetryConfig,
  isSuccessful: isWebhookSuccessful,
});
