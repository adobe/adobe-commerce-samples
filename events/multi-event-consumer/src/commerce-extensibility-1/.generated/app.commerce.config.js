// app.commerce.config.ts
import { defineConfig } from "@adobe/aio-commerce-lib-app/config";
var ORDER_PLACED_EVENT = "observer.sales_order_save_after";
var CUSTOMER_SAVED_EVENT = "observer.customer_save_commit_after";
var PRODUCT_SAVED_EVENT = "observer.catalog_product_save_commit_after";
var CONSUMER_ACTION = "multi-event-consumer/consumer";
var app_commerce_config_default = defineConfig({
  metadata: {
    description: "Routes several Commerce events to one runtime action, which dispatches each event to its own handler action via an OpenWhisk invoke.",
    displayName: "Multi Event Consumer Sample",
    id: "multi-event-consumer-sample",
    version: "1.0.0"
  },
  eventing: {
    commerce: [
      {
        provider: {
          description: "Emits Commerce events consumed by the Consumer sample.",
          label: "Commerce Events Provider"
        },
        events: [
          {
            description: "Triggered when a customer places an order.",
            fields: [
              { name: "increment_id" },
              { name: "customer_email" },
              { name: "grand_total" }
            ],
            label: "Order Placed",
            name: ORDER_PLACED_EVENT,
            runtimeActions: [CONSUMER_ACTION]
          },
          {
            description: "Triggered when a customer record is saved.",
            fields: [
              { name: "entity_id" },
              { name: "email" },
              { name: "firstname" },
              { name: "lastname" }
            ],
            label: "Customer Saved",
            name: CUSTOMER_SAVED_EVENT,
            runtimeActions: [CONSUMER_ACTION]
          },
          {
            description: "Triggered when a product is saved.",
            fields: [{ name: "sku" }, { name: "name" }, { name: "price" }],
            label: "Product Saved",
            name: PRODUCT_SAVED_EVENT,
            runtimeActions: [CONSUMER_ACTION]
          }
        ]
      }
    ]
  }
});
export {
  CONSUMER_ACTION,
  CUSTOMER_SAVED_EVENT,
  ORDER_PLACED_EVENT,
  PRODUCT_SAVED_EVENT,
  app_commerce_config_default as default
};
