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

### Adobe Commerce Configured Webhook Event:
```observer.checkout_cart_product_add_before```

### Adobe Commerce Configured webhook.xml file:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_AdobeCommerceWebhooks:etc/webhooks.xsd">
    <method name="observer.checkout_cart_product_add_before" type="before">
        <hooks>
            <batch>
                <hook name="validate_stock" url="{env:APP_BUILDER_URL}/product-validate-stock"
                    timeout="5000"
                    softTimeout="100" priority="100" required="true"
                    fallbackErrorMessage="The product stock validation failed">
                    <headers>
                        <header name="Authorization">Bearer {env:APP_VALIDATE_STOCK_AUTHORIZATION_TOKEN}</header>
                        <header name="x-gw-ims-org-id">{env:APP_VALIDATE_STOCK_ORG_ID}</header>
                    </headers>
                    <fields>
                        <field name='info.qty' source='data.info.qty' />
                        <field name='product.name' source='data.product.name' />
                        <field name='product.quantity_and_stock_status.is_in_stock' source='data.product.quantity_and_stock_status.is_in_stock' />
                        <field name='product.quantity_and_stock_status.qty' source='data.product.quantity_and_stock_status.qty' />
                    </fields>
                </hook>
            </batch>
        </hooks>
    </method>
</config>
```

### Adobe Commerce Webhook Response:
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