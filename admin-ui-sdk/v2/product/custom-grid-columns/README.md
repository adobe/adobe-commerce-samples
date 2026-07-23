# Product Custom Grid Columns — Admin UI SDK V2

Adds custom columns to the product grid in the Adobe Commerce Admin panel.

When a merchant opens **Catalog → Products**, Commerce calls your App Builder runtime action with the IDs of the visible products. Your action returns the column values; Commerce renders them inline alongside the built-in columns.

## What you get

One sample column:

| Column ID | Label | Type |
|---|---|---|
| `first_column` | App Column | `string` |

The column definitions live in `app.commerce.config.ts`. The data logic lives in `src/commerce-backend-ui-2/actions/get-product-grid-columns/index.js`.

## How it works

1. Merchant opens the product grid in the Commerce Admin
2. Commerce sends a POST request to your `get-product-grid-columns` runtime action with `{ requestId, gridType: "product", ids: ["test-product-26", "LUCKY-CAT-BLUE", ...] }`
3. Your action looks up the column values for each product ID (SKU) and returns them
4. Commerce renders the values in the corresponding columns

For IDs not returned by your action, Commerce falls back to the default values declared in the action.

## Prerequisites

- [Node.js](https://nodejs.org/) >= 24
- [Adobe I/O CLI](https://developer.adobe.com/runtime/docs/guides/tools/cli_install/) (`npm install -g @adobe/aio-cli`)
- An App Builder project on [Adobe Developer Console](https://developer.adobe.com/console/) with a workspace configured for your Commerce instance
- Adobe Commerce >= 2.4.7 with the [Admin UI SDK module](https://developer.adobe.com/commerce/extensibility/admin-ui-sdk/) >= 4.2.0 installed and enabled (required minimum version for v2 samples)

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

- [Admin UI SDK — Custom Grid Columns](https://developer.adobe.com/commerce/extensibility/admin-ui-sdk/extension-points/product/grid-columns/)
- [App Management](https://developer.adobe.com/commerce/extensibility/app-management/)
