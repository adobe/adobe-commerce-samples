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
- A Slack App configured to receive incoming webhooks.

## Explanation

The runtime action ```events/customer-login``` will receive the Commerce event payload and send to the configured Slack channel.

### Commerce event payload example:

```json
{
    "data": {
        "key": "b2d1addf-50af-4ae9-8d29-26a786d5161f",
        "value": {},
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
    "id": "5c37b224-349e-4cc2-a621-a7ab419654e4",
    "source": "urn:uuid:420ba332-4e1c-4373-8e23-81175c9e79fd",
    "specversion": "1.0",
    "type": "com.adobe.commerce.observer.customer_login",
    "datacontenttype": "application/json",
    "time": "2024-05-31T12:51:03.902Z",
    "event_id": "dafb64a8-7823-4be0-8291-cf46baf66ede",
    "recipient_client_id": "531f2f763b2f4c34b03001d8bf2bd4df"
}
```
