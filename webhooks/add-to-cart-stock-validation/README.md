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

Webhook registration is declared in `app.commerce.config.ts` using the [`@adobe/aio-commerce-lib-app`](https://developer.adobe.com/commerce/extensibility/app-management/) webhooks configuration.

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
