# Out of Stock Notification — API Service Contract

This document defines the REST API contract for the Out of Stock Notification service. Use it to implement storefront (e.g. EDS) integration for subscribing and unsubscribing customers to back-in-stock notifications.

---

## 1. Base URL and invocation

- **Deployment**: The API is exposed as an Adobe I/O Runtime web action. The exact base URL is determined at deploy time.
- **Typical pattern**:  
  `https://<runtime-namespace>.adobeio-static.net/api/v1/web/<app-name>-<workspace>/notify-out-of-stock/api`
- **Resolve at runtime**: Use your App Builder project’s deployed URL (e.g. from `aio app get-url` or your deployment config). All endpoints below are relative to this base path.
- **Protocol**: HTTPS only.
- **Authentication**: None for this implementation. No API keys, Bearer tokens, or headers are required.

---

## 2. Common conventions

### 2.1 Request

- **Content-Type**: Send `Content-Type: application/json` for requests that include a body (POST, and optionally GET/DELETE with body).
- **Body encoding**: UTF-8. Request body must be valid JSON when provided.
- **Query parameters**: All query parameters are optional unless stated otherwise. Values are strings.

### 2.2 Response

- **Success body**: Varies by endpoint (see below). No wrapper object unless specified.
- **Error body**: All error responses use this shape:

```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

- **Status codes**: Only the documented codes are used for success and errors. Clients should not rely on other codes for this API.

### 2.3 Subscription resource

A subscription is a single back-in-stock notification signup for one email + one SKU.

| Field       | Type   | Description |
|------------|--------|-------------|
| `id`       | string | UUID v4. Stable identifier for this subscription. Use for read/delete by id. |
| `email`    | string | Customer email. Stored and matched case-insensitively. |
| `sku`      | string | Product SKU. Exact match (case-sensitive). |
| `createdAt`| string | ISO 8601 datetime (e.g. `2025-03-06T12:00:00.000Z`) when the subscription was created. |

- **Uniqueness**: At most one subscription per `(email, sku)` pair. Creating a second subscription for the same pair returns `409 Conflict`.

---

## 3. Endpoints

### 3.1 Create subscription

**Purpose**: Register a customer to be notified when a product is back in stock.

| Aspect   | Value |
|----------|--------|
| **Method** | `POST` |
| **Path**   | Base path only (no path suffix). |
| **Body**   | Required. JSON. |

**Request body**

| Field   | Type   | Required | Description |
|---------|--------|----------|-------------|
| `email` | string | Yes      | Customer email. Leading/trailing whitespace is trimmed. Must be non-empty after trim. |
| `sku`   | string | Yes      | Product SKU. Leading/trailing whitespace is trimmed. Must be non-empty after trim. |

**Example request**

```http
POST /api/v1/web/.../notify-out-of-stock/api HTTP/1.1
Host: <host>
Content-Type: application/json

{
  "email": "customer@example.com",
  "sku": "SKU-12345"
}
```

**Success response**

- **Status**: `201 Created`
- **Body**: The created subscription object (no wrapper).

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "customer@example.com",
  "sku": "SKU-12345",
  "createdAt": "2025-03-06T12:00:00.000Z"
}
```

**Error responses**

| Status | Condition | `error` (example) |
|--------|-----------|--------------------|
| `400 Bad Request` | Missing or invalid `email` and/or `sku` (e.g. empty after trim, or not strings). | `"Missing or invalid email and sku"` |
| `409 Conflict` | A subscription already exists for the same `(email, sku)` pair. | `"Subscription already exists for this email and sku"` |
| `503 Service Unavailable` | Backing state store unavailable. | `"Service unavailable"` |
| `500 Internal Server Error` | Unexpected server error. | Message may vary. |

**Frontend notes**

- Validate `email` and `sku` locally (non-empty, trimmed) before calling to avoid unnecessary 400s.
- On 409, treat as “already subscribed” and show a message like “You’re already subscribed to notifications for this product.”
- Store `id` and/or `email`+`sku` if you need to show “Manage subscription” or cancel later.

---

### 3.2 Read one subscription

**Purpose**: Fetch a single subscription by id.

| Aspect   | Value |
|----------|--------|
| **Method** | `GET` |
| **Path**   | Base path only. |
| **Identification** | By query parameter `id` **or** by both `email` and `sku` (query or body). |

**Query parameters**

| Parameter | Type   | Required | Description |
|-----------|--------|----------|-------------|
| `id`      | string | No*      | Subscription UUID. If present, only this subscription is returned. |
| `email`   | string | No*      | Filter by email (case-insensitive). Must be used together with `sku` to resolve a single subscription. |
| `sku`     | string | No*      | Filter by SKU. Must be used together with `email` to resolve a single subscription. |

\* Either `id` **or** both `email` and `sku` must be provided to read one subscription. If only one of `email`/`sku` is sent, the API treats the request as a list (see List subscriptions).

**Optional body (GET)**  
Some clients send GET with a body. The API accepts `id`, `email`, and `sku` from the JSON body as well. Body is optional; query params take precedence for routing behavior when both are present.

**Example request (by id)**

```http
GET /api/v1/web/.../notify-out-of-stock/api?id=550e8400-e29b-41d4-a716-446655440000 HTTP/1.1
Host: <host>
```

**Example request (by email + sku)**

```http
GET /api/v1/web/.../notify-out-of-stock/api?email=customer@example.com&sku=SKU-12345 HTTP/1.1
Host: <host>
```

**Success response**

- **Status**: `200 OK`
- **Body**: Single subscription object (no wrapper).

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "customer@example.com",
  "sku": "SKU-12345",
  "createdAt": "2025-03-06T12:00:00.000Z"
}
```

**Error responses**

| Status | Condition | `error` (example) |
|--------|-----------|--------------------|
| `404 Not Found` | No subscription matches the given `id` or `(email, sku)`. | `"Subscription not found"` |
| `503 Service Unavailable` | Backing state store unavailable. | `"Service unavailable"` |
| `500 Internal Server Error` | Unexpected server error. | Message may vary. |

**Frontend notes**

- Use `id` when you have it (e.g. from create or from a stored preference). Use `email` + `sku` when you’re on a PDP and only have the current user email and product SKU.
- 404 can mean “not subscribed” — e.g. show “Subscribe” instead of “Unsubscribe” or “Manage subscription.”

---

### 3.3 List subscriptions

**Purpose**: Get all subscriptions, optionally filtered by `sku` and/or `email`.

| Aspect   | Value |
|----------|--------|
| **Method** | `GET` |
| **Path**   | Base path only. |
| **Behavior** | If **neither** `id` nor both `email` and `sku` are provided, the API returns a list. Optional filters: `sku`, `email`. |

**Query parameters**

| Parameter | Type   | Required | Description |
|-----------|--------|----------|-------------|
| `sku`     | string | No       | Include only subscriptions for this SKU (exact match). |
| `email`   | string | No       | Include only subscriptions for this email (case-insensitive). |

**Example request (all subscriptions)**

```http
GET /api/v1/web/.../notify-out-of-stock/api HTTP/1.1
Host: <host>
```

**Example request (filter by email)**

```http
GET /api/v1/web/.../notify-out-of-stock/api?email=customer@example.com HTTP/1.1
Host: <host>
```

**Example request (filter by sku)**

```http
GET /api/v1/web/.../notify-out-of-stock/api?sku=SKU-12345 HTTP/1.1
Host: <host>
```

**Example request (filter by email and sku)**

```http
GET /api/v1/web/.../notify-out-of-stock/api?email=customer@example.com&sku=SKU-12345 HTTP/1.1
Host: <host>
```

**Success response**

- **Status**: `200 OK`
- **Body**: Object with a single key `subscriptions`, an array of subscription objects (possibly empty).

```json
{
  "subscriptions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "customer@example.com",
      "sku": "SKU-12345",
      "createdAt": "2025-03-06T12:00:00.000Z"
    }
  ]
}
```

**Error responses**

| Status | Condition |
|--------|-----------|
| `503 Service Unavailable` | Backing state store unavailable. |
| `500 Internal Server Error` | Unexpected server error. |

**Frontend notes**

- Use list with `email` to show “Your back-in-stock subscriptions” on an account or profile page.
- Use list with `sku` only for admin/analytics (e.g. “how many people are waiting for this SKU”). This implementation does not require auth, so restrict such usage as appropriate in your app.

---

### 3.4 Delete subscription (unsubscribe)

**Purpose**: Remove a subscription so the customer is no longer notified for that product.

| Aspect   | Value |
|----------|--------|
| **Method** | `DELETE` |
| **Path**   | Base path only. |
| **Identification** | By query parameter `id` **or** by body/query with both `email` and `sku`. |

**Query parameters**

| Parameter | Type   | Required | Description |
|-----------|--------|----------|-------------|
| `id`      | string | No*      | Subscription UUID. If present, only this subscription is deleted. |
| `email`   | string | No*      | Must be used together with `sku` to identify the subscription to delete. |
| `sku`     | string | No*      | Must be used together with `email` to identify the subscription to delete. |

\* Either `id` **or** both `email` and `sku` must be provided. If only one of `email`/`sku` is sent, the API returns `400`.

**Body (optional)**  
The API accepts `id` or `email` and `sku` in the JSON body for DELETE as well. Same rules: either `id` or both `email` and `sku`.

**Example request (by id)**

```http
DELETE /api/v1/web/.../notify-out-of-stock/api?id=550e8400-e29b-41d4-a716-446655440000 HTTP/1.1
Host: <host>
```

**Example request (by email + sku)**

```http
DELETE /api/v1/web/.../notify-out-of-stock/api HTTP/1.1
Host: <host>
Content-Type: application/json

{
  "email": "customer@example.com",
  "sku": "SKU-12345"
}
```

**Success response**

- **Status**: `200 OK`
- **Body**:

```json
{
  "success": true
}
```

**Error responses**

| Status | Condition | `error` (example) |
|--------|-----------|--------------------|
| `400 Bad Request` | Neither `id` nor both `email` and `sku` provided. | `"Delete requires id or both email and sku"` |
| `404 Not Found` | No subscription matches the given `id` or `(email, sku)`. | `"Subscription not found"` |
| `503 Service Unavailable` | Backing state store unavailable. | `"Service unavailable"` |
| `500 Internal Server Error` | Unexpected server error. | Message may vary. |

**Frontend notes**

- Prefer `id` when available to avoid case/encoding issues with email/sku.
- On 404, subscription is already gone; you can show “You are not subscribed” or simply treat as success for “ensure unsubscribed” flows.
- After a successful delete, refresh any local list or “subscribed” state so the UI does not show the subscription as active.

---

## 4. Summary table

| Operation     | Method | Identifiers        | Success status | Success body |
|---------------|--------|--------------------|----------------|--------------|
| Create        | POST   | —                  | 201            | Subscription |
| Read one      | GET    | `id` or `email`+`sku` | 200         | Subscription |
| List          | GET    | optional `sku`, `email` | 200       | `{ "subscriptions": [...] }` |
| Delete        | DELETE | `id` or `email`+`sku` | 200         | `{ "success": true }` |

---

## 5. Out-of-scope / not exposed to storefront

- **Update subscription**: Not supported. To change email or SKU, delete and create a new subscription.
- **PATCH/PUT**: Not supported; return `400 Method not allowed` for unsupported HTTP methods.
- **Pagination**: List returns all matching subscriptions; no `page`/`limit` parameters in this implementation.
- **Rate limiting**: Not specified in this contract; implement defensive retries and backoff as needed.
- **Webhooks / push**: Notifications are logged server-side; there is no storefront-facing webhook or push API in this contract.

---

## 6. Versioning and changes

- This contract describes the current behavior of the `notify-out-of-stock` web action `api`.
- Non-breaking changes (e.g. new optional fields, new optional query params) may be added without a new contract version.
- Breaking changes (removing or renaming fields, changing status codes or error shapes) should be documented and, if applicable, versioned (e.g. via URL or header). If you introduce versioning, update this section and the base URL description accordingly.
