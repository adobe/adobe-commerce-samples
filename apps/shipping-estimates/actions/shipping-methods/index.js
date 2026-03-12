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
import { getDeliveryConfig } from "../../lib/delivery-config.js";
import { fetchDeliveryEstimates } from "../../lib/delivery-estimate-client.js";
import { HTTP_OK } from "../../lib/http.js";
import { checkoutMetrics } from "../checkout-metrics.js";
import { isWebhookSuccessful, telemetryConfig } from "../telemetry.js";

/**
 * This action returns the list of out-of-process shipping methods for the given request.
 * It has to be configured as Commerce Webhook in the Adobe Commerce Admin.
 *
 * @param {object} params the input parameters
 * @returns {Promise<{statusCode: number, body: {op: string}}>} the response object
 * @see https://developer.adobe.com/commerce/extensibility/webhooks
 */
async function shippingMethods(params) {
  const { logger } = getInstrumentationHelpers();

  logger.debug("Starting shipping methods process");

  try {
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

    // in the case when "raw-http: true" the body needs to be decoded and converted to JSON
    const payload = JSON.parse(atob(params.__ow_body));
    const { rateRequest: request } = payload;

    // if the "raw-http: false" then the rateRequest can be used directly from params
    // const request = params.rateRequest;

    const {
      dest_country_id: destCountryId = "US",
      dest_postcode: destPostcode = "12345",
    } = request;

    logger.info("Received request: ", request);

    const operations = [];

    operations.push(
      createShippingOperation({
        carrier_code: "DPS",
        method: "dps_shipping_one",
        method_title: "Demo Custom Shipping One",
        price: 17,
        cost: 17,
        additional_data: [
          {
            key: "additional_data_key",
            value: "additional_data_value",
          },
          {
            key: "additional_data_key2",
            value: "additional_data_value2",
          },
          {
            key: "additional_data_key3",
            value: "additional_data_value3",
          },
        ],
      }),
    );

    // Based on the postal code, we can add another shipping method
    if (destPostcode > 30_000) {
      operations.push(
        createShippingOperation({
          carrier_code: "DPS",
          method: "dps_shipping_two",
          method_title: "Demo Custom Shipping Two",
          price: 18,
          cost: 18,
          additional_data: {
            key: "additional_data_key",
            value: "additional_data_value",
          },
        }),
      );
    }

    // Based on the country we can add another shipping method
    if (destCountryId === "CA") {
      operations.push(
        createShippingOperation({
          carrier_code: "DPS",
          method: "dps_shipping_ca_one",
          method_title: "Demo Custom Shipping for Canada only",
          price: 18,
          cost: 18,
          additional_data: {
            key: "additional_data_key",
            value: "additional_data_value",
          },
        }),
      );
    }

    // The shipping method can be added based on product custom attribute values.
    // In the next example, the shipping method is added if any of `country_origin` attributes is equal to China
    // The additional data based on attributes or another logic can be added to the shipping method as
    // part of the additional_data key-value array
    const { all_items: cartItems = [] } = request;

    for (const cartItem of cartItems) {
      const { country_origin: country = "" } =
        cartItem?.product?.attributes ?? {};

      if (country.toLowerCase() === "china") {
        operations.push({
          op: "add",
          path: "result",
          value: {
            carrier_code: "DPS",
            method: "dps_shipping_from_china",
            method_title: "Demo Custom Shipping country origin China",
            price: 230,
            cost: 230,
            additional_data: [
              {
                key: "shipped_from",
                value: "China",
              },
              {
                key: "delivery_time",
                value: "15 days",
              },
            ],
          },
        });
      }
    }

    // If the Commerce customer is logged in, the request contains customer data otherwise the customer is set to null
    // In the next example, the shipping method is added based on the Customer group id
    const { customer: Customer = {} } = request;

    if (
      Customer !== null &&
      typeof Customer === "object" &&
      Object.hasOwn(Customer, "group_id") &&
      Customer.group_id === "1"
    ) {
      operations.push({
        op: "add",
        path: "result",
        value: {
          carrier_code: "DPS",
          method: "dps_shipping_customer_group_one",
          method_title: "Demo Custom Shipping based on customer group",
          price: 7,
          cost: 7,
          additional_data: [
            {
              key: "group_special",
              value: "-20%",
            },
          ],
        },
      });
    }

    // You can remove the shipping method based on some conditions.
    // For this, provide the method name within the remove flag set to true
    //
    // operations.push({
    //   op: 'add',
    //   path: 'result',
    //   value: {
    //     method: 'flatrate',
    //     remove: true,
    //   },
    // });

    logger.info(`Generated ${operations.length} shipping method operations`);

    await enrichWithDeliveryEstimates(operations, request, params, logger);

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
    return webhookErrorResponse(`Server error: ${error.message}`);
  }
}

/**
 * Finds the matching delivery estimate for a Commerce carrier code.
 */
function findEstimateForCarrier(estimates, commerceCarrier, mapping) {
  const apiCarrier = mapping[commerceCarrier]?.toLowerCase();

  return estimates.find(
    (e) =>
      e.carrier_code?.toLowerCase() === apiCarrier ||
      e.carrier_code?.toLowerCase() === commerceCarrier.toLowerCase(),
  );
}

/**
 * Builds delivery date additional_data entries from an estimate.
 */
function buildDeliveryData(estimate) {
  return [
    { key: "delivery_date", value: estimate.delivery_date ?? "" },
    { key: "safe_delivery_date", value: estimate.safe_delivery_date ?? "" },
    { key: "transit_days", value: String(estimate.transit_days ?? "") },
    { key: "cutoff_datetime_utc", value: estimate.cutoff_datetime_utc ?? "" },
  ].filter((d) => d.value !== "");
}

/**
 * Normalizes existing additional_data to an array.
 */
function normalizeAdditionalData(additionalData) {
  if (Array.isArray(additionalData)) {
    return additionalData;
  }
  if (additionalData) {
    return [additionalData];
  }
  return [];
}

/**
 * Applies delivery date data to matching shipping operations.
 */
function applyEstimatesToOperations(operations, estimates, mapping) {
  for (const op of operations) {
    if (op.op !== "add" || !op.value?.carrier_code) {
      continue;
    }

    const estimate = findEstimateForCarrier(
      estimates,
      op.value.carrier_code,
      mapping,
    );

    if (!estimate) {
      continue;
    }

    const deliveryData = buildDeliveryData(estimate);
    if (deliveryData.length === 0) {
      continue;
    }

    const existingData = normalizeAdditionalData(op.value.additional_data);
    op.value.additional_data = [...existingData, ...deliveryData];
  }
}

/**
 * Enriches shipping operations with delivery date estimates from the external API.
 * Fails silently — if the API is down or config is missing, operations are returned unchanged.
 */
async function enrichWithDeliveryEstimates(
  operations,
  request,
  params,
  logger,
) {
  try {
    const config = await getDeliveryConfig({ logLevel: params.LOG_LEVEL });

    if (!(config.enabled && config.api_base_url && config.api_key)) {
      logger.debug("Delivery estimates disabled or not configured, skipping");
      return;
    }

    const result = await fetchDeliveryEstimates({
      apiBaseUrl: config.api_base_url,
      apiKey: config.api_key,
      origin: config.origin,
      destination: {
        country_code: request.dest_country_id,
        postal_code: request.dest_postcode,
        city: request.dest_city,
      },
      carriers: config.default_carriers,
      serviceLevels: config.default_service_levels,
      logLevel: params.LOG_LEVEL,
    });

    if (!result.estimates?.length) {
      logger.debug("No delivery estimates returned from API");
      return;
    }

    applyEstimatesToOperations(
      operations,
      result.estimates,
      config.carrier_code_mapping ?? {},
    );

    logger.info("Enriched shipping operations with delivery estimates");
  } catch (error) {
    logger.error(
      "Failed to enrich with delivery estimates (continuing without):",
      error.message,
    );
  }
}

/**
 * Creates a shipping operation
 *
 * @param {object} carrierData - The carrier data for the shipping operation
 * @returns {object} The shipping operation object
 */
function createShippingOperation(carrierData) {
  return {
    op: "add",
    path: "result",
    value: carrierData,
  };
}

// Export the instrumented function as main
export const main = instrumentEntrypoint(shippingMethods, {
  ...telemetryConfig,
  isSuccessful: isWebhookSuccessful,
});
