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

// Event names as declared below, reused by the consumer (src/commerce-extensibility-1/actions/consumer)
// to match each incoming event back to the action it should be dispatched to.
export const ORDER_PLACED_EVENT = "observer.sales_order_save_after";
export const CUSTOMER_SAVED_EVENT = "observer.customer_save_commit_after";
export const PRODUCT_SAVED_EVENT = "observer.catalog_product_save_commit_after";

// All three events below share this single runtime action.
export const CONSUMER_ACTION = "multi-event-consumer/consumer";

export default defineConfig({
  metadata: {
    description:
      "Routes several Commerce events to one runtime action, which dispatches each event to its own handler action via an OpenWhisk invoke.",
    displayName: "Multi Event Consumer Sample",
    id: "multi-event-consumer-sample",
    version: "1.0.0",
  },
  eventing: {
    commerce: [
      {
        provider: {
          description: "Emits Commerce events consumed by the Consumer sample.",
          label: "Commerce Events Provider",
        },
        events: [
          {
            description: "Triggered when a customer places an order.",
            fields: [
              { name: "increment_id" },
              { name: "customer_email" },
              { name: "grand_total" },
            ],
            label: "Order Placed",
            name: ORDER_PLACED_EVENT,
            runtimeActions: [CONSUMER_ACTION],
          },
          {
            description: "Triggered when a customer record is saved.",
            fields: [
              { name: "entity_id" },
              { name: "email" },
              { name: "firstname" },
              { name: "lastname" },
            ],
            label: "Customer Saved",
            name: CUSTOMER_SAVED_EVENT,
            runtimeActions: [CONSUMER_ACTION],
          },
          {
            description: "Triggered when a product is saved.",
            fields: [{ name: "sku" }, { name: "name" }, { name: "price" }],
            label: "Product Saved",
            name: PRODUCT_SAVED_EVENT,
            runtimeActions: [CONSUMER_ACTION],
          },
        ],
      },
    ],
  },
});
