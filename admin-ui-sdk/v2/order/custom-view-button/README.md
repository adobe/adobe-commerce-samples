# Order Custom View Button — Admin UI SDK V2

Adds custom view buttons to the order view in the Adobe Commerce Admin panel.

When a merchant opens an order in **Sales → Orders**, Commerce renders your buttons alongside the built-in ones. Each button opens an iframe backed by your App Builder extension.

## What you get

Two sample view buttons:

| Button | Behavior |
|---|---|
| **Delete** | Opens an iframe showing the order ID to delete |
| **Create Return** | Opens an iframe showing the order ID and a **Done** button that closes the iframe |

The button definitions live in `app.commerce.config.ts`. The page implementations live in `src/commerce-backend-ui-2/web-src/src/pages/`.

## How it works

1. Merchant opens an order in the Commerce Admin
2. Commerce renders the **Delete** and **Create Return** buttons declared in `app.commerce.config.ts`
3. Clicking a button opens its iframe, which mounts the corresponding page component
4. The page reads the order ID via `useOrderViewButtonContext()` and can close the iframe via `useHostConnection()`

## Prerequisites

- [Node.js](https://nodejs.org/) >= 24
- [Adobe I/O CLI](https://developer.adobe.com/runtime/docs/guides/tools/cli_install/) (`npm install -g @adobe/aio-cli`)
- An App Builder project on [Adobe Developer Console](https://developer.adobe.com/console/) with a workspace configured for your Commerce instance
- Adobe Commerce >= 2.4.7 with the [Admin UI SDK module](https://developer.adobe.com/commerce/extensibility/admin-ui-sdk/) installed and enabled

## Setup

**1. Install dependencies**

```bash
npm install
```

**2. Connect to your App Builder workspace**

```bash
aio console org select
aio console project select
aio console workspace select
aio app use -g --no-input --overwrite
```

**3. Deploy**

```bash
aio app deploy
```

**4. Associate and install on Commerce**

Associate and install the app with your Commerce instance through the App Management UI in the Commerce Admin. See [App Management](https://developer.adobe.com/commerce/extensibility/app-management/) for the full walkthrough.

To verify the installation, navigate to **Stores → Configuration → Adobe Services → Admin UI SDK → Configure Extensions** and check the **Installed Extensions** tab — the app should appear there once successfully installed.

## More information

- [Admin UI SDK — Order View Buttons](https://developer.adobe.com/commerce/extensibility/admin-ui-sdk/extension-points/order/view-button/)
- [App Management](https://developer.adobe.com/commerce/extensibility/app-management/)
