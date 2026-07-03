# Product Mass Action — Admin UI SDK V2

Adds custom mass actions to the product grid in the Adobe Commerce Admin panel.

When a merchant selects one or more products and picks one of these actions from the mass actions dropdown, Commerce Admin either opens an iframe backed by your App Builder frontend (`view` actions), or calls a backend runtime action directly with no UI (`worker` actions).

## What you get

Three sample mass actions:

| Action | Type | Behavior |
|---|---|---|
| Product Mass Action | `view` | Opens an iframe listing the selected product IDs |
| Mass Action With Redirect | `view` | Opens an iframe showing the selected product IDs in a combobox; on "Done" it closes and shows a success/error banner notification |
| Mass Action No iFrame | `worker` | Runs `mass-actions/massAction` as a backend runtime action — no UI is shown |

The mass action definitions live in `app.commerce.config.ts`. The iframe UI lives in `src/commerce-backend-ui-2/web-src/`. The worker action logic lives in `src/commerce-backend-ui-2/actions/massAction/index.js`.

## How it works

1. Merchant selects one or more products in the product grid and picks a mass action from the dropdown
2. For `view` actions, Commerce Admin opens the configured `path` inside an iframe backed by your App Builder web app; the app reads the selected IDs via the Admin UI SDK guest connection (`sharedContext.get('selectedIds')`)
3. For `worker` actions, Commerce Admin calls the configured `runtimeAction` directly with the selected IDs — no iframe is shown
4. If the action declares `notifications`, Commerce Admin shows a success or error banner once the action completes

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

- [Admin UI SDK — Product Mass Action](https://developer.adobe.com/commerce/extensibility/admin-ui-sdk/extension-points/product/mass-action/)
- [App Management](https://developer.adobe.com/commerce/extensibility/app-management/)
