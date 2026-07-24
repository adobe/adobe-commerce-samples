# Purchase Approval – B2B Approval App for Adobe Commerce

App Builder app that implements the combined B2B Purchase Approval scenario:

1. **Install and configure** – Install from Adobe Exchange, associate with Commerce in App Management UI, configure approval rules (threshold, currency, approver emails) from the same UI.
2. **Checkout evaluation** – Commerce calls the app via the Webhook Module to evaluate approval rules in real time at checkout.
3. **Event-driven workflow** – When an order is placed, Commerce emits an order event; the app creates an approval request stored in App Builder persistence.
4. **Approver dashboard** – Lightweight SPA for finance/procurement to list pending approvals and approve or reject orders.
5. **Observability** – Execution log for webhook and event handler invocations; optional alerts when the approval policy cannot be evaluated.

## Structure

- **app.commerce.config.ts** – Commerce app config (metadata, businessConfig schema, eventing, webhooks, installation).
- **app.config.yaml** – Extensions (configuration, extensibility, backend-ui), runtime actions.
- **actions/** – Checkout webhook handler, order event handler, approval APIs (list, detail, approve, reject), execution log API; shared storage in `lib/storage.js`.
- **web-src/** – Approver SPA (React + Adobe Spectrum): Approval requests list/detail, Execution log.
- **src/commerce-*-1/** – Commerce extension configs; `.generated/` is filled by the App Builder build (manifest and app-management actions).

## Prerequisites

- Node.js 24+ (matches the `nodejs:24` runtime declared for every action).
- Adobe I/O Runtime (for deployment) and an Adobe Developer Console project/workspace.
- Admin UI SDK 3.x or later, enabled and configured on the Commerce instance — required for the
  `commerce/backend-ui/2` extension point (menu entry, order grid columns) this app registers. See
  the [Admin UI SDK configuration guide](https://developer.adobe.com/commerce/extensibility/admin-ui-sdk/configuration/#general-configuration).
- Commerce Webhooks module and Adobe I/O Events for Commerce module, both enabled — required for the
  checkout approval webhook and the order-placed event subscription described below.
- Compatible with Adobe Commerce 2.4.5+ (see `productDependencies` in `app.config.yaml`), on both
  Adobe Commerce as a Cloud Service (SaaS) and Adobe Commerce on PaaS/on-premises. Authentication uses
  Adobe IMS in both cases (via `@adobe/aio-commerce-lib-auth`); no Commerce integration (OAuth1)
  credentials are used, so the same `.env` configuration works for either flavor. The Commerce
  instance's base URL and flavor (SaaS/PaaS) aren't configured via `.env` — they're resolved from the
  app's association data (`getCommerceInstance()`/`getCommerceClient()` in `@adobe/aio-commerce-lib-app`),
  set up when the app is associated with a Commerce instance in the App Management UI.

## Setup

1. Install dependencies (from repo root so that `file:../aio-commerce-sdk/...` resolves, or adjust `package.json`):

   ```bash
   cd PurchaseApproval && npm install
   ```

2. Copy `env.dist` to `.env` and fill in the values (IMS Server-to-Server credentials for the Adobe
   Developer Console project, and a config-encryption key). See [Environment
   variables](#environment-variables) below for what each key is used for.

3. Generate manifest and app-management actions (requires `@adobe/aio-commerce-lib-app` from the SDK):

   ```bash
   npm run manifest
   ```

   Then run the pre-app-build hooks for each extension so that `.generated/actions/app-management/*.js` and the manifest are up to date (usually done by your App Builder deploy/build pipeline).

4. Deploy with Adobe App Builder (e.g. `aio app deploy` or your CI).

## Environment variables

All keys are listed with guidance in [`env.dist`](./env.dist):

| Variable | Used by | Purpose |
| --- | --- | --- |
| `LOG_LEVEL` | all actions | Log verbosity (`debug`, `info`, `warn`, `error`). |
| `AIO_COMMERCE_CONFIG_ENCRYPTION_KEY` | commerce/configuration/1 (`config` action) | Encrypts secrets/credentials before they are persisted in business configuration. |

## Configuration

After installation, configure in the App Management UI:

- **Approval threshold amount** – Orders at or above this value require approval.
- **Currency code** – e.g. USD.
- **Approver emails** – Comma-separated list (for reference; approval actions are performed from the dashboard).
- **Message when order requires approval** – Shown when the checkout webhook flags the order.
- **Optional alert webhook URL** – For notifications when the approval policy cannot be evaluated.

Approval rules are also stored in `approval-config.json` (via `actions/lib/storage.js`) for the runtime actions; you can sync from the App Management config or use the dashboard when implemented.

## Webhook and event

- **Webhook** – `observer.sales_order_place_before` (after). Commerce sends a payload with `subject`, `result` (order data), `order`, and `e`. The handler reads `result`/`order` for `grand_total`, `increment_id`, etc., evaluates the approval threshold, and returns `valid: true` and optionally `requires_approval: true` and a message.
- **Event** – `observer.checkout_submit_all_after`. The handler creates an approval request when the order total meets the threshold.

### Creating the webhook in Commerce

The `commerce/extensibility/1` extension registers the `checkout-approval-check` webhook
subscription automatically as part of app installation/configuration (via
`app.commerce.config.ts` → `webhooks`); no manual `webhooks.xml` authoring is required. To verify
or troubleshoot it in Commerce Admin:

1. Ensure the Commerce Webhooks module is enabled.
2. In Commerce Admin, go to **System > Webhooks > Webhooks Subscriptions** and confirm a
   subscription named `purchase_approval_check` exists for the `checkout_approval_validation`
   hook, targeting `observer.sales_order_place_before` (type: `after`).
3. `require-adobe-auth` is enabled for this webhook, so Commerce authenticates to the runtime
   action using Adobe IMS — no separate signature-verification setup is needed. **Note:** this
   IMS/OAuth-based webhook authentication is `[SaaS Only]` — see the "Developer Console OAuth"
   panel on [Create a webhook](https://developer.adobe.com/commerce/extensibility/webhooks/create-webhooks)
   and [App Builder Extension Compatibility](https://developer.adobe.com/commerce/extensibility/app-development/extension-compatibility/).
   On PaaS, define authorization headers/tokens in `webhooks.xml`, or use
   [signature verification](https://developer.adobe.com/commerce/extensibility/webhooks/signature-verification/) instead.

### Subscribing to the order-placed event

The `observer.checkout_submit_all_after` event (label "Order Placed") is declared in
`app.commerce.config.ts` → `eventing.commerce` and is provisioned automatically for the
`purchase-approval-provider` event provider during installation. **Note:** on SaaS, event
subscriptions can be managed from **System > Events** in Commerce Admin or via REST; on PaaS,
register events via `io_events.xml` or REST instead (see
[App Builder Extension Compatibility](https://developer.adobe.com/commerce/extensibility/app-development/extension-compatibility/)).
To verify the subscription in Commerce Admin:

1. Ensure the Adobe I/O Events for Commerce module is enabled and connected to your Adobe I/O
   Events project.
2. In Commerce Admin, go to **System > Events > Subscribed Events** and confirm
   `observer.checkout_submit_all_after` is subscribed and routed to the
   `PurchaseApproval/order-event-handler` runtime action.

## License

Apache-2.0
