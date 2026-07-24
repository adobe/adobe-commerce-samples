// app.commerce.config.ts
import { defineConfig } from "@adobe/aio-commerce-lib-app/config";
var COMMERCE_PROVIDER_KEY = "commerce";
var BACKOFFICE_PROVIDER_KEY = "backoffice";
var BACK_OFFICE_PRODUCT_UPDATE_EVENT = "be-observer.catalog_product_update";
var COMMERCE_PRODUCT_UPDATE_EVENT = "observer.catalog_product_save_commit_after";
var app_commerce_config_default = defineConfig({
  metadata: {
    id: "circuit-breaker-sample",
    displayName: "Circuit Breaker Sample",
    description: "Bidirectional product sync between Commerce and a back-office system, guarded by an infinite-loop breaker.",
    version: "1.0.0"
  },
  eventing: {
    // Commerce-native events. When a product is saved in Commerce, push the change to the back office.
    commerce: [
      {
        provider: {
          description: "Emits Commerce catalog events.",
          label: "Commerce Events Circuit Breaker Sample Provider",
          key: COMMERCE_PROVIDER_KEY
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
              { name: "description" }
            ],
            label: "Product Saved",
            name: COMMERCE_PRODUCT_UPDATE_EVENT,
            runtimeActions: ["circuit-breaker/sync-to-backoffice"]
          }
        ]
      }
    ],
    // Back-office events. When the back office updates a product, apply the change to Commerce.
    external: [
      {
        provider: {
          description: "Product updates coming from the external back office.",
          label: "Back Office Event Provider (Circuit Breaker)",
          key: BACKOFFICE_PROVIDER_KEY
        },
        events: [
          {
            description: "Triggered when the back office updates a product.",
            label: "Back Office Product Update",
            name: BACK_OFFICE_PRODUCT_UPDATE_EVENT,
            runtimeActions: ["circuit-breaker/sync-to-commerce"]
          }
        ]
      }
    ]
  }
});
export {
  BACKOFFICE_PROVIDER_KEY,
  BACK_OFFICE_PRODUCT_UPDATE_EVENT,
  COMMERCE_PRODUCT_UPDATE_EVENT,
  COMMERCE_PROVIDER_KEY,
  app_commerce_config_default as default
};
