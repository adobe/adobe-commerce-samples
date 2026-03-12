# Out-of-Stock Notifications

This package provides REST API endpoints for out-of-stock notification subscriptions and back-in-stock detection (event-driven and scheduled).

## REST API (web action)

The **notify-out-of-stock/api** action is exposed as a web action. Base URL is your App Builder web action URL (e.g. `https://<namespace>.adobeio-static.net/api/v1/web/<package>/api`).

- **POST** – Create subscription  
  Body: `{ "email": "user@example.com", "sku": "PRODUCT-SKU" }`  
  Returns `201` with `{ id, email, sku, createdAt }`.  
  Returns `409` if a subscription for the same (email, sku) already exists.

- **GET** – Read one or list  
  - One: `?id=<subscription-id>`  
  - List: optional `?sku=...` and/or `?email=...`  
  Returns `200` with a single subscription or `{ subscriptions: [...] }`.

- **DELETE** – Cancel subscription  
  - By id: `?id=<subscription-id>`  
  - By email + sku: body or query `email=...&sku=...`  
  Returns `200` or `404` if not found.

## Back-in-stock detection

1. **Event-driven**: When Commerce emits `observer.cataloginventory_stock_item_save_commit_after` with `is_in_stock === true`, the **back-in-stock** action runs: it resolves `product_id` to SKU via Commerce REST, finds subscriptions for that SKU, logs each notification (for audit in Adobe Developer Console), and removes those subscriptions from state.

2. **Scheduled**: The **check-stock** action can be triggered on a schedule (e.g. alarm). It loads all pending subscriptions, calls Commerce `GET .../inventory/is-product-salable/:sku/1` for each unique SKU, and for in-stock SKUs logs notifications and removes those subscriptions.

In this implementation, “sending” a notification means **logging** it (e.g. `Back-in-stock notification (audit): sku=... email=...`). View logs in the Adobe Developer Console to audit back-in-stock events.

## Configuration

- **COMMERCE_BASE_URL** – Commerce REST base URL (trailing slash). Required for back-in-stock and check-stock (product lookup and is-product-salable).
- **COMMERCE_STORE_CODE** – Optional; default `default` (used if needed for product API path).
- **STATE_REGION** – Optional; aio-lib-state region (e.g. `amer`).

For Commerce REST auth (product lookup and is-product-salable), use the same credentials as the rest of the kit (PaaS: Commerce OAuth 1.0; ensure COMMERCE_CONSUMER_KEY, etc. are available to the runtime).

## Triggering the scheduled check-stock

The **check-stock** action does not define an alarm trigger in `app.config.yaml`. To run it on a schedule, add an alarm trigger in the deployment manifest or invoke it periodically via an external scheduler.
