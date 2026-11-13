/*
Copyright 2024 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import crypto from "node:crypto";

import { Core } from "@adobe/aio-sdk";
import got from "got";
import Oauth1a from "oauth-1.0a";

import { resolveAuthOptions } from "./adobe-auth.js";
import { HTTP_INTERNAL_ERROR, HTTP_OK } from "./http.js";

/**
 * Provides an instance of the Commerce HTTP client
 *
 * @param {string} commerceUrl Base URL of the Commerce API
 * @param {object} options Configuration options for the client
 * @param {object} [options.integrationOptions] Integration options for OAuth1.0a
 * @param {object} [options.imsOptions] IMS options for bearer token authentication
 * @param {object} options.logger Logger instance for logging requests
 * @returns {Promise<object>} Configured Got instance for making HTTP requests
 */
function getCommerceHttpClient(
  commerceUrl,
  { integrationOptions, imsOptions, logger },
) {
  if (!commerceUrl) {
    throw new Error("Commerce URL must be provided");
  }

  const commerceGot = got.extend({
    http2: true,
    responseType: "json",
    prefixUrl: commerceUrl,
    headers: {
      "Content-Type": "application/json",
    },
    hooks: {
      beforeRequest: [
        (options) => logger.debug(`Request [${options.method}] ${options.url}`),
      ],
      beforeRetry: [
        (options, error, retryCount) =>
          logger.debug(
            `Retrying request [${options.method}] ${options.url} - count: ${retryCount} - error: ${error.code} - ${error.message}`,
          ),
      ],
      beforeError: [
        (error) => {
          const { response } = error;
          if (response?.body) {
            error.responseBody = response.body;
          }
          return error;
        },
      ],
      afterResponse: [
        (response) => {
          logger.debug(
            `Response [${response.request.options.method}] ${response.request.options.url} - ${response.statusCode} ${response.statusMessage}`,
          );
          return response;
        },
      ],
    },
  });

  if (integrationOptions) {
    logger.debug("Using Commerce client with integration options");
    const oauth1aHeaders = oauth1aHeadersProvider(integrationOptions);

    return commerceGot.extend({
      handlers: [
        (options, next) => {
          options.headers = {
            ...options.headers,
            ...oauth1aHeaders(options.url.toString(), options.method),
          };
          return next(options);
        },
      ],
    });
  }

  logger.debug("Using Commerce client with IMS options");
  return commerceGot.extend({
    headers: {
      "x-ims-org-id": imsOptions.imsOrgId,
      "x-api-key": imsOptions.apiKey,
      Authorization: `Bearer ${imsOptions.accessToken}`,
    },
  });
}

/**
 * Generates OAuth1.0a headers for the given integration options
 *
 * @param {object} integrationOptions Options for OAuth1.0a
 * @returns {Function} Function that returns OAuth1.0a headers for a given URL and method
 */
function oauth1aHeadersProvider(integrationOptions) {
  const oauth = Oauth1a({
    consumer: {
      key: integrationOptions.consumerKey,
      secret: integrationOptions.consumerSecret,
    },
    signature_method: "HMAC-SHA256",
    hash_function: (baseString, key) =>
      crypto.createHmac("sha256", key).update(baseString).digest("base64"),
  });

  const oauthToken = {
    key: integrationOptions.accessToken,
    secret: integrationOptions.accessTokenSecret,
  };

  return (url, method) =>
    oauth.toHeader(oauth.authorize({ url, method }, oauthToken));
}

/**
 * Initializes the Commerce client according to the given params
 *
 * @param {object} params to initialize the client
 * @returns {object} the available api calls
 */
async function getAdobeCommerceClient(params) {
  const logger = Core.Logger("adobe-commerce-client", {
    level: params.LOG_LEVEL ?? "info",
  });
  const options = {
    logger,
    ...(await resolveAuthOptions(params)),
  };

  const commerceGot = await getCommerceHttpClient(
    params.COMMERCE_BASE_URL ?? process.env.COMMERCE_BASE_URL,
    options,
  );

  const wrapper = async (callable) => {
    try {
      const message = await callable();
      return { success: true, message };
    } catch (e) {
      if (e.code === "ERR_GOT_REQUEST_ERROR") {
        logger.error("Error while calling Commerce API", e);
        return {
          success: false,
          statusCode: HTTP_INTERNAL_ERROR,
          message: `Unexpected error, check logs. Original error "${e.message}"`,
        };
      }
      return {
        success: false,
        statusCode: e.response?.statusCode || HTTP_INTERNAL_ERROR,
        message: e.message,
        body: e.responseBody,
      };
    }
  };

  return {
    // Out-of-process Payment API: https://developer.adobe.com/commerce/extensibility/starter-kit/checkout/payment-reference/
    createOopePaymentMethod: async (paymentMethod) =>
      wrapper(() =>
        commerceGot("V1/oope_payment_method/", {
          method: "POST",
          json: paymentMethod,
        }).json(),
      ),
    getOopePaymentMethod: async (paymentMethodCode) =>
      wrapper(() =>
        commerceGot(`V1/oope_payment_method/${paymentMethodCode}`, {
          method: "GET",
        }).json(),
      ),
    getOopePaymentMethods: async () =>
      wrapper(() =>
        commerceGot("V1/oope_payment_method/", {
          method: "GET",
        }).json(),
      ),
    // Out-of-process Shipping API: https://developer.adobe.com/commerce/extensibility/starter-kit/checkout/shipping-reference/
    createOopeShippingCarrier: async (shippingCarrier) =>
      wrapper(() =>
        commerceGot("V1/oope_shipping_carrier", {
          method: "POST",
          json: shippingCarrier,
        }).json(),
      ),
    getOopeShippingCarrier: async (shippingCarrierCode) =>
      wrapper(() =>
        commerceGot(`V1/oope_shipping_carrier/${shippingCarrierCode}`, {
          method: "GET",
        }).json(),
      ),
    getOopeShippingCarriers: async () =>
      wrapper(() =>
        commerceGot("V1/oope_shipping_carrier/", {
          method: "GET",
        }).json(),
      ),
    // Out-of-process Tax API
    createTaxIntegration: async (taxIntegration) =>
      wrapper(() =>
        commerceGot("V1/oope_tax_management/tax_integration", {
          method: "POST",
          json: taxIntegration,
        }).json(),
      ),
    getTaxIntegration: async (taxIntegrationCode) =>
      wrapper(() =>
        commerceGot(
          `V1/oope_tax_management/tax_integration/${taxIntegrationCode}`,
          {
            method: "GET",
          },
        ).json(),
      ),
    getTaxIntegrations: async () =>
      wrapper(() =>
        commerceGot("V1/oope_tax_management/tax_integration", {
          method: "GET",
        }).json(),
      ),
    // Commerce Eventing API: https://developer.adobe.com/commerce/extensibility/events/api/
    configureEventing: (merchantId, environmentId, workspaceConfig) =>
      wrapper(() =>
        commerceGot("V1/eventing/updateConfiguration", {
          method: "PUT",
          json: {
            config: {
              enabled: true,
              merchant_id: merchantId,
              environment_id: environmentId,
              workspace_configuration: JSON.stringify(workspaceConfig),
            },
          },
        }).json(),
      ),
    getEventProviders: async () =>
      wrapper(() =>
        commerceGot("V1/eventing/getEventProviders", {
          method: "GET",
        }).json(),
      ),
    addEventProvider: async (eventProviderData) =>
      wrapper(() =>
        commerceGot("V1/eventing/eventProvider", {
          method: "POST",
          json: eventProviderData,
        }).json(),
      ),
    subscribeEvent: async (subscription) =>
      wrapper(() =>
        commerceGot("V1/eventing/eventSubscribe", {
          method: "POST",
          json: subscription,
        }).json(),
      ),
    // Commerce Rest API: https://developer.adobe.com/commerce/webapi/rest/quick-reference/
    getOrderByMaskedCartId: (cartId) =>
      wrapper(() =>
        commerceGot(
          `V1/orders?searchCriteria[filter_groups][0][filters][0][field]=masked_quote_id&searchCriteria[filter_groups][0][filters][0][value]=${cartId}&searchCriteria[filter_groups][0][filters][0][condition_type]=eq`,
        ).json(),
      ),
    invoiceOrder: async (orderId) =>
      wrapper(() =>
        commerceGot(`V1/order/${orderId}/invoice`, {
          method: "POST",
          json: { capture: true },
        }).json(),
      ),
    refundInvoice: (invoiceId) =>
      wrapper(() =>
        commerceGot(`V1/invoice/${invoiceId}/refund`, {
          method: "POST",
        }).json(),
      ),
    get: async (requestUrl) =>
      wrapper(() =>
        commerceGot(`V1/${requestUrl}`, {
          method: "GET",
        }).json(),
      ),
    post: async (requestUrl, body) =>
      wrapper(() =>
        commerceGot(`V1/${requestUrl}`, {
          method: "POST",
          json: body,
        }).json(),
      ),
  };
}

/**
 * Returns webhook response error according to Adobe Commerce Webhooks spec.
 *
 * @param {string} message the error message.
 * @returns {object} the response object
 * @see https://developer.adobe.com/commerce/extensibility/webhooks/responses/#responses
 */
function webhookErrorResponse(message) {
  return {
    statusCode: HTTP_OK,
    body: {
      op: "exception",
      message,
    },
  };
}

/**
 * Returns webhook response success according to Adobe Commerce Webhooks spec.
 *
 * @returns {object} the response object
 * @see https://developer.adobe.com/commerce/extensibility/webhooks/responses/#responses
 */
function webhookSuccessResponse() {
  return {
    statusCode: HTTP_OK,
    body: {
      op: "success",
    },
  };
}

/**
 * Verifies the signature of the webhook request.
 * @param {object} params input parameters
 * @param {object} params.__ow_headers request headers
 * @param {string} params.__ow_body request body, requires the following annotation in the action `raw-http: true`
 * @param {string} params.COMMERCE_WEBHOOKS_PUBLIC_KEY the public key to verify the signature configured in the Commerce instance
 * @returns {{success: boolean}|{success: boolean, error: string}} weather the signature is valid or not
 * @see https://developer.adobe.com/commerce/extensibility/webhooks/signature-verification
 */
function webhookVerify({
  __ow_headers: headers = {},
  __ow_body: body,
  COMMERCE_WEBHOOKS_PUBLIC_KEY: publicKey,
}) {
  const signature = headers["x-adobe-commerce-webhook-signature"];
  if (!signature) {
    return {
      success: false,
      error:
        "Header `x-adobe-commerce-webhook-signature` not found. Make sure Webhooks signature is enabled in the Commerce instance.",
    };
  }
  if (!body) {
    return {
      success: false,
      error:
        "Request body not found. Make sure the the action is configured with `raw-http: true`.",
    };
  }
  if (!publicKey) {
    return {
      success: false,
      error:
        "Public key not found. Make sure the the action is configured with the input `COMMERCE_WEBHOOKS_PUBLIC_KEY` and it is defined in .env file.",
    };
  }

  const verifier = crypto.createVerify("SHA256");
  verifier.update(body);
  const success = verifier.verify(publicKey, signature, "base64");
  return {
    success,
    ...(!success && { error: "Signature verification failed." }),
  };
}

export {
  getAdobeCommerceClient,
  webhookErrorResponse,
  webhookSuccessResponse,
  webhookVerify,
};
