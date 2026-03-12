# Storefront API Specification — Delivery Date Estimates

This document is the integration contract between the **backend extension** (Adobe App Builder) and the **storefront**. It covers how to fetch and display delivery date estimates on the Product Detail Page (PDP), Cart, and Checkout.

---

## 1. Architecture Overview

The backend provides delivery date estimates through two channels:

| Channel | Where Used | How It Works |
|---------|-----------|--------------|
| **BFF Action** (`delivery-estimates`) | PDP, Cart | Storefront calls an HTTP endpoint directly. Returns estimates for a given destination. |
| **Webhook enrichment** (`shipping-methods`) | Checkout shipping step | Commerce automatically injects delivery dates into each shipping method's `additional_data`. No storefront fetch needed — data arrives with the shipping methods. |

```
┌─────────────┐     POST /delivery-estimates     ┌──────────────────┐     ┌─────────────────┐
│   PDP/Cart  │ ──────────────────────────────► │  BFF Action      │ ──► │  Delivery API   │
│  (browser)  │ ◄────────────────────────────── │  (App Builder)   │ ◄── │  (mock/real)    │
└─────────────┘     { estimates, best_estimation }└──────────────────┘     └─────────────────┘

┌─────────────┐     GraphQL / dropin              ┌──────────────────┐     ┌─────────────────┐
│  Checkout   │ ◄──────────────────────────────  │  Commerce Core   │ ──► │  shipping-methods│
│  (browser)  │   shipping methods +              │  (webhook call)  │ ◄── │  webhook action  │
└─────────────┘   additional_data with dates      └──────────────────┘     └─────────────────┘
```

---

## 2. BFF Action — Delivery Estimates Endpoint

### 2.1 Endpoint

| Item | Value |
|------|-------|
| **URL** | `https://3117813-rojopocs-shippingestimates.adobeioruntime.net/api/v1/web/commerce-checkout-starter-kit/delivery-estimates` |
| **Method** | `POST` |
| **Auth** | None (public web action) |
| **Content-Type** | `application/json` |

> **Note:** The URL above is for the current workspace. Production URL will differ after deployment to a production workspace.

### 2.2 Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `destination` | object | **Yes** | At least `country_code` or `postal_code` must be provided. |
| `destination.country_code` | string | Recommended | ISO 3166-1 alpha-2 (e.g. `US`, `CA`, `FR`). |
| `destination.postal_code` | string | Recommended | Postal/zip code. |
| `destination.city` | string | No | City name. |
| `ship_date` | string | No | ISO 8601 date (`YYYY-MM-DD`). Defaults to today. |
| `carriers` | string[] | No | Filter by carrier codes. Omit to use merchant defaults. |
| `service_levels` | string[] | No | Filter by service level. Omit to use merchant defaults. |

**Minimal request:**

```json
{
  "destination": {
    "country_code": "US",
    "postal_code": "10001"
  }
}
```

### 2.3 Response — Success (200)

```json
{
  "estimates": [
    {
      "carrier_code": "standard",
      "service_code": "ground",
      "delivery_date": "2026-03-12",
      "safe_delivery_date": "2026-03-13",
      "transit_days": 4,
      "cutoff_datetime_utc": "2026-03-06T13:00:00.000Z"
    },
    {
      "carrier_code": "express",
      "service_code": "2day",
      "delivery_date": "2026-03-10",
      "safe_delivery_date": "2026-03-11",
      "transit_days": 2,
      "cutoff_datetime_utc": "2026-03-06T15:00:00.000Z"
    }
  ],
  "best_estimation": {
    "carrier_code": "standard",
    "service_code": "ground",
    "delivery_date": "2026-03-12",
    "safe_delivery_date": "2026-03-13",
    "transit_days": 4,
    "cutoff_datetime_utc": "2026-03-06T13:00:00.000Z"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `estimates[]` | array | One entry per carrier/service combination. |
| `estimates[].carrier_code` | string | Carrier identifier (e.g. `standard`, `express`). |
| `estimates[].service_code` | string | Service/method code (e.g. `ground`, `2day`). |
| `estimates[].delivery_date` | string | Estimated delivery date (`YYYY-MM-DD`). |
| `estimates[].safe_delivery_date` | string | Conservative date with buffer (`YYYY-MM-DD`). |
| `estimates[].transit_days` | integer | Business days in transit. |
| `estimates[].cutoff_datetime_utc` | string | Ship-by cutoff in UTC ISO 8601. Orders placed after this time ship the next business day. |
| `best_estimation` | object\|null | Recommended estimate (same shape as an `estimates[]` entry). |

### 2.4 Response — Empty (200)

When the feature is disabled, not configured, or no estimates are available:

```json
{
  "estimates": [],
  "best_estimation": null
}
```

### 2.5 Response — Error (400 / 500)

```json
{ "error": "bad_request", "message": "At least destination.country_code or destination.postal_code is required." }
```

```json
{ "error": "internal_error", "message": "An unexpected error occurred." }
```

---

## 3. Checkout — Shipping Method additional_data

During checkout, the `shipping-methods` webhook automatically enriches each shipping method with delivery date fields. **No separate API call is needed** — the data arrives with the shipping methods response from Commerce.

### 3.1 additional_data Fields

Each shipping method in the checkout response may include these keys in its `additional_data` array:

| Key | Type (as string) | Description |
|-----|-------------------|-------------|
| `delivery_date` | `YYYY-MM-DD` | Estimated delivery date. |
| `safe_delivery_date` | `YYYY-MM-DD` | Conservative delivery date. |
| `transit_days` | integer as string | Business days in transit. |
| `cutoff_datetime_utc` | ISO 8601 UTC | Order-by cutoff for this delivery date. |

### 3.2 Example additional_data

```json
{
  "carrier_code": "DPS",
  "method_code": "standard",
  "carrier_title": "Demo Postal Service",
  "method_title": "Ground Shipping",
  "amount": 5.99,
  "additional_data": [
    { "key": "delivery_date", "value": "2026-03-12" },
    { "key": "safe_delivery_date", "value": "2026-03-13" },
    { "key": "transit_days", "value": "4" },
    { "key": "cutoff_datetime_utc", "value": "2026-03-06T13:00:00.000Z" }
  ]
}
```

### 3.3 Carrier Code Mapping

The backend maps Commerce carrier codes to the external API's carrier codes. The current mapping (configured in the Admin UI):

| Commerce Carrier Code | Commerce Carrier Title | External API Carrier Code |
|----------------------|----------------------|--------------------------|
| `DPS` | Demo Postal Service | `standard` |
| `Fedex` | Fedex Service | `express` |

If a shipping method has no matching estimate, `additional_data` will not include delivery date fields. The storefront should handle this gracefully (show the method without a date).

### 3.4 Reading additional_data in the Checkout Dropin

```javascript
function getDeliveryDate(shippingMethod) {
  const items = shippingMethod?.additional_data ?? [];
  const dateEntry = items.find((item) => item.key === "delivery_date");
  return dateEntry?.value ?? null;
}

function getTransitDays(shippingMethod) {
  const items = shippingMethod?.additional_data ?? [];
  const entry = items.find((item) => item.key === "transit_days");
  return entry?.value ? parseInt(entry.value, 10) : null;
}
```

---

## 4. Integration Guide by Page

### 4.1 Product Detail Page (PDP)

**When to call:** On page load, or when the customer enters/changes their shipping destination.

**What to call:** BFF action (Section 2).

**What to display:** `best_estimation.delivery_date` formatted as a human-readable date. Optionally show `transit_days` ("Arrives in X business days").

**Destination source:** Use the store's default country/region, or the customer's saved address if logged in. Consider adding a postal code input for anonymous shoppers.

```javascript
const ACTION_URL = "https://3117813-rojopocs-shippingestimates.adobeioruntime.net/api/v1/web/commerce-checkout-starter-kit/delivery-estimates";

async function fetchDeliveryEstimate(postalCode, countryCode = "US") {
  try {
    const res = await fetch(ACTION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        destination: { country_code: countryCode, postal_code: postalCode },
      }),
    });
    const data = await res.json();
    return data?.best_estimation ?? null;
  } catch {
    return null;
  }
}

// Display example
const estimate = await fetchDeliveryEstimate("10001");
if (estimate) {
  const date = new Date(estimate.delivery_date + "T00:00:00");
  const formatted = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  // => "Get it by Thursday, March 12"
}
```

### 4.2 Cart Page

**When to call:** When the cart loads and a shipping address is available (from cart state or customer profile).

**What to call:** BFF action (Section 2).

**What to display:** Summary near cart totals — e.g. "Estimated delivery: Mar 12 – Mar 13" using `delivery_date` and `safe_delivery_date`.

### 4.3 Checkout — Shipping Methods Step

**When to call:** Nothing — data arrives automatically via the webhook.

**What to read:** `additional_data` on each shipping method (Section 3).

**What to display:** Next to each shipping method option, show the delivery date. Example:

```
◉ Demo Postal Service — Ground Shipping — $5.99
  Estimated delivery: Thursday, March 12

○ Fedex Service — Express — $12.99
  Estimated delivery: Tuesday, March 10
```

---

## 5. Caching Recommendations

| Layer | Strategy | Key | TTL |
|-------|----------|-----|-----|
| **Server** (already implemented) | `aio-lib-state` keyed by destination+carriers hash | Automatic | Merchant-configured (default 1hr) |
| **Client** (recommended) | `sessionStorage` per destination | `delivery-est-{postal_code}-{country_code}` | 30 minutes or session |

Client-side caching avoids repeated calls when navigating between PDP and cart for the same destination.

---

## 6. Error Handling Rules

| Scenario | Storefront Behavior |
|----------|-------------------|
| Empty estimates (`estimates: []`) | Hide delivery date UI. Do not show an error. |
| HTTP 400 | Log the error. Hide delivery date UI. |
| HTTP 500 | Log the error. Hide delivery date UI. |
| Network failure / timeout | Hide delivery date UI. |
| `additional_data` missing on a shipping method | Show the method without a delivery date. |

**Critical rule:** Delivery estimates are **informational only**. They must never block a purchase, prevent navigation, or show error messages to the shopper.

---

## 7. Date Formatting Reference

All dates from the API are in `YYYY-MM-DD` format (ISO 8601, no timezone). For display:

```javascript
function formatDeliveryDate(isoDate, locale = "en-US") {
  const date = new Date(isoDate + "T00:00:00");
  return date.toLocaleDateString(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// "2026-03-12" => "Thursday, March 12"
```

The `cutoff_datetime_utc` is a full UTC datetime. Use it to show "Order within X hours" countdowns:

```javascript
function getHoursUntilCutoff(cutoffUtc) {
  const now = new Date();
  const cutoff = new Date(cutoffUtc);
  const diffMs = cutoff - now;
  if (diffMs <= 0) return 0;
  return Math.floor(diffMs / (1000 * 60 * 60));
}
```
