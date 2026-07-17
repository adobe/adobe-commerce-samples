# Webhook Endpoint For Adobe Commerce
## Validating add to cart product stock

This is an example Webhook Endpoint that demonstrates how to handle the returned data.

## Table of Contents

- [Introduction](#introduction)
- [Prerequisites](#prerequisites)
- [Explanation](#explanation)

## Introduction

Webhooks enable developers to configure synchronous logic to execute calls to external systems when an Adobe Commerce event triggers. Synchronous calls are required when Commerce needs to immediately compute or validate something (order totals, taxes, payments) using a 3rd-party endpoint and write the result back into Adobe Commerce.

## Prerequisites

Before you begin, ensure you have the following:

- An Adobe Developer account
- Adobe Commerce configured with the Webhooks module. See link for [Adobe Webhooks](https://developer.adobe.com/commerce/extensibility/webhooks/installation/)
- Node.js >=24 and npm installed on your local machine
- App Management enabled and associated with your Adobe Commerce instance. See [App Management](https://developer.adobe.com/commerce/extensibility/app-management/)

## Explanation

When a shopper adds a product to the cart, the app will check whether the item is in stock. If it is, allow the product to be added. Otherwise, display an error message.

### Adobe Commerce Configured Webhook Event:
```observer.checkout_cart_product_add_before```

Webhook registration is declared in `app.commerce.config.ts` using the [`@adobe/aio-commerce-lib-app`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-app/docs/usage.md) webhooks configuration, instead of manually configuring a `webhook.xml` file in a Commerce module. App Management subscribes the webhook and resolves the runtime action URL automatically at install time — no `APP_BUILDER_URL` env var needed. Authentication is also handled automatically (via `requireAdobeAuth`), so no manually issued bearer token or org ID headers are required:

```typescript
webhooks: [
  {
    label: "Validate stock",
    description: "Checks product stock before allowing an add-to-cart request.",
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
];
```

To generate the runtime actions and extension manifest that power App Management, run:

```bash
npm install
npx @adobe/aio-commerce-lib-app generate all
```

Then deploy the app and install it through App Management to complete the webhook registration.

### Adobe Commerce Webhook Payload:
```json
{
    "info": {
        "qty": "string"
    },
    "product": {
        "name": "string",
        "quantity_and_stock_status": {
            "is_in_stock": "boolean",
            "qty": "integer"
        }
    }
}
```
