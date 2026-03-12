# Extension Architecture: Out-of-Stock Notifications

<!--
  This document follows the ARCHITECTURE.md schema.
  All sections map to schema properties for consistent parsing by AI agents.
-->

## Document Control

| Field | Value |
|-------|-------|
| **Version** | 1.0 |
| **Status** | draft |
| **Last Updated** | 2025-03-06 |
| **Architect** | (Agent) |
| **Requirements Source** | REQUIREMENTS.md v1.0 |

---

## Environment

| Aspect | Value |
|--------|-------|
| **Platform** | saas |
| **Application Type** | headless |
| **Commerce Version** | 2.4.x (Composable) |
| **Runtime** | Node.js 22 |

---

## Integration Points

### Commerce Events (Commerce → App Builder)

#### Event: observer.cataloginventory_stock_item_save_commit_after

- **Trigger**: Inventory/stock item is saved (e.g. quantity or in-stock status updated).
- **Event Type**: observer
- **Payload Fields** (from EVENTS_SCHEMA.json):

| Field | Type | Purpose |
|-------|------|---------|
| product_id | int | Resolve to SKU via Commerce REST (see below) |
| is_in_stock | bool | When true, product is back in stock; trigger notification flow |
| qty | float | Optional context |
| _origData | array | Optional: detect transition from out-of-stock to in-stock |

- **Action Path**: `actions/notify-out-of-stock/commerce/back-in-stock/`
- **SKU resolution**: The event does not include `sku`. Resolve `product_id` → SKU by calling Commerce REST: `GET /rest/<store_code>/V1/products?searchCriteria[filter_groups][0][filters][0][field]=entity_id&searchCriteria[filter_groups][0][filters][0][value]=<product_id>&searchCriteria[pageSize]=1` and read `items[0].sku`. Use `COMMERCE_API_URL` and store code (e.g. `default`) from config; IMS auth per SaaS.

### Commerce REST API (App Builder → Commerce)

Used by:

1. **Back-in-stock event handler**: Resolve `product_id` to SKU (GET products by entity_id, see above).
2. **Scheduled check-stock action**: Check salability by SKU.

**Simplest stock check by SKU** (per Adobe Commerce Web API docs):

- **Endpoint**: `GET <COMMERCE_API_URL>/rest/<store_code>/V1/inventory/is-product-salable/:sku/:stockId`
- **Response**: `true` or `false`
- **Path parameters**: `sku` (string), `stockId` (integer; default stock often `1`)

**Stock ID**: For single stock, use `stockId=1`. If multi-source, use `GET /V1/inventory/stock-resolver/website/<code>` to resolve stock ID; for simplicity, default to `1` unless configured otherwise.

### Caller: EDS Storefront → App Builder REST API

- **Direction**: EDS Storefront calls App Builder web actions (REST).
- **Auth**: None for this implementation (per requirements).
- **Operations**: Create subscription (POST), Read one (GET), List (GET), Delete (DELETE).

---

## Component Architecture

### Runtime Actions

#### 1. Notify-out-of-stock REST API (web)

- **Path**: `actions/notify-out-of-stock/api/`
- **Purpose**: Single web action that handles CRUD for out-of-stock subscriptions. Invoked as web action with `web: 'yes'`. Route by HTTP method and path (or query/body) to implement:
  - **POST** (create): body `{ "email", "sku" }` → validate, enforce unique (email, sku), store in state, return 201 + subscription.
  - **GET** (read one): e.g. `?id=<id>` or `?email=&sku=` → return one subscription or 404.
  - **GET** (list): optional `?sku=` or `?email=` → return list of subscriptions.
  - **DELETE**: e.g. `?id=<id>` or body `{ "email", "sku" }` → remove subscription, return 204 or 200.
- **Trigger**: HTTP from EDS Storefront.
- **Files**: Single action (e.g. `index.js`) that parses `__ow_method`, `__ow_path`, query/body and delegates to internal handlers; no 6-file event pattern for this API.
- **Annotations**: `web: 'yes'`; no `require-adobe-auth` for this implementation.

#### 2. Back-in-stock (event-driven)

- **Path**: `actions/notify-out-of-stock/commerce/back-in-stock/`
- **Purpose**: On `cataloginventory_stock_item_save_commit_after`, when `is_in_stock === true`, resolve `product_id` to SKU, load pending subscriptions for that SKU from state, for each log the notification (audit), then mark as notified or remove subscription.
- **Trigger**: Commerce event `observer.cataloginventory_stock_item_save_commit_after`.
- **Execution order**: validate → transform → preProcess (read state) → send (log notification) → postProcess (update/remove state).
- **Files**: index.js, validator.js, pre.js, transformer.js, sender.js, post.js (full 6-file pattern).

#### 3. Check-stock (scheduled)

- **Path**: `actions/notify-out-of-stock/scheduled/check-stock/`
- **Purpose**: Run on a schedule; load all pending subscriptions from state; collect unique SKUs; for each SKU call Commerce `GET .../is-product-salable/:sku/1`; for each in-stock SKU, get subscriptions for that SKU, log each notification, then mark/remove those subscriptions.
- **Trigger**: Alarm/cron (e.g. every 15 minutes).
- **Files**: Single action (e.g. index.js) or minimal set; no 6-file pattern required for cron-triggered logic unless reusing shared pieces.

---

## State Management

- **Storage**: aio-lib-state only (single-tenant).
- **Namespace**: Use a single application state namespace; no tenant id in keys for this implementation.

**Key design**:

| Key | Purpose | Value Shape | TTL |
|-----|---------|-------------|-----|
| `out-of-stock-subscriptions` | Single document holding all subscriptions | `{ "subscriptions": [ { "id", "email", "sku", "createdAt" } ] }` | None (persistent) |

**Alternative (scalable)**: One key per subscription `notify-<id>` and one index key `notify-index` with array of `{ id, sku, email }` for listing by sku. For minimal implementation, the single-document approach is acceptable; if the list grows large (e.g. >100KB), switch to per-subscription keys and an index.

**Id generation**: Use a simple unique id (e.g. `crypto.randomUUID()` or `email + '|' + sku` as id) so that create/read/delete can reference the same subscription.

**Lifecycle**: After a subscription is used to log a back-in-stock notification, remove it from the document (or mark a `status: 'notified'` and filter out notified in “pending” queries). Re-subscribe creates a new entry.

---

## Configuration Impact

### Files to Create or Update

| File | Action | Details |
|------|--------|---------|
| `app.config.yaml` | Update | Add package `notify-out-of-stock` with actions: api (web), commerce/back-in-stock, scheduled/check-stock. Add trigger for check-stock (alarm feed). |
| `scripts/commerce-event-subscribe/config/commerce-event-subscribe.json` | Update | Ensure `observer.cataloginventory_stock_item_save_commit_after` is subscribed with fields including `product_id`, `is_in_stock` (already subscribed with "*" in current project). |
| `actions/notify-out-of-stock/**` | Create | New action directories and files as above. |
| `env.dist` | Update | Document `COMMERCE_API_URL`, `COMMERCE_STORE_CODE` (e.g. default), and any IMS credentials used for Commerce REST calls from back-in-stock and check-stock. |

### Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| COMMERCE_API_URL | Base URL for Commerce REST | https://your-commerce-instance.com |
| COMMERCE_STORE_CODE | Store code for REST path | default |
| STATE_REGION | aio-lib-state region | amer |
| (SaaS) IMS credentials | For Commerce API auth | Per App Builder config |

### NPM Dependencies

- Existing: `@adobe/aio-sdk`, `@adobe/aio-lib-state`. Ensure `@adobe/aio-lib-state` is present for state access.
- No new dependencies required for minimal implementation; use Node `crypto` for UUID if needed.

---

## Security Architecture

- **REST API (notify-out-of-stock API)**: No API keys or tokens in this implementation; web action is publicly callable. CORS can be set per need for EDS Storefront.
- **Commerce event**: Validator must verify event signature (Adobe I/O Events) per standard starter kit practice.
- **Commerce REST calls**: Use IMS Server-to-Server (or configured auth) for calls from back-in-stock and check-stock actions. Credentials via `app.config.yaml` inputs (e.g. `$COMMERCE_*`), never hardcoded.

---

## Data Flow

### Create subscription (Storefront → API → State)

1. EDS Storefront POSTs `{ "email", "sku" }` to web action.
2. Action validates email and sku; checks state for duplicate (email, sku).
3. If duplicate → 409 Conflict. Else append to `out-of-stock-subscriptions` with new id and createdAt; return 201 and subscription.

### Back-in-stock (event)

1. Commerce emits `cataloginventory_stock_item_save_commit_after` with `product_id`, `is_in_stock`.
2. Validator checks payload; filter to `is_in_stock === true`.
3. Transformer normalizes; pre loads state and resolves product_id → SKU via Commerce REST.
4. Sender: for resolved SKU, get pending subscriptions from state; for each, log structured message (email, sku, id, timestamp).
5. Post: remove or mark as notified those subscriptions in state.

### Back-in-stock (scheduled)

1. Alarm triggers check-stock action.
2. Load `out-of-stock-subscriptions`, collect unique SKUs with pending subscriptions.
3. For each SKU, GET Commerce `is-product-salable/:sku/1`.
4. For each SKU where salable is true: get subscriptions for that SKU, log each notification, remove or mark those subscriptions in state.

### Delete subscription

1. Storefront DELETEs with id or (email, sku).
2. Action removes matching entry from state; return 204 or 200.

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Invalid or missing email/sku on create | 400 Bad Request |
| Duplicate (email, sku) on create | 409 Conflict |
| Subscription not found (read/delete) | 404 Not Found |
| State get/put failure | Log error; return 503 for API; fail gracefully in event/scheduled |
| Commerce API failure (resolve SKU or is-product-salable) | Log error; do not remove subscriptions; scheduled run can retry later |
| Event payload missing product_id or is_in_stock | Log and skip or return error |

---

## Decisions Log

| ID | Decision | Rationale |
|----|----------|-----------|
| AD-1 | Use `observer.cataloginventory_stock_item_save_commit_after` for event-driven back-in-stock | Standard Commerce event for stock item changes; includes product_id and is_in_stock (EVENTS_SCHEMA.json). |
| AD-2 | Resolve product_id to SKU via REST GET products with searchCriteria by entity_id | Event does not contain sku; Commerce REST exposes products by entity_id via searchCriteria. |
| AD-3 | Use `GET /V1/inventory/is-product-salable/:sku/:stockId` for scheduled check | Documented as the simplest way to get stock status by SKU (Commerce Web API). |
| AD-4 | Single web action for CRUD that routes by method/path | Keeps one URL surface for EDS Storefront; avoids multiple action declarations for simple CRUD. |
| AD-5 | Single state key `out-of-stock-subscriptions` with JSON array | Simple and sufficient for single-tenant, moderate volume; can refactor to key-per-subscription if size grows. |
| AD-6 | After sending, remove subscription from state (no “notified” flag) | Simplest lifecycle; re-subscribe creates a new record. |
