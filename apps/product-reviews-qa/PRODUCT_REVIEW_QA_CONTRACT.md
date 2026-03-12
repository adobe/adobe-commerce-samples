# Product Reviews and Q&A — Service Contract

This document defines the API contract for the Product Reviews and Questions/Answers application. It is intended for frontend and storefront developers integrating with these endpoints.

---

## Document Control

| Field | Value |
|-------|-------|
| **Version** | 1.0 |
| **Last Updated** | 2025-03-04 |
| **Source** | Implementation in `actions/product-reviews/` |

---

## 1. Endpoints (Project Configuration)

The package and action names are defined in the project as follows:

- **Package**: `product-reviews` (see `app.config.yaml` → `runtimeManifest.packages.product-reviews`)
- **Actions**: `reviews-get`, `reviews-post`, `qa-get`, `qa-post` (see `actions/product-reviews/actions.config.yaml`)

App Builder web actions are invoked at the path `/api/v1/web/<package>/<action>`. The **base URL** (host) is determined by your deployment (e.g. from `aio app deploy` output). Using that base, the endpoints to use are:

| Method | Endpoint path | Purpose |
|--------|----------------|---------|
| GET | `/api/v1/web/product-reviews/reviews-get` | List paginated product reviews by SKU |
| POST | `/api/v1/web/product-reviews/reviews-post` | Submit a product review |
| GET | `/api/v1/web/product-reviews/qa-get` | List paginated questions and answers by SKU |
| POST | `/api/v1/web/product-reviews/qa-post` | Submit a question or an answer |

**Full URL form**: `https://<your-deployment-host>/api/v1/web/product-reviews/<action-name>`

Example: for host `https://12345-prodreviewqa135-stage.adobeio-static.net`, the reviews GET endpoint is:

```text
https://12345-prodreviewqa135-stage.adobeio-static.net/api/v1/web/product-reviews/reviews-get
```

**Request headers**: For POST requests, send `Content-Type: application/json`.

---

## 2. Endpoints Overview

| Method | Action Name | Endpoint path |
|--------|-------------|----------------|
| GET | `reviews-get` | `/api/v1/web/product-reviews/reviews-get` |
| POST | `reviews-post` | `/api/v1/web/product-reviews/reviews-post` |
| GET | `qa-get` | `/api/v1/web/product-reviews/qa-get` |
| POST | `qa-post` | `/api/v1/web/product-reviews/qa-post` |

---

## 3. Data Models

### 3.1 Review

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (UUID) | — | Unique identifier (assigned by server) |
| `sku` | string | yes (on create) | Product SKU the review belongs to |
| `rating` | integer | yes (on create) | Star rating; must be between 1 and 5 (inclusive) |
| `review` | string \| null | no | Optional review text |
| `user` | string \| null | no | Optional display name of the reviewer |
| `createdAt` | string (ISO 8601) | — | Creation timestamp (e.g. `2025-03-04T12:00:00.000Z`) |

### 3.2 Question

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (UUID) | — | Unique identifier (assigned by server) |
| `content` | string | yes (on create) | Question text |
| `user` | string \| null | no | Optional display name of the asker |
| `createdAt` | string (ISO 8601) | — | Creation timestamp |
| `answers` | array of Answer | — | List of answers (see below) |

### 3.3 Answer

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (UUID) | — | Unique identifier (assigned by server) |
| `content` | string | yes (on create) | Answer text |
| `user` | string \| null | no | Optional display name of the answerer |
| `createdAt` | string (ISO 8601) | — | Creation timestamp |

Answers are always nested under a question. The storefront uses `question.id` when submitting an answer (see Q&A POST).

---

## 4. API Reference

### 4.1 GET Product Reviews — `reviews-get`

Returns a paginated list of product reviews for a given SKU.

**Request**

- **Method**: `GET`
- **Query parameters**:

| Parameter | Type | Required | Default | Constraints | Description |
|-----------|------|----------|---------|--------------|-------------|
| `sku` | string | **yes** | — | Non-empty after trim | Product SKU to fetch reviews for |
| `limit` | integer | no | 10 | 1–100 | Maximum number of reviews to return |
| `offset` | integer | no | 0 | ≥ 0 | Number of reviews to skip (pagination) |

**Success response**

- **Status**: `200 OK`
- **Body**:

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "sku": "SKU-001",
      "rating": 5,
      "review": "Great product.",
      "user": "Jane",
      "createdAt": "2025-03-04T12:00:00.000Z"
    }
  ],
  "total": 42
}
```

| Field | Type | Description |
|-------|------|-------------|
| `data` | array of Review | Reviews for the requested page (length ≤ `limit`) |
| `total` | integer | Total number of reviews for this SKU (for pagination UI) |

**Error responses**

| Status | Condition | Body |
|--------|-----------|------|
| 400 | Missing `sku` | `{ "error": "Query parameter 'sku' is required." }` |
| 400 | Invalid `limit` (not in 1–100 or not an integer) | `{ "error": "'limit' must be an integer between 1 and 100." }` |
| 400 | Invalid `offset` (negative or not an integer) | `{ "error": "'offset' must be a non-negative integer." }` |
| 500 | Server error | `{ "error": "Internal server error." }` |

**Example**

```http
GET /api/v1/web/product-reviews/reviews-get?sku=SKU-001&limit=10&offset=0
```

---

### 4.2 POST Product Review — `reviews-post`

Creates a new product review for the given SKU.

**Request**

- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Body** (JSON):

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `sku` | string | **yes** | Non-empty after trim | Product SKU to attach the review to |
| `rating` | integer | **yes** | 1–5 | Star rating |
| `review` | string | no | — | Optional review text (sent as-is, trimmed) |
| `user` | string | no | — | Optional display name (trimmed) |

**Success response**

- **Status**: `201 Created`
- **Body**:

```json
{
  "success": true,
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always `true` on success |
| `id` | string (UUID) | ID of the created review (use for display or reference) |

**Error responses**

| Status | Condition | Body |
|--------|-----------|------|
| 400 | Missing `sku` | `{ "error": "Body parameter 'sku' is required." }` |
| 400 | Missing `rating` | `{ "error": "Body parameter 'rating' is required." }` |
| 400 | `rating` not in 1–5 | `{ "error": "'rating' must be an integer between 1 and 5." }` |
| 400 | Invalid JSON body | `{ "error": "..." }` (validation message) |
| 500 | Server error | `{ "error": "Internal server error." }` |

**Example**

```http
POST /api/v1/web/product-reviews/reviews-post
Content-Type: application/json

{
  "sku": "SKU-001",
  "rating": 5,
  "review": "Great product.",
  "user": "Jane"
}
```

---

### 4.3 GET Questions and Answers — `qa-get`

Returns a paginated list of questions for a given SKU. Each question includes its answers (no separate pagination for answers within a question).

**Request**

- **Method**: `GET`
- **Query parameters**:

| Parameter | Type | Required | Default | Constraints | Description |
|-----------|------|----------|---------|--------------|-------------|
| `sku` | string | **yes** | — | Non-empty after trim | Product SKU to fetch Q&A for |
| `limit` | integer | no | 10 | 1–100 | Maximum number of **questions** to return |
| `offset` | integer | no | 0 | ≥ 0 | Number of questions to skip (pagination) |

**Success response**

- **Status**: `200 OK`
- **Body**:

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "content": "Is this machine washable?",
      "user": "John",
      "createdAt": "2025-03-04T11:00:00.000Z",
      "answers": [
        {
          "id": "660e8400-e29b-41d4-a716-446655440002",
          "content": "Yes, cold wash recommended.",
          "user": "Support",
          "createdAt": "2025-03-04T12:00:00.000Z"
        }
      ]
    }
  ],
  "total": 7
}
```

| Field | Type | Description |
|-------|------|-------------|
| `data` | array of Question | Questions (with nested `answers`) for the requested page |
| `total` | integer | Total number of questions for this SKU |

**Error responses**

| Status | Condition | Body |
|--------|-----------|------|
| 400 | Missing `sku` | `{ "error": "Query parameter 'sku' is required." }` |
| 400 | Invalid `limit` | `{ "error": "'limit' must be an integer between 1 and 100." }` |
| 400 | Invalid `offset` | `{ "error": "'offset' must be a non-negative integer." }` |
| 500 | Server error | `{ "error": "Internal server error." }` |

**Example**

```http
GET /api/v1/web/product-reviews/qa-get?sku=SKU-001&limit=10&offset=0
```

---

### 4.4 POST Question or Answer — `qa-post`

Creates either a new **question** or a new **answer** for a product SKU. For answers, the question must already exist and be identified by `questionId`.

**Request**

- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Body** (JSON):

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `sku` | string | **yes** | Non-empty after trim | Product SKU |
| `type` | string | **yes** | `"question"` or `"answer"` | Whether this is a question or an answer |
| `questionId` | string | **yes if type is "answer"** | Must match an existing question ID for this SKU | ID of the question being answered |
| `content` | string | **yes** | Non-empty after trim | Text of the question or answer |
| `user` | string | no | — | Optional display name (trimmed) |

**Success response**

- **Status**: `201 Created`
- **Body**:

```json
{
  "success": true,
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always `true` on success |
| `id` | string (UUID) | ID of the created question or answer. For answers, use this `id` for display; use the same `questionId` to associate the answer with the question when rendering. |

**Error responses**

| Status | Condition | Body |
|--------|-----------|------|
| 400 | Missing `sku` | `{ "error": "Body parameter 'sku' is required." }` |
| 400 | Missing `type` | `{ "error": "Body parameter 'type' is required." }` |
| 400 | Invalid `type` (not `question` or `answer`) | `{ "error": "'type' must be 'question' or 'answer'." }` |
| 400 | Missing `content` | `{ "error": "Body parameter 'content' is required." }` |
| 400 | Empty `content` (after trim) | `{ "error": "'content' cannot be empty." }` |
| 400 | `type` is `answer` but `questionId` missing | `{ "error": "Body parameter 'questionId' is required when type is 'answer'." }` |
| 404 | `type` is `answer` but `questionId` not found for this SKU | `{ "error": "Question with id '<questionId>' not found for this product." }` |
| 500 | Server error | `{ "error": "Internal server error." }` |

**Example — submit a question**

```http
POST /api/v1/web/product-reviews/qa-post
Content-Type: application/json

{
  "sku": "SKU-001",
  "type": "question",
  "content": "Is this machine washable?",
  "user": "John"
}
```

**Example — submit an answer**

Use the `id` from a question returned by `qa-get` as `questionId`:

```http
POST /api/v1/web/product-reviews/qa-post
Content-Type: application/json

{
  "sku": "SKU-001",
  "type": "answer",
  "questionId": "550e8400-e29b-41d4-a716-446655440001",
  "content": "Yes, cold wash recommended.",
  "user": "Support"
}
```

---

## 5. Error Response Format

All error responses use a single message field:

```json
{
  "error": "Human-readable message describing what went wrong."
}
```

- **HTTP status** indicates the kind of error (400 client error, 404 not found, 500 server error).
- **`error`** is a string. Use it for validation feedback and logging; do not rely on exact wording for branching logic if the contract is extended later.

---

## 6. Pagination

- **GET reviews** and **GET Q&A** use `limit` and `offset`:
  - `limit`: 1–100, default 10.
  - `offset`: ≥ 0, default 0.
- Response includes `total` (total number of items for that SKU). Use it to compute page count: e.g. `Math.ceil(total / limit)`.
- For Q&A GET, pagination applies to **questions**; each question in `data` includes its full `answers` array (no per-answer pagination).

---

## 7. IDs and Timestamps

- **IDs**: All `id` values (reviews, questions, answers) are UUIDs (e.g. RFC 4122) generated by the server. They are opaque strings; use them for display and for `questionId` when posting answers.
- **Timestamps**: All `createdAt` values are ISO 8601 date-time strings in UTC (e.g. `2025-03-04T12:00:00.000Z`). Use them for sorting and display.

---

## 8. Storefront Integration Checklist

- [ ] Use the base URL from your App Builder deployment; append the endpoint paths from section 1 (e.g. `/api/v1/web/product-reviews/reviews-get`).
- [ ] Send `Content-Type: application/json` for all POST requests.
- [ ] For GET: pass `sku` (required), and optionally `limit` and `offset` as query parameters.
- [ ] For POST: send JSON body with required fields; for Q&A POST with `type: "answer"`, include `questionId` from a question returned by `qa-get`.
- [ ] Handle 400, 404, and 500 and show or log the `error` message.
- [ ] Use `total` and `limit`/`offset` to build pagination UI for reviews and Q&A lists.
- [ ] Display `createdAt` in the user’s timezone if needed; keep comparison/sorting in UTC.

---

*End of contract.*
