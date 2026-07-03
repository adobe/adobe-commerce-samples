# Custom Menu — Admin UI SDK V2

Adds a custom menu item to the Adobe Commerce Admin panel that opens a page inside your App Builder application.

## What you get

A menu entry, **First App on App Builder**, that opens a custom page in the Commerce Admin. The page displays a welcome message along with the Adobe IMS Org ID of the signed-in admin user, demonstrating how IMS context is made available to your app.

The menu definition lives in `app.commerce.config.ts`. The page component lives in `src/commerce-backend-ui-2/web-src/src/pages/main-page.tsx`.

## How it works

1. Merchant opens the Commerce Admin and selects **First App on App Builder** from the menu
2. Commerce Admin loads your App Builder web app inside an iframe
3. The app resolves the IMS context via the Admin UI SDK and renders the welcome page with the signed-in admin's IMS Org ID

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

- [Admin UI SDK — Custom Menu](https://developer.adobe.com/commerce/extensibility/admin-ui-sdk/extension-points/menu/)
- [App Management](https://developer.adobe.com/commerce/extensibility/app-management/)
