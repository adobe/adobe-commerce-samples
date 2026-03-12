# Extension Requirements: Shipping Delivery Date Estimates

<!--
  Schema: .cursor/references/requirements.schema.json
  Example: .cursor/examples/REQUIREMENTS.example.md
-->

## Document Control

| Field | Value |
|-------|-------|
| **Extension Name** | Shipping Delivery Date Estimates |
| **Version** | 1.0 |
| **Status** | draft |
| **Last Updated** | 2026-03-06 |

---

## Executive Summary

### Business Objective

Provide estimated delivery dates and transit times on the product detail page (PDP), cart page, and at checkout, sourced from an external delivery estimation API. This improves purchase confidence and reduces cart abandonment by giving customers clear delivery expectations before and during checkout.

### Priority

**Level**: High

### Success Criteria

1. Storefront can fetch delivery estimates from the App Builder action and display them on PDP and cart.
2. Checkout shipping methods include delivery date estimates via `additional_data`.
3. Configuration (API credentials, origin address, caching, carriers) is managed through the Commerce Admin UI without redeployment.
4. Action API contract is documented for storefront team handoff.

---

## Technical Context

| Aspect | Value |
|--------|-------|
| **Platform** | saas |
| **Application Type** | Headless |
| **Starter Kit** | Checkout Starter Kit |
| **IMS** | Mandatory (SaaS) |

### Constraints

- Out-of-process only; App Builder runtime (Adobe I/O Runtime, Node.js 22).
- No external databases — use `aio-lib-state` for configuration persistence and response caching.
- API key for external delivery estimate API must never be exposed client-side.

---

## Checkout / Webhook Context

| Aspect | Value |
|--------|-------|
| **Target Domain** | shipping |
| **Trigger** | Commerce requests shipping rates at checkout |
| **Webhook Method** | `plugin.magento.out_of_process_shipping_methods.api.shipping_rate_repository.get_rates` ✅ Confirmed Phase 2 |
| **Response Format** | JSON operations array (shipping methods with delivery dates in `additional_data`) |

---

## Integrations

### External Delivery Estimate API

| Aspect | Value |
|--------|-------|
| **Name** | Delivery Date Estimation API |
| **Type** | shipping |
| **Purpose** | Provide estimated delivery dates, transit times, and cutoff datetimes |
| **API Type** | REST (POST) |
| **Authentication** | Bearer token (API key) |
| **Endpoint** | `POST /v1/delivery-estimate` |
| **Specification** | `docs/PIPEDREAM_API_SPEC.md` |
| **Mock** | Pipedream workflow (see `docs/pipedream/PIPEDREAM_SETUP.md`) |

---

## Functional Requirements

### FR-1: Delivery Estimates Action (BFF for Storefront)

**Description**: A standalone App Builder web action (`delivery-estimates`) that the storefront calls via HTTP to retrieve delivery date estimates for display on PDP and cart pages. The action wraps the external delivery estimate API, keeping credentials server-side.

**Rationale for wrapping (not direct 3rd-party call):**
- API key stays server-side (security)
- CORS avoidance (3rd-party API won't allow browser origins)
- Server-side caching via `aio-lib-state` (performance)
- Reads configuration from Admin UI settings (origin, carriers, TTL)
- Vendor abstraction (provider change = action-only update)

**Business Logic:**
- Accept destination (country, postal code, optional city) and optional ship_date from the storefront
- Read origin address, API credentials, default carriers, and cache TTL from `aio-lib-state` configuration
- Check cache for existing estimates matching the request; return cached if valid
- Call external delivery estimate API with origin, destination, ship_date, and carriers
- Cache the response with configurable TTL
- Return formatted estimates to the storefront
- If the feature is disabled via Admin config, return an empty estimates array

**Acceptance Criteria:**

- [ ] Given a valid destination, when the action is invoked, then it returns delivery estimates from the external API.
- [ ] Given a cached estimate within TTL, when the action is invoked with matching params, then it returns the cached result without calling the external API.
- [ ] Given the feature is disabled in Admin config, when the action is invoked, then it returns `{ estimates: [], best_estimation: null }`.
- [ ] The external API key is never exposed in responses or client-accessible code.

### FR-2: Shipping Methods Webhook Enrichment

**Description**: Enhance the existing `shipping-methods` webhook action to call the external delivery estimate API and include delivery date information in the `additional_data` field of each shipping operation returned to Commerce.

**Business Logic:**
- After building shipping operations, call the delivery estimate API using destination from the webhook payload and origin from configuration
- Match carrier codes between shipping operations and API estimates
- Add delivery date fields (`delivery_date`, `safe_delivery_date`, `transit_days`, `cutoff_datetime_utc`) to each shipping operation's `additional_data`
- If the delivery estimate API is unavailable or returns an error, still return shipping operations without delivery dates (graceful degradation)

**Acceptance Criteria:**

- [ ] Given a checkout with a valid shipping address, when shipping methods are requested, then each method includes delivery date `additional_data` where a matching estimate exists.
- [ ] Given the delivery estimate API is down, when shipping methods are requested, then shipping methods are still returned without delivery dates (no customer-facing error).
- [ ] Dual webhook security (OAuth + signature verification) is enforced.

### FR-3: Admin UI Configuration (SPA with Admin UI SDK)

**Description**: A configuration screen in the Commerce Admin, built as an SPA using the Admin UI SDK (`commerce-backend-ui-1`), that allows merchants to manage delivery estimate settings without redeployment.

**Configurable Settings:**

| Setting | Type | Description |
|---------|------|-------------|
| **Feature enabled** | boolean | Master toggle to enable/disable delivery estimates |
| **API base URL** | string | External delivery estimate API base URL |
| **API key** | string (secret) | Bearer token for the external API |
| **Origin country** | string | Warehouse/origin ISO 3166-1 alpha-2 country code |
| **Origin postal code** | string | Warehouse/origin postal/zip code |
| **Origin city** | string | Warehouse/origin city (optional) |
| **Default carriers** | string[] | Carrier codes to request from the API (e.g., `["standard", "express"]`) |
| **Default service levels** | string[] | Service level codes to request (e.g., `["standard", "express", "priority"]`) |
| **Cache TTL (seconds)** | integer | How long to cache delivery estimates (e.g., 3600 = 1 hour) |
| **Carrier code mapping** | key-value | Maps Commerce carrier codes to external API carrier codes (e.g., `DPS → standard`) |

**Persistence:** All settings stored in `aio-lib-state` with appropriate TTL. The Admin UI SPA reads/writes config through backend actions (CRUD endpoints).

**Acceptance Criteria:**

- [ ] Given a merchant is logged into Commerce Admin, when they navigate to the delivery estimates config page, then all settings are displayed with current values.
- [ ] Given a merchant updates settings and saves, when the delivery-estimates action is next invoked, then it uses the updated configuration.
- [ ] API key is stored securely and masked in the Admin UI after save.

### FR-4: Action API Specification for Storefront Handoff

**Description**: A documented API contract (`docs/ACTION_API_SPEC.md`) defining the `delivery-estimates` action's HTTP interface, so the storefront team can build PDP and cart components independently.

**Must include:**
- Endpoint URL pattern
- Request format (headers, body schema)
- Response format (success, empty, error)
- Authentication requirements (if any, e.g. IMS token for SaaS)
- Example request/response pairs

**Acceptance Criteria:**

- [ ] Storefront team can implement the PDP/cart integration using only the API spec, without needing access to the backend codebase.

---

## Business Rules

### BR-1: Graceful Degradation

**Rule:** If the external delivery estimate API is unavailable, the extension must not block checkout or cause errors. Shipping methods are returned without delivery dates; the storefront displays no estimate rather than an error.

**Rationale:** Delivery estimates are informational; they must never prevent a purchase.

### BR-2: Cache-First Strategy

**Rule:** Delivery estimates are cached per unique request (destination + ship_date + carriers). Cached results are returned when within TTL, reducing external API calls and improving response time.

**Rationale:** PDP and cart pages may request estimates frequently; caching reduces latency and API costs.

### BR-3: Configuration Over Code

**Rule:** All settings that could change between environments or over time (API credentials, origin address, carriers, cache TTL) are managed via the Admin UI, not hardcoded or in `.env`.

**Rationale:** Avoid redeployments for configuration changes; empower merchants to self-serve.

---

## Acceptance Criteria (Master Checklist)

- [x] Phase 1: Complete ✅
- [x] Phase 2: Architectural Plan Presented (see ARCHITECTURE.md)
- [x] Phase 3: Implementation Approach Selected: Option B
- [x] Phase 5: Complete ✅

### Functional

- [ ] `delivery-estimates` action returns estimates from external API
- [ ] `shipping-methods` webhook includes delivery dates in `additional_data`
- [ ] Admin UI allows configuring all settings listed in FR-3
- [ ] Configuration changes take effect without redeployment
- [ ] API spec document enables independent storefront implementation

### Technical

- [ ] IMS authentication enforced (SaaS)
- [ ] Dual webhook security on `shipping-methods` (OAuth + signature)
- [ ] API key never exposed to client
- [ ] Graceful degradation when external API is unavailable
- [ ] Caching via `aio-lib-state` with configurable TTL
- [ ] Code follows Biome lint/format rules (double quotes, semicolons, trailing commas)

### Testing

- [ ] Testing: Not requested — recommendations only

---

## Starter Kit Discovery Findings ✅

- **Action pattern:** Single-file; entrypoint: `instrumentEntrypoint(handler, telemetryConfig)`; verify: `webhookVerify(params)`; response: operations array `{ statusCode: HTTP_OK, body: JSON.stringify(operations) }`.
- **Target domain(s):** shipping-methods; file: `actions/shipping-methods/index.js`.
- **Lib used:** `adobe-commerce.js` (webhookVerify, webhookErrorResponse), `http.js` (HTTP_OK), `params.js` (nonEmpty, allNonEmpty), `key-values.js`, `adobe-auth.js`.
- **Config:** app.config.yaml — all actions under `commerce-checkout-starter-kit` package; `commerce-backend-ui-1/ext.config.yaml` for Admin UI; domain YAML: `shipping-carriers.yaml`; onboarding: `create-shipping-carriers`.
- **Lint/format:** biome.jsonc (extends ultracite/core, ultracite/react); double quotes; semicolons always; trailing commas all; arrow parens always; bracket same line true; ES Modules; `.js` extension in relative imports; import order: Node → packages → paths with blank lines.
- **Dependencies:** `got` (HTTP client), `@adobe/aio-sdk` (Core.Logger), `@adobe/aio-lib-telemetry` (instrumentation), `@adobe/react-spectrum` (Admin UI), `@adobe/uix-guest` (Admin UI SDK). Missing: `@adobe/aio-lib-state` (needed for config/cache).
- **Admin UI pattern:** `commerce-backend-ui-1/` uses `commerce/backend-ui/1` extension point; registration action returns `menuItems` and `page`; SPA uses React Spectrum; IMS token via `props.ims` or `sharedContext`.

---

## Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-03-06 | AI Agent | Initial requirements |
