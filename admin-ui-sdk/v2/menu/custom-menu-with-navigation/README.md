# Custom Menu with Navigation Pane — Admin UI SDK V2

Adds a single custom menu item to the Adobe Commerce Admin panel that opens a multi-section app page, using a left-hand navigation pane to switch between views inside the same iframe.

## Why a navigation pane?

In Admin UI SDK V2, an app registers at most **one** menu entry (`adminUi.menu` is a single object, not an array like V1's `menuItems`). If your app needs more than one section, you can't add more Admin menu entries for it — the recommended pattern is to render a navigation pane inside the app's page and switch between views client-side, all from that one menu entry.

## What you get

A menu entry, **App with Navigation Pane**, nested under the Commerce Admin **Content** menu (via `parentMenu`). Opening it loads a page with a vertical tab list on the left — **Overview**, **Settings**, and **About** — that swaps the content on the right without any additional Admin menu entries or page reloads.

- The menu definition lives in `app.commerce.config.ts`.
- The navigation pane lives in `src/commerce-backend-ui-2/web-src/src/components/navigation-pane.tsx`, built with `Tabs`/`TabList`/`TabPanel` from `@react-spectrum/s2` using `orientation="vertical"`.
- Each section is its own component: `welcome.tsx` (Overview — reads IMS context), `settings-view.tsx`, and `about-view.tsx`.
- `main-page.tsx` — the page rendered by the menu entry — just renders `<NavigationPane />`.

## How it works

1. Merchant opens the Commerce Admin and selects **App with Navigation Pane** under **Content → App with Navigation Pane**
2. Commerce Admin loads the app's web UI inside an iframe, at the single route registered for the menu
3. `NavigationPane` renders a vertical `Tabs` component; selecting a tab swaps the visible `TabPanel` — no navigation, no extra menu entries, no page reload
4. The **Overview** view calls `useIms()` from `@adobe/aio-commerce-lib-admin-ui/web` to read the signed-in admin's IMS Org ID, demonstrating how IMS context is available from any view in the pane

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

## Customizing

- **Change the parent menu**: swap the `parentMenu` import/value in `app.commerce.config.ts` for any [`COMMERCE_MENUS`](https://developer.adobe.com/commerce/extensibility/admin-ui-sdk/extension-points/menu/) constant (`MENU_SALES`, `MENU_CATALOG`, `MENU_CUSTOMERS`, `MENU_MARKETING`, `MENU_CONTENT`, `MENU_REPORTS`, `MENU_STORES`, `MENU_SYSTEM`), or omit it to list the app at the top level.
- **Add another view**: create a new component under `web-src/src/components/`, then add a matching `Tab`/`TabPanel` pair (same `id` on both) in `navigation-pane.tsx`.

## More information

- [Admin UI SDK — Custom Menu](https://developer.adobe.com/commerce/extensibility/admin-ui-sdk/extension-points/menu/)
- [App Management](https://developer.adobe.com/commerce/extensibility/app-management/)
