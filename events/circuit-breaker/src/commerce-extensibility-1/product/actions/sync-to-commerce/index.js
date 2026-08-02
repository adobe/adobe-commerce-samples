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
 * Back office -> Commerce.
 *
 * Handles the back-office `be-observer.catalog_product_update` event and applies
 * the change to Commerce. The Commerce save this triggers fires
 * `catalog_product_save_commit_after`, which sync-to-backoffice would echo back
 * to the back office — wrapping `main` with the breaker stops that loop.
 */

import {
  getCommerceClient,
  resolveIoEventCode,
} from "@adobe/aio-commerce-lib-app";
import { resolveImsAuthParams } from "@adobe/aio-commerce-sdk/auth";
import { ok } from "@adobe/aio-commerce-sdk/core/responses";
import AioLogger from "@adobe/aio-lib-core-logging";

import appConfig, {
  BACK_OFFICE_PRODUCT_UPDATE_EVENT,
} from "#app.commerce.config";
import { withCircuitBreaker } from "#lib/circuit-breaker";
import {
  extractProduct,
  productFingerprint,
  productKey,
} from "#product/change";

/**
 * Applies a back-office product update to Commerce.
 *
 * @param {Record<string, unknown>} params - Event payload and action inputs.
 * @returns {Promise<object>} The action response.
 */
async function syncToCommerce(params) {
  const logger = AioLogger("sync-to-commerce", {
    level: params.LOG_LEVEL || "info",
  });

  const product = extractProduct(params);

  const client = await getCommerceClient(resolveImsAuthParams(params));
  await client
    .put(`products/${encodeURIComponent(product.sku)}`, {
      json: {
        product: {
          description: product.description,
          name: product.name,
          price: product.price,
          sku: product.sku,
        },
      },
    })
    .json();

  logger.info(`Synced product ${product.sku} from back office to Commerce.`);
  return ok({ body: { sku: product.sku, synced: true } });
}

export const main = withCircuitBreaker(syncToCommerce, {
  // eventTypes: the event(s) this action guards; other types pass through.
  // identify: key + fingerprint of the change, so its echo is recognized later.
  eventTypes: [
    resolveIoEventCode(
      appConfig.metadata.id,
      BACK_OFFICE_PRODUCT_UPDATE_EVENT,
      "external",
    ),
  ],
  identify: (params) => {
    const product = extractProduct(params);
    return {
      fingerprint: productFingerprint(product),
      key: productKey(product),
    };
  },
});
