# Extension Requirements: Out-of-Stock Notifications

## Document Control

| Field | Value |
|-------|-------|
| **Version** | 1.0 |
| **Status** | approved |
| **Last Updated** | 2025-03-06 |
| **Product Manager** | (Agent) |
| **Stakeholders** | Extension owner |

---

## Executive Summary

### Business Objective

Provide an Adobe Commerce as a Cloud Service (SaaS) extension that allows storefronts to manage out-of-stock notification subscriptions and to detect when products return to stock. The EDS Storefront will call REST API endpoints for CRUD on subscriptions (create, read, delete). Back-in-stock is detected via a Commerce inventory event and/or a scheduled job that checks stock; when back-in-stock is detected, the service logs the notification for audit in the Adobe Developer Console (no outbound delivery in this implementation).

### Priority

**Level**: high  
**Justification**: Improves customer experience and conversion by notifying interested customers when products are back in stock.

### Success Criteria

1. EDS Storefront can create, read, and delete out-of-stock notification subscriptions via REST API.
2. Subscriptions are stored in aio-lib-state; one subscription per (email, SKU); no duplicate (email, SKU) allowed.
3. Back-in-stock is detected via at least one of: Commerce inventory event, or scheduled action that checks Commerce API by SKU.
4. When back-in-stock is detected, the notification is logged for audit (no email/webhook send).
5. After a subscription is “sent” (logged), it is marked as notified or removed so it is not sent again until the customer re-subscribes.

---

## Technical Context

| Aspect | Value |
|--------|-------|
| **Platform** | saas |
| **Commerce Version** | 2.4.x (Composable) |
| **Application Type** | Headless (backend only) |
| **Storefront** | EDS Storefront (calls App Builder REST API) |

### Constraints

- Single-tenant for this implementation.
- No API keys or security tokens for the REST API in this implementation.
- Use aio-lib-state for persistence only (no external DB).
- Minimal compliance requirements; no rate limits or max subscriptions in scope.

---

## Functional Requirements

### FR-1: REST API for subscription CRUD

**Description**: The App Builder app exposes REST API endpoints for out-of-stock notification subscriptions. EDS Storefront can create, read (single and list), and delete subscriptions. Update is out of scope.

**User Story**: As a storefront, I want to create and manage out-of-stock notification subscriptions by email and SKU so that customers can be notified when a product is back in stock.

**Trigger**: HTTP requests from EDS Storefront to web actions.

**Acceptance Criteria**:

- [ ] **Given** a valid `email` and `sku` in the request body, **when** the client POSTs to the create endpoint, **then** a new subscription is stored and the API returns a success response with the subscription identifier or representation.
- [ ] **Given** an existing subscription id (or email+sku), **when** the client GETs the read endpoint, **then** the API returns that subscription.
- [ ] **Given** the list endpoint, **when** the client GETs it (optional filters e.g. by sku or email), **then** the API returns a list of matching subscriptions.
- [ ] **Given** an existing subscription, **when** the client DELETEs the delete endpoint, **then** the subscription is removed (cancel subscription) and the API returns success.
- [ ] **Given** a create request with the same (email, sku) as an existing subscription, **then** the API rejects the duplicate (e.g. 409 Conflict or idempotent upsert per BR-1).

**Error Handling**:

| Scenario | Expected Behavior |
|----------|-------------------|
| Invalid or missing email/sku | 400 Bad Request with clear message |
| Duplicate (email, sku) on create | Reject per BR-1 (no duplicate subscriptions) |
| Subscription not found on read/delete | 404 Not Found |

---

### FR-2: Subscription data model and uniqueness

**Description**: Each subscription is identified by customer email and product SKU. At most one subscription per (email, SKU) pair.

**User Story**: As a system, I want to enforce one subscription per (email, SKU) so that we do not send duplicate notifications.

**Acceptance Criteria**:

- [ ] **Given** a subscription, **then** it has at least: `email` (string), `sku` (string), and a stable identifier for API use (e.g. id or composite key).
- [ ] **Given** any two subscriptions, **then** they must not share the same (email, sku) pair.
- [ ] **Given** a subscription that has been “sent” (back-in-stock logged), **then** it is either removed from storage or marked as notified so it will not be sent again until the user subscribes again.

---

### FR-3: Back-in-stock detection (event-driven)

**Description**: Back-in-stock is detected when Commerce emits an inventory/stock-related event that indicates a product has become in-stock. The extension subscribes to the best-fit Commerce event (to be chosen in architecture), resolves SKU if needed, finds matching subscriptions, and for each match logs the notification for audit.

**User Story**: As a merchant, I want back-in-stock to be detected from Commerce inventory events so that notifications are triggered in near real-time.

**Trigger**: Commerce event (inventory/stock), as defined in ARCHITECTURE.md.

**Acceptance Criteria**:

- [ ] **Given** a Commerce event payload indicating a product is in stock (e.g. `is_in_stock` true), **when** the event is processed, **then** the action resolves the product SKU (from event or via Commerce API if needed).
- [ ] **Given** resolved SKU(s), **when** the action runs, **then** it looks up subscriptions in state for that SKU and for each pending subscription logs the notification (e.g. structured log with email, sku, timestamp) for Adobe Developer Console audit.
- [ ] **Given** a notification has been logged for a subscription, **then** that subscription is marked as notified or removed so it is not sent again until re-subscription.

**Error Handling**:

| Scenario | Expected Behavior |
|----------|-------------------|
| Event payload missing required fields | Log error, skip or fail gracefully; do not crash |
| State read/write failure | Log error; retry or fail per architecture |

---

### FR-4: Back-in-stock detection (scheduled)

**Description**: A scheduled action runs on a defined interval, checks Commerce for stock status by SKU (using the simplest applicable Commerce API), and for each SKU that is in-stock and has pending subscriptions, logs the notification and marks/removes those subscriptions.

**User Story**: As a merchant, I want a fallback or complementary check that periodically verifies stock so that we do not miss back-in-stock when events are not sufficient.

**Trigger**: Alarm/cron trigger per ARCHITECTURE.md.

**Acceptance Criteria**:

- [ ] **Given** the scheduled action runs, **when** it executes, **then** it obtains the set of SKUs that have at least one pending subscription from state.
- [ ] **Given** that set of SKUs, **when** the action runs, **then** it queries Commerce (or the chosen API) for stock status by SKU using the simplest supported method.
- [ ] **Given** a SKU that is in-stock and has pending subscriptions, **when** the action runs, **then** it logs each notification for audit and marks/removes those subscriptions so they are not sent again until re-subscription.
- [ ] **Given** no pending subscriptions or no in-stock SKUs, **when** the action runs, **then** it completes without error (no-op is acceptable).

**Error Handling**:

| Scenario | Expected Behavior |
|----------|-------------------|
| Commerce API unreachable or error | Log error; do not remove subscriptions; retry on next run if applicable |
| State read/write failure | Log error; retry or fail per architecture |

---

### FR-5: Notification delivery (audit only)

**Description**: In this implementation, “sending” a notification means logging it for audit in the Adobe Developer Console. No email, webhook, or other outbound delivery is required.

**Acceptance Criteria**:

- [ ] **Given** a back-in-stock match (event or scheduled), **when** the notification is “sent”, **then** a structured log entry is produced (e.g. logger with email, sku, subscription id, timestamp) so that it can be audited in the Adobe Developer Console.
- [ ] **Given** that log, **then** it does not include unnecessary PII beyond what is needed for audit (email and SKU are acceptable for this implementation).

---

## Business Rules

### BR-1: One subscription per (email, SKU)

- A customer (email) may not have more than one subscription for the same SKU.
- Create must reject or overwrite per product decision; for this implementation, reject duplicate (email, sku) with a clear error (e.g. 409 Conflict).

### BR-2: Lifecycle after “sent”

- After a subscription is used to log a back-in-stock notification, the subscription must be either removed from storage or marked as notified.
- A customer must be able to create a new subscription for the same (email, sku) after that (re-subscribe).

---

## State Management

- **Storage**: aio-lib-state only (single-tenant for this implementation).
- **Keys**: Design to support subscription CRUD and lookup by (email, sku) and by sku for back-in-stock processing (e.g. key pattern or index structure to be defined in ARCHITECTURE.md).
- **Data**: Store subscription payload (email, sku, id or composite key, optional created_at, optional status if “notified” is used instead of delete).
- **Idempotency**: Duplicate (email, sku) on create is rejected (BR-1). Event and scheduled actions should avoid double-sending by marking or removing the subscription as soon as the notification is logged.

---

## Scheduled Operations

- One scheduled action to check stock by SKU and process pending subscriptions.
- Schedule (e.g. interval in minutes) and timeout to be defined in ARCHITECTURE.md.
- No other cron jobs required for this implementation.

---

## Error Handling

| Scenario | Expected Behavior |
|----------|-------------------|
| Invalid input (missing email/sku, bad format) | 400 Bad Request for REST; log and skip or fail for events/scheduled |
| Duplicate (email, sku) on create | 409 Conflict (or equivalent) |
| Subscription not found (read/delete) | 404 Not Found |
| State unavailable | Log error; return 503 or equivalent for REST; fail gracefully for event/scheduled |
| Commerce API error in scheduled flow | Log error; do not remove subscriptions; next run can retry |

---

## Acceptance Criteria (Master Checklist)

### Functional

- [ ] FR-1: REST create, read (single + list), delete implemented and callable by EDS Storefront; no update.
- [ ] FR-2: One subscription per (email, sku); sent subscriptions marked or removed; re-subscribe possible.
- [ ] FR-3: Event-driven back-in-stock detection implemented and logging for audit.
- [ ] FR-4: Scheduled back-in-stock detection implemented using Commerce API for stock by SKU and logging for audit.
- [ ] FR-5: Notifications only logged (no email/webhook); auditable in Adobe Developer Console.

### Technical

- [ ] All configuration and code follow ARCHITECTURE.md and project lint rules.
- [ ] Phase 5 scaffolding cleanup and deployment readiness completed before sign-off.

### Documentation

- [ ] README or equivalent updated with how to call the REST API and how to verify event/scheduled behavior.

---

## Approvals

| Role | Date |
|------|------|
| Product Manager | 2025-03-06 |
| (Technical Lead / Stakeholder) | Pending |
