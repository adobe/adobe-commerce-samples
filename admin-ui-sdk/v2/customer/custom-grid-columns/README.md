# Customer Custom Grid Columns — Admin UI SDK V2

Adds custom columns to the customer grid in the Adobe Commerce Admin panel.

When a merchant opens **Customers → All Customers**, Commerce calls your App Builder runtime action with the IDs of the visible customers. Your action returns the column values; Commerce renders them inline alongside the built-in columns.

## What you get

Three sample columns:

| Column ID | Label | Type |
|---|---|---|
| `first_column` | First App Column | `string` |
| `second_column` | Second App Column | `integer` |
| `third_column` | Third App Column | `date` |

The column definitions live in `app.commerce.config.ts`. The data logic lives in `src/commerce-backend-ui-2/actions/data/customerGridColumns.js`.

## How it works

1. Merchant opens the customer grid in the Commerce Admin
2. Commerce sends a POST request to your `get-customer-grid-columns` runtime action with `{ requestId, gridType: "customer", ids: ["1", "2", ...] }`
3. Your action looks up the column values for each customer ID and returns them
4. Commerce renders the values in the corresponding columns

For IDs not returned by your action, Commerce falls back to the default values declared in the action (empty string / `0`).

## Prerequisites

- [Node.js](https://nodejs.org/) >= 22
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

- [Admin UI SDK — Custom Grid Columns](https://developer.adobe.com/commerce/extensibility/admin-ui-sdk/extension-points/customer/grid-columns/)
- [App Management](https://developer.adobe.com/commerce/extensibility/app-management/)
