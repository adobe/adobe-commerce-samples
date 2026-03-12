# Extension Requirements: Product Reviews and Q&A

## Document Control

| Field | Value |
|-------|-------|
| **Version** | 1.0 |
| **Status** | in-development |
| **Last Updated** | 2025-03-04 |
| **Product Manager** | — |
| **Stakeholders** | — |

---

## Implementation Status (Current State)

*Summary as of 2025-03-04.*

- **Runtime actions**: All four web actions exist under `actions/product-reviews/`: `reviews-get`, `reviews-post`, `qa-get`, `qa-post`. Each has `index.js` (orchestration + aio-lib-state) and `validator.js` (input validation).
- **Configuration**: Package `product-reviews` is registered in `app.config.yaml`; `actions/product-reviews/actions.config.yaml` declares all four actions as web actions (runtime nodejs:22). **Gap**: `require-adobe-auth: true` is not set on product-reviews actions (per ARCHITECTURE.md it should be; only starter-kit info has it in app.config today).
- **Persistence**: Uses `@adobe/aio-lib-state` with keys `reviews:{sku}` and `qa:{sku}`; data shapes match ARCHITECTURE.md.
- **Tests**: Unit tests exist for all four actions and their validators in `test/actions/product-reviews/`. All product-reviews tests pass. Coverage for the product-reviews package should be verified separately (e.g. ≥80%).
- **Lint**: Ultracite lint passes for `actions/product-reviews`.
- **Documentation**: No README or API documentation in the repo yet that describes the four endpoints, parameters, and error responses.

---

## Executive Summary

### Business Objective

An Adobe Commerce as a Cloud Service (SaaS) extension that exposes REST API endpoints for storefronts to fetch and submit **product reviews** and **questions and answers** (Q&A) for products identified by SKU. The extension provides paginated read endpoints and validated write endpoints, with data persisted and associated to product SKUs (and, for Q&A, answers linked to questions).

### Priority

**Level**: high  
**Justification**: Enables storefront-driven UGC (reviews and Q&A) without modifying Commerce core, essential for SaaS where in-process customization is not available.

### Success Criteria

1. Storefront can list and paginate product reviews by SKU via GET.
2. Storefront can submit a product review with rating (and optional text/user) via POST; invalid input returns clear error responses.
3. Storefront can list and paginate questions and answers by SKU via GET.
4. Storefront can submit a question or an answer (linked to a question) via POST; invalid input returns appropriate error responses.
5. All data is stored in App Builder–allowed persistence and associated with the correct product SKU (and question for answers).

---

## Technical Context

| Aspect | Value |
|--------|-------|
| **Platform** | saas |
| **Commerce Version** | 2.4.x (Adobe Commerce as a Cloud Service) |

### Constraints

- Out-of-process extensibility only (Adobe Developer App Builder).
- No in-process PHP or core code changes.
- Persistence must use App Builder–allowed storage (e.g. aio-lib-state, aio-lib-files); no external database services.
- REST APIs are called by the storefront (headless or EDS); authentication and exposure model to be defined in architecture.

---

## Functional Requirements

### FR-1: Product Reviews GET (list by SKU with pagination)

**Description**: A REST GET endpoint returns product reviews for a given SKU with optional pagination.

**User Story**: As a storefront, I want to fetch paginated product reviews for a SKU so that I can display them on the product page.

**Trigger**: HTTP GET request from storefront.

**Input (query parameters)**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| sku | string | yes | — | Product SKU to fetch reviews for |
| limit | integer | no | 10 | Max number of reviews to return |
| offset | integer | no | 0 | Number of reviews to skip for pagination |

**Acceptance Criteria**:

- [x] **Given** a valid `sku` with stored reviews, **when** GET is called with optional `limit` and `offset`, **then** the response returns a list of reviews for that SKU respecting pagination.
- [x] **Given** missing `sku`, **when** GET is called, **then** the response is 400 (or equivalent) with an error indicating `sku` is required.
- [x] **Given** a `sku` with no reviews, **when** GET is called, **then** the response returns an empty list (or equivalent).
- [x] **Given** invalid `limit` or `offset` (e.g. negative), **when** GET is called, **then** the response returns an appropriate error or uses safe defaults.

**Error Handling**:

| Scenario | Expected Behavior |
|----------|-------------------|
| Missing `sku` | 400 Bad Request, message that sku is required |
| Invalid `limit`/`offset` | 400 or use defaults (per architecture) |

---

### FR-2: Product Reviews POST (submit review)

**Description**: A REST POST endpoint accepts a product review (rating and optional text/user), validates input, and persists it associated with the product SKU.

**User Story**: As a storefront, I want to submit a product review (rating and optional text/user) so that it is stored and can be displayed later.

**Trigger**: HTTP POST request from storefront with JSON body.

**Input (JSON body)**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| sku | string | yes | Product SKU to submit the review for |
| rating | integer | yes | Rating for the product (1–5) |
| review | string | no | Text of the review |
| user | string | no | Name of the user submitting the review |

**Acceptance Criteria**:

- [x] **Given** valid `sku`, `rating` (1–5), and optional `review` and `user`, **when** POST is called, **then** the review is stored and associated with the SKU and a success response is returned.
- [x] **Given** missing `sku` or `rating`, **when** POST is called, **then** the response is 400 with a clear validation error.
- [x] **Given** `rating` outside 1–5, **when** POST is called, **then** the response is 400 with an error indicating invalid rating range.
- [x] **Given** invalid JSON or wrong types, **when** POST is called, **then** the response is 400 with an appropriate error message.

**Error Handling**:

| Scenario | Expected Behavior |
|----------|-------------------|
| Missing `sku` or `rating` | 400 Bad Request, list required fields |
| `rating` not in 1–5 | 400 Bad Request, message that rating must be 1–5 |
| Invalid body (e.g. not JSON) | 400 Bad Request |

---

### FR-3: Questions and Answers GET (list by SKU with pagination)

**Description**: A REST GET endpoint returns questions and answers for a given product SKU with optional pagination.

**User Story**: As a storefront, I want to fetch paginated questions and answers for a SKU so that I can display them on the product page.

**Trigger**: HTTP GET request from storefront.

**Input (query parameters)**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| sku | string | required | — | Product SKU to fetch Q&A for |
| limit | integer | no | 10 | Max number of items (questions/answers) to return |
| offset | integer | no | 0 | Number of items to skip for pagination |

**Acceptance Criteria**:

- [x] **Given** a valid `sku` with stored questions/answers, **when** GET is called with optional `limit` and `offset`, **then** the response returns questions and associated answers for that SKU with pagination.
- [x] **Given** missing `sku`, **when** GET is called, **then** the response is 400 with an error indicating `sku` is required.
- [x] **Given** a `sku` with no Q&A, **when** GET is called, **then** the response returns an empty list (or equivalent).
- [x] **Given** invalid `limit` or `offset`, **when** GET is called, **then** the response returns an appropriate error or uses safe defaults.

**Error Handling**:

| Scenario | Expected Behavior |
|----------|-------------------|
| Missing `sku` | 400 Bad Request, message that sku is required |
| Invalid `limit`/`offset` | 400 or use defaults (per architecture) |

---

### FR-4: Questions and Answers POST (submit question or answer)

**Description**: A REST POST endpoint accepts either a question or an answer for a product SKU. Answers must reference an existing question by ID. Input is validated and persisted.

**User Story**: As a storefront, I want to submit a question or an answer (with questionId for answers) so that they are stored and linked to the product and, for answers, to the question.

**Trigger**: HTTP POST request from storefront with JSON body.

**Input (JSON body)**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| sku | string | yes | Product SKU to submit the question/answer for |
| type | string | yes | Either `"question"` or `"answer"` |
| questionId | string | yes if type is "answer" | ID of the question being answered |
| content | string | yes | Text of the question or answer |
| user | string | no | Name of the user submitting |

**Acceptance Criteria**:

- [x] **Given** valid `sku`, `type` "question", `content`, and optional `user`, **when** POST is called, **then** the question is stored and associated with the SKU and a success response is returned (including an ID for the new question if applicable).
- [x] **Given** valid `sku`, `type` "answer", `questionId`, `content`, and optional `user`, **when** POST is called and `questionId` exists for that SKU, **then** the answer is stored and associated with the SKU and the question.
- [x] **Given** `type` "answer" but missing `questionId`, **when** POST is called, **then** the response is 400 with an error that questionId is required for answers.
- [x] **Given** `type` "answer" and non-existent or invalid `questionId`, **when** POST is called, **then** the response is 400 or 404 with an appropriate error.
- [x] **Given** missing `sku`, `type`, or `content`, **when** POST is called, **then** the response is 400 with validation errors.
- [x] **Given** `type` not "question" or "answer", **when** POST is called, **then** the response is 400 with an error indicating invalid type.

**Error Handling**:

| Scenario | Expected Behavior |
|----------|-------------------|
| Missing `sku`, `type`, or `content` | 400 Bad Request, list required fields |
| `type` not "question" or "answer" | 400 Bad Request |
| `type` "answer" but missing `questionId` | 400 Bad Request |
| `questionId` not found or not for this SKU | 400 or 404 with clear message |
| Invalid body (e.g. not JSON) | 400 Bad Request |

---

## Data Requirements

- **Reviews**: Stored per product SKU; each review has at least: rating (1–5), optional review text, optional user, and a stable identifier (e.g. ID) and timestamp for ordering/display.
- **Questions**: Stored per product SKU; each question has: content, optional user, unique question ID, and timestamp. Answers reference the question ID and are stored in a way that allows listing by SKU and by question.
- **Pagination**: Responses should support `limit` and `offset`; response shape (e.g. `{ data: [], total?, limit, offset }`) to be defined in architecture.

---

## Acceptance Criteria (Master Checklist)

### Functional

- [x] FR-1: Product Reviews GET implemented and tested (sku required; limit/offset; pagination).
- [x] FR-2: Product Reviews POST implemented and tested (validation for sku, rating 1–5; storage by SKU).
- [x] FR-3: Q&A GET implemented and tested (sku required; limit/offset; questions and answers by SKU).
- [x] FR-4: Q&A POST implemented and tested (question vs answer; questionId required for answers; validation and storage).

### Technical

- [ ] REST endpoints exposed as web actions and callable by storefront (auth/security per architecture). *Gap: add `require-adobe-auth: true` to product-reviews actions per ARCHITECTURE.md.*
- [x] Persistence uses App Builder–allowed storage only; data associated with SKU (and question for answers).
- [ ] Code coverage ≥ 80%; all tests passing. *All product-reviews tests pass; coverage for this package to be verified.*
- [x] Lint and project rules (e.g. Ultracite) satisfied.

### Documentation

- [ ] README or API documentation describes the four endpoints, parameters, and error responses.

---

## Approvals

| Role | Name | Date |
|------|------|------|
| Product Manager | | |
| Technical Lead | | |
