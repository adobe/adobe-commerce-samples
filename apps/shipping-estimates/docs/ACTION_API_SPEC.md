# Delivery Estimates — App Builder Action API Specification

This document defines the HTTP contract for the `delivery-estimates` App Builder action. The storefront team should use this spec to implement delivery date displays on PDP and cart pages.

---

## 1. Overview

| Item | Description |
|------|-------------|
| **Purpose** | Return estimated delivery dates for display on PDP and cart pages. |
| **Action** | `delivery-estimates` (App Builder web action) |
| **URL** | `https://<namespace>.adobeioruntime.net/api/v1/web/commerce-checkout-starter-kit/delivery-estimates` |
| **Protocol** | HTTPS |
| **Data format** | JSON request and response |
| **Authentication** | None required (public web action for anonymous shoppers) |

> **Note:** The actual URL is assigned at deploy time. Get it from `aio app deploy` output or the Adobe Developer Console.

---

## 2. Endpoint

### 2.1 Get delivery estimates

**POST** `<action-url>`

Returns one or more delivery date estimates for the given destination.

---

## 3. Request

### 3.1 Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Content-Type` | Yes | `application/json` |

### 3.2 Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `destination` | object | **Yes** | Destination address. At least `country_code` or `postal_code` required. |
| `destination.country_code` | string | Recommended | ISO 3166-1 alpha-2 (e.g. `US`, `FR`). |
| `destination.postal_code` | string | Recommended | Destination postal/zip code. |
| `destination.city` | string | No | Destination city. |
| `ship_date` | string | No | Expected ship date (ISO 8601: `YYYY-MM-DD`). Defaults to today. |
| `carriers` | string[] | No | Carrier codes to request. If omitted, uses Admin-configured defaults. |
| `service_levels` | string[] | No | Service levels to include. If omitted, uses Admin-configured defaults. |

**Minimal example:**

```json
{
  "destination": {
    "country_code": "US",
    "postal_code": "10001"
  }
}
```

**Full example:**

```json
{
  "destination": {
    "country_code": "US",
    "postal_code": "10001",
    "city": "New York"
  },
  "ship_date": "2026-03-10",
  "carriers": ["standard", "express"],
  "service_levels": ["standard", "express"]
}
```

---

## 4. Response

### 4.1 Success (200 OK)

Returns a JSON object with an array of estimates and an optional best estimate.

| Field | Type | Description |
|-------|------|-------------|
| `estimates` | array | One entry per carrier/service combination. |
| `estimates[].carrier_code` | string | Carrier identifier (e.g. `standard`, `express`). |
| `estimates[].service_code` | string | Service or method code (e.g. `ground`, `2day`). |
| `estimates[].delivery_date` | string | Estimated delivery date (`YYYY-MM-DD`). |
| `estimates[].safe_delivery_date` | string | Conservative delivery date with buffer (`YYYY-MM-DD`). |
| `estimates[].transit_days` | integer | Business days in transit. |
| `estimates[].cutoff_datetime_utc` | string | Ship-by cutoff datetime in UTC (ISO 8601). |
| `best_estimation` | object\|null | Same shape as an `estimates[]` entry; the recommended option. |

**Example:**

```json
{
  "estimates": [
    {
      "carrier_code": "standard",
      "service_code": "ground",
      "delivery_date": "2026-03-14",
      "safe_delivery_date": "2026-03-15",
      "transit_days": 4,
      "cutoff_datetime_utc": "2026-03-10T17:00:00.000Z"
    },
    {
      "carrier_code": "express",
      "service_code": "2day",
      "delivery_date": "2026-03-12",
      "safe_delivery_date": "2026-03-12",
      "transit_days": 2,
      "cutoff_datetime_utc": "2026-03-10T12:00:00.000Z"
    }
  ],
  "best_estimation": {
    "carrier_code": "express",
    "service_code": "2day",
    "delivery_date": "2026-03-12",
    "safe_delivery_date": "2026-03-12",
    "transit_days": 2,
    "cutoff_datetime_utc": "2026-03-10T12:00:00.000Z"
  }
}
```

### 4.2 Empty result (200 OK)

Returned when the feature is disabled, the API is not configured, or no estimates are available for the destination.

```json
{
  "estimates": [],
  "best_estimation": null
}
```

### 4.3 Validation error (400 Bad Request)

Returned when the destination is missing or invalid.

```json
{
  "error": "bad_request",
  "message": "At least destination.country_code or destination.postal_code is required."
}
```

### 4.4 Server error (500 Internal Server Error)

```json
{
  "error": "internal_error",
  "message": "An unexpected error occurred."
}
```

---

## 5. Caching Behavior

- Responses are cached server-side (in `aio-lib-state`) by a hash of `destination + ship_date + carriers`.
- Cache TTL is configurable by the merchant via the Commerce Admin UI (default: 1 hour).
- The storefront may implement its own client-side caching (e.g. `sessionStorage`) to avoid repeated calls for the same destination.

---

## 6. Storefront Integration Guide

### 6.1 PDP (Product Detail Page)

Call the action when the PDP loads (or when the customer enters/changes their shipping address). Use the store's default country or the customer's known address. Display the `best_estimation.delivery_date` or a summary of all estimates.

**Example fetch:**

```javascript
async function getDeliveryEstimates(destination) {
  const actionUrl = '<delivery-estimates-action-url>';

  const response = await fetch(actionUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ destination }),
  });

  return response.json();
}

// Usage
const estimates = await getDeliveryEstimates({
  country_code: 'US',
  postal_code: '10001',
});

if (estimates.best_estimation) {
  console.log(`Estimated delivery: ${estimates.best_estimation.delivery_date}`);
}
```

### 6.2 Cart Page

Call the action using the shipping address from the cart (if available) or the store's default destination. Show a delivery estimate summary next to the cart totals.

### 6.3 Checkout (Shipping Step)

At checkout, delivery dates are also available in the shipping method's `additional_data` (added by the `shipping-methods` webhook). The checkout storefront drop-in can read:

```javascript
// Each shipping method in the checkout response may include:
// additional_data: [
//   { key: "delivery_date", value: "2026-03-14" },
//   { key: "safe_delivery_date", value: "2026-03-15" },
//   { key: "transit_days", value: "4" },
//   { key: "cutoff_datetime_utc", value: "2026-03-10T17:00:00.000Z" }
// ]
```

---

## 7. Configuration

All settings are managed by the merchant in the Commerce Admin UI (Apps > Delivery Estimates). No storefront configuration is needed.

| Setting | Impact on Storefront |
|---------|---------------------|
| **Feature enabled** | If disabled, action returns empty `{ estimates: [], best_estimation: null }` |
| **Cache TTL** | Controls how fresh estimates are; higher TTL = faster responses but less fresh data |
| **Default carriers** | Determines which carrier estimates are returned if the storefront doesn't specify `carriers` |

---

## 8. Error Handling Recommendations

- If the action returns empty estimates, show no delivery date (don't show an error).
- If the action returns a 400 or 500, log the error and hide the delivery estimate UI.
- Delivery estimates are informational — they should never block a purchase or navigation.
