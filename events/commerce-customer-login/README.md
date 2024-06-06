# Adobe I/O Events Sample

This is an example for I/O Events.

## Table of Contents

- [Introduction](#introduction)
- [Prerequisites](#prerequisites)
- [Explanation](#explanation)

## Introduction

With Adobe I/O Events, developers can create event-driven applications that take action when a shopper performs an action on an Adobe product. In this example the app will listen to the Adobe Commerce ```observer.customer_login``` event, get the payload and send to a Slack channel.

## Prerequisites

Before you begin, ensure you have the following:

- An Adobe Developer account
- Node.js and npm installed on your local machine (nvm 18.x.x (Mac/Linux) or nvm-windows (Windows))
- App Builder project created and configured to work with I/O Events.
- A Slack App configured to receive incoming webhooks. See link: [Slack API](https://api.slack.com/messaging/webhooks)

## Explanation

The runtime action ```events/customer-login``` will receive the Commerce event payload and send to the configured Slack channel.

### Commerce configured io_events.xml file:

```xml
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_AdobeCommerceEventsClient:etc/io_events.xsd">
    <event name="observer.customer_login">
        <fields>
            <field name="customer.firstname" />
            <field name="customer.lastname" />
        </fields>
    </event>
</config>
```

### Commerce event payload example:

```json
{
    "data": {
        "key": "4fbbb851-285f-4733-a3b4-77556e019691",
        "value": {
            "customer": {
                "firstname": "John",
                "lastname": "Doe"
            }
        },
        "source": "evergreen.evergreen_staging",
        "_metadata": {
            "commerceEdition": "Adobe Commerce + B2B",
            "commerceVersion": "2.4.6-p4",
            "eventsClientVersion": "1.5.0",
            "storeId": "1",
            "websiteId": "1",
            "storeGroupId": "1"
        }
    },
    "id": "f7813962-c119-401c-aa8c-266421aa1053",
    "source": "urn:uuid:420ba332-4e1c-4373-8e23-81175c9e79fd",
    "specversion": "1.0",
    "type": "com.adobe.commerce.observer.customer_login",
    "datacontenttype": "application/json",
    "time": "2024-06-04T16:05:04.542Z",
    "event_id": "7c9ae597-f382-49bc-85b7-3a2b4da6e0bf",
    "recipient_client_id": "531f2f763b2f4c34b03001d8bf2bd4df"
}
```
