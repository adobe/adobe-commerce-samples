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

/** biome-ignore-all assist/source/useSortedKeys: Makes config more difficult to read */

import { defineConfig } from "@adobe/aio-commerce-lib-app/config";

export default defineConfig({
  metadata: {
    id: "add-to-cart-stock-validation",
    displayName: "Add to Cart Stock Validation",
    version: "1.0.0",
    description:
      "Validates product stock when a shopper adds an item to the cart.",
  },

  webhooks: [
    {
      label: "Validate stock",
      description:
        "Checks product stock before allowing an add-to-cart request.",
      category: "validation",
      runtimeAction: "add-to-cart-stock-validation/product-validate-stock",
      webhook: {
        webhook_method: "observer.checkout_cart_product_add_before",
        webhook_type: "before",
        batch_name: "stock",
        hook_name: "validate_stock",
        method: "POST",
        priority: 100,
        required: true,
        soft_timeout: 100,
        timeout: 5000,
        fallback_error_message: "The product stock validation failed",
        fields: [
          { name: "info.qty", source: "data.info.qty" },
          { name: "product.name", source: "data.product.name" },
          {
            name: "product.quantity_and_stock_status.is_in_stock",
            source: "data.product.quantity_and_stock_status.is_in_stock",
          },
          {
            name: "product.quantity_and_stock_status.qty",
            source: "data.product.quantity_and_stock_status.qty",
          },
        ],
      },
    },
  ],
});
