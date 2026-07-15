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
- Node.js >=22 <=24 and npm installed on your local machine
- App Builder project created and configured to work with I/O Events
- App Management enabled and associated with your Adobe Commerce instance. See [App Management](https://developer.adobe.com/commerce/extensibility/app-management/)
- A Slack App configured to receive incoming webhooks. See link: [Slack API](https://api.slack.com/messaging/webhooks)

## Explanation

The runtime action ```events/customer-login``` will receive the Commerce event payload and send to the configured Slack channel.

Event registration is declared in `app.commerce.config.js` using the [`@adobe/aio-commerce-lib-app`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-app/docs/usage.md) eventing configuration, instead of manually configuring an `io_events.xml` file in a Commerce module. App Management creates the I/O Events provider and subscribes `observer.customer_login` automatically when the app is installed:

```javascript
eventing: {
  commerce: [
    {
      provider: {
        label: "Customer Login Events",
        description: "Events emitted when a customer logs in to Adobe Commerce",
      },
      events: [
        {
          name: "observer.customer_login",
          label: "Customer Login",
          description: "Triggered when a customer logs in",
          fields: [{ name: "customer.firstname" }, { name: "customer.lastname" }],
          runtimeActions: ["events/customer-login"],
        },
      ],
    },
  ],
}
```

To generate the runtime actions and extension manifest that power App Management, run:

```bash
npm install
npx @adobe/aio-commerce-lib-app generate all
```

Then deploy the app and install it through App Management to complete the event registration.

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
