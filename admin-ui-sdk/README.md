# Admin UI SDK Samples

This directory contains samples for different extension points of the Adobe Commerce Admin UI SDK, organized into two versioned folders.

## Versions

### V2 (recommended)

Located in `v2/`. These samples are built on [App Management](https://developer.adobe.com/commerce/extensibility/app-management/), the new foundation for Admin UI SDK extensions. All these examples require the Admin UI SDK version `>= 4.2.0`, since it's the first to support V2. All new apps should prefer adopting V2 over V1 since it's the new standard.

### V1 (deprecated)

Located in `v1/`. These samples use the previous scaffolding approach and the `commerce/backend-ui/1` extension point. V1 is deprecated and will be removed in a future release.

## Sample comparison: V1 → V2

| V1 sample | V2 sample | Notes |
|---|---|---|
| `banner-notification/custom-mass-actions` | — | Removed as a standalone sample — the notification config is embedded directly in `order/custom-mass-action` and `product/custom-mass-action`. In V2, notifications are declared inline on each mass action as `notifications.success` / `notifications.error`. |
| `banner-notification/custom-order-view-button` | — | Removed as a standalone sample — the notification config is embedded directly in `order/custom-view-button`. In V2, notifications are part of the view button config. |
| `customer/custom-grid-columns` | `customer/custom-grid-columns` | V1 fetches column data via API Mesh (`data.meshId`). V2 calls a `runtimeAction` instead. |
| `customer/custom-mass-action` | `customer/custom-mass-action` | `displayIframe` boolean replaced by explicit `type: "view" \| "worker"`. `actionId` renamed to `id`. `sandbox` string replaced by `sandboxPermissions` array. |
| `menu/custom-menu` | `menu/custom-menu` | V1 registers an array of items (including section items). V2 declares a single `menu` object; section is auto-generated. `title` renamed to `label`. `sortOrder` dropped. New required `description` field. |
| `menu/custom-menu-no-react` | — | Not applicable in V2. App Management always generates a `web-src` (App Builder frontend). A vanilla/no-framework variant is not supported. |
| `order/custom-fees` | — | Custom fees are not an Admin UI SDK V2 extension point. In V2 they are implemented as a webhook on `plugin.magento.out_of_process_totals_collector.api.get_total_modifications.custom_fees`. See [Checkout Totals Collector](https://developer.adobe.com/commerce/extensibility/starter-kit/checkout/totals-collector-fees). |
| `order/custom-grid-columns` | `order/custom-grid-columns` | Same as `customer/custom-grid-columns` — API Mesh replaced by `runtimeAction`. |
| `order/custom-mass-action` | `order/custom-mass-action` | Same changes as `customer/custom-mass-action`. |
| `order/custom-view-button` | `order/custom-view-button` | `buttonId` renamed to `id`. `displayIframe` replaced by `type: "view" \| "worker"`. New optional `description` field. |
| `product/custom-grid-columns` | `product/custom-grid-columns` | Same as `customer/custom-grid-columns` — API Mesh replaced by `runtimeAction`. |
| `product/custom-mass-action` | `product/custom-mass-action` | Same changes as `customer/custom-mass-action`. |

## Installation

Each sample has its own README with specific installation and configuration instructions.

## More Information

- [Admin UI SDK developer docs](https://developer.adobe.com/commerce/extensibility/admin-ui-sdk/)
- [App Management](https://developer.adobe.com/commerce/extensibility/app-management/)
- [Checkout Totals Collector (custom fees in V2)](https://developer.adobe.com/commerce/extensibility/starter-kit/checkout/totals-collector-fees)
