/**
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/*
 * Commerce -> back office.
 *
 * Handles the Commerce `catalog_product_save_commit_after` event and pushes the
 * change to the back office by publishing a `be-observer.catalog_product_update`
 * event on the external provider. The back office applying that change would
 * echo it back into Commerce — wrapping `main` with the breaker stops that loop.
 */

import { publishEvent } from "@adobe/aio-commerce-lib-app";
import { resolveImsAuthParams } from "@adobe/aio-commerce-sdk/auth";
import { ok } from "@adobe/aio-commerce-sdk/core/responses";
import { createAdobeIoEventsApiClient } from "@adobe/aio-commerce-sdk/events/io-events";
import AioLogger from "@adobe/aio-lib-core-logging";

import { BACKOFFICE_PROVIDER_KEY } from "#config";
import { withCircuitBreaker } from "#lib/circuit-breaker";
import {
  extractProduct,
  productFingerprint,
  productKey,
} from "#product/change";
import {
  BACK_OFFICE_PRODUCT_UPDATE_EVENT,
  COMMERCE_PRODUCT_UPDATE_EVENT,
} from "#product/constants";

/**
 * Pushes a Commerce product save to the back office by publishing the
 * back-office event.
 *
 * @param {Record<string, unknown>} params - Event payload and action inputs.
 * @returns {Promise<object>} The action response.
 */
async function syncToBackoffice(params) {
  const logger = AioLogger("sync-to-backoffice", {
    level: params.LOG_LEVEL || "info",
  });

  const product = extractProduct(params);
  const client = createAdobeIoEventsApiClient({
    auth: resolveImsAuthParams(params),
  });

  await publishEvent({
    client,
    event: BACK_OFFICE_PRODUCT_UPDATE_EVENT,
    payload: { value: product },
    provider: BACKOFFICE_PROVIDER_KEY,
  });

  logger.info(`Synced product ${product.sku} from Commerce to back office.`);
  return ok({ body: { sku: product.sku, synced: true } });
}

export const main = withCircuitBreaker(syncToBackoffice, {
  // eventTypes: the event(s) this action guards; other types pass through.
  // identify: key + fingerprint of the change, so its echo is recognized later.
  eventTypes: [COMMERCE_PRODUCT_UPDATE_EVENT],
  identify: (params) => {
    const product = extractProduct(params);
    return {
      fingerprint: productFingerprint(product),
      key: productKey(product),
    };
  },
});
