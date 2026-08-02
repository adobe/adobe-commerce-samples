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

export const COMMERCE_PROVIDER_KEY = "commerce";
export const BACKOFFICE_PROVIDER_KEY = "backoffice";

export const BACK_OFFICE_PRODUCT_UPDATE_EVENT =
  "be-observer.catalog_product_update";

export const COMMERCE_PRODUCT_UPDATE_EVENT =
  "observer.catalog_product_save_commit_after";

export default defineConfig({
  metadata: {
    id: "circuit-breaker-sample",
    displayName: "Circuit Breaker Sample",
    description:
      "Bidirectional product sync between Commerce and a back-office system, guarded by an infinite-loop breaker.",
    version: "1.0.0",
  },

  eventing: {
    // Commerce-native events. When a product is saved in Commerce, push the change to the back office.
    commerce: [
      {
        provider: {
          description: "Emits Commerce catalog events.",
          label: "Commerce Events Circuit Breaker Sample Provider",
          key: COMMERCE_PROVIDER_KEY,
        },

        events: [
          {
            description: "Triggered when a product is saved in Commerce.",
            fields: [
              // Fields propagated to the back office. Volatile fields such as
              // updated_at are intentionally excluded so echoes are recognizable.
              { name: "sku" },
              { name: "name" },
              { name: "price" },
              { name: "description" },
            ],
            label: "Product Saved",
            name: COMMERCE_PRODUCT_UPDATE_EVENT,

            runtimeActions: ["circuit-breaker/sync-to-backoffice"],
          },
        ],
      },
    ],

    // Back-office events. When the back office updates a product, apply the change to Commerce.
    external: [
      {
        provider: {
          description: "Product updates coming from the external back office.",
          label: "Back Office Event Provider (Circuit Breaker)",
          key: BACKOFFICE_PROVIDER_KEY,
        },

        events: [
          {
            description: "Triggered when the back office updates a product.",
            label: "Back Office Product Update",
            name: BACK_OFFICE_PRODUCT_UPDATE_EVENT,
            runtimeActions: ["circuit-breaker/sync-to-commerce"],
          },
        ],
      },
    ],
  },
});
