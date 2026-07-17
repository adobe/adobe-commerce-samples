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

/**
 * @typedef {object} Product
 * @property {string} sku - Unique product identifier.
 * @property {string} name - Product display name.
 * @property {string} description - Product description.
 * @property {number|string} price - Product price.
 */

/**
 * Normalizes the product from either event shape into a stable object. Commerce
 * delivers the payload under `data.value`; the back-office event this sample
 * publishes mirrors that shape.
 *
 * @param {Record<string, unknown>} params - The runtime action parameters.
 * @returns {Product} The normalized product.
 */
export function extractProduct(params) {
  const value = params?.data?.value ?? params?.data ?? {};
  return {
    description: value.description,
    name: value.name,
    price: value.price,
    sku: value.sku,
  };
}

/**
 * Builds the breaker state key for a product.
 *
 * @param {Product} product - The normalized product.
 * @returns {string} A key scoped to the product.
 */
export const productKey = (product) => `product_${product.sku}`;

/**
 * Builds the breaker fingerprint from the fields we propagate — a change in any
 * of them is a real change worth syncing.
 *
 * @param {Product} product - The normalized product.
 * @returns {Product} The subset of fields that define a meaningful change.
 */
export const productFingerprint = (product) => ({
  description: product.description,
  name: product.name,
  price: product.price,
  sku: product.sku,
});
