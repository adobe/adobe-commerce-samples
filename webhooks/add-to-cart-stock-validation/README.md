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
- Node.js and npm installed on your local machine (nvm 18.x.x (Mac/Linux) or nvm-windows (Windows))

## Explanation

When a shopper adds a product to the cart, the app will check whether the item is in stock. If it is, allow the product to be added. Otherwise, display an error message.

### Adobe Commerce Configured Webhook:
```observer.checkout_cart_product_add_before```