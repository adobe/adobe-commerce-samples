# Shipping / Delivery Date Estimation API — Mock Specification

This document defines a **mock API** for shipping time and delivery date estimation. It is designed to be implemented locally or in App Builder for development and testing, and to align with common third-party APIs (e.g. Shipup, Shippit, carrier APIs) so that integration with a real provider can follow the same contract.

---

## 1. Overview

| Item | Description |
|------|-------------|
| **Purpose** | Return estimated delivery dates and optional transit times for given origin, destination, and optional ship date and carrier/service filters. |
| **Base URL (mock)** | The full workflow trigger URL (e.g. `https://<id>.m.pipedream.net`). The base URL is the complete endpoint — no path segments are appended by the client. |
| **Protocol** | REST over HTTPS |
| **Data format** | JSON request and response |

---

## 2. Authentication

The API expects **Bearer token** (API key) authentication.

| Aspect | Specification |
|--------|----------------|
| **Header** | `Authorization: Bearer <API_KEY>` |
| **API key** | Opaque string issued by the provider. For a mock, a fixed value (e.g. `mock-api-key`) is acceptable. |
| **Missing/invalid** | Respond with `401 Unauthorized` and a JSON error body (see Errors). |

Example:

```http
POST <BASE_URL>
Authorization: Bearer mock-api-key
Content-Type: application/json
```

---

## 3. Endpoint

### 3.1 Estimate delivery date(s)

**POST** `<BASE_URL>`

The base URL configured in the Admin UI is the complete endpoint. The client sends a POST request directly to this URL without appending any path segments. Returns one or more delivery date estimates, optionally filtered by carrier and service level.

---

## 4. Request

### 4.1 Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | Yes | `Bearer <API_KEY>` |
| `Content-Type` | Yes | `application/json` |

### 4.2 Body

All fields in the body are **optional** for the mock so that minimal payloads work; a real implementation may require origin/destination.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `origin` | object | Recommended | Origin location. |
| `origin.country_code` | string | No | ISO 3166-1 alpha-2 (e.g. `US`, `FR`). |
| `origin.postal_code` | string | No | Origin postal/zip code. |
| `origin.city` | string | No | Origin city. |
| `destination` | object | Recommended | Destination location. |
| `destination.country_code` | string | No | ISO 3166-1 alpha-2. |
| `destination.postal_code` | string | No | Destination postal/zip code. |
| `destination.city` | string | No | Destination city. |
| `ship_date` | string | No | Date when the order is expected to ship (ISO 8601 date: `YYYY-MM-DD`). Omit to assume "today" or a default. |
| `carriers` | string[] | No | List of carrier codes to return (e.g. `["standard", "express"]`). If omitted, mock may return a default set. |
| `service_levels` | string[] | No | Service levels to include (e.g. `standard`, `express`, `priority`). If omitted, mock may return all supported levels. |

**Minimal example (all optional):**

```json
{}
```

**Full example:**

```json
{
  "origin": {
    "country_code": "US",
    "postal_code": "90210",
    "city": "Beverly Hills"
  },
  "destination": {
    "country_code": "US",
    "postal_code": "10001",
    "city": "New York"
  },
  "ship_date": "2025-03-10",
  "carriers": ["standard", "express"],
  "service_levels": ["standard", "express"]
}
```

---

## 5. Response

### 5.1 Success (200 OK)

Returns a JSON object with an array of estimates and an optional "best" estimate.

| Field | Type | Description |
|-------|------|-------------|
| `estimates` | array | One entry per carrier/service combination. |
| `estimates[].carrier_code` | string | Carrier identifier (e.g. `standard`, `express`). |
| `estimates[].service_code` | string | Service or method code (e.g. `ground`, `2day`). |
| `estimates[].delivery_date` | string | Estimated delivery date (ISO 8601 date: `YYYY-MM-DD`). |
| `estimates[].safe_delivery_date` | string | Optional conservative date (e.g. with buffer), `YYYY-MM-DD`. |
| `estimates[].transit_days` | integer | Optional number of business days in transit. |
| `estimates[].cutoff_datetime_utc` | string | Optional cutoff (ship-by) datetime in UTC (ISO 8601), e.g. `2025-03-10T14:00:00.000Z`. |
| `best_estimation` | object | Optional; same shape as one `estimates[]` entry, representing the recommended option. |

**Example:**

```json
{
  "estimates": [
    {
      "carrier_code": "standard",
      "service_code": "ground",
      "delivery_date": "2025-03-14",
      "safe_delivery_date": "2025-03-15",
      "transit_days": 4,
      "cutoff_datetime_utc": "2025-03-10T17:00:00.000Z"
    },
    {
      "carrier_code": "express",
      "service_code": "2day",
      "delivery_date": "2025-03-12",
      "safe_delivery_date": "2025-03-12",
      "transit_days": 2,
      "cutoff_datetime_utc": "2025-03-10T12:00:00.000Z"
    }
  ],
  "best_estimation": {
    "carrier_code": "express",
    "service_code": "2day",
    "delivery_date": "2025-03-12",
    "safe_delivery_date": "2025-03-12",
    "transit_days": 2,
    "cutoff_datetime_utc": "2025-03-10T12:00:00.000Z"
  }
}
```

### 5.2 Empty result (200 OK)

If no estimates can be produced (e.g. unsupported region), return `200` with:

```json
{
  "estimates": [],
  "best_estimation": null
}
```

---

## 6. Errors

Use a consistent JSON error body. Example shape:

| Field | Type | Description |
|-------|------|-------------|
| `error` | string | Short code (e.g. `unauthorized`, `bad_request`, `service_unavailable`). |
| `message` | string | Human-readable description. |

| HTTP status | When |
|-------------|------|
| **400 Bad Request** | Invalid payload (e.g. invalid date format, invalid country code). |
| **401 Unauthorized** | Missing or invalid `Authorization` header / API key. |
| **503 Service Unavailable** | Optional; use for mock to simulate provider downtime. |

**Example (401):**

```json
{
  "error": "unauthorized",
  "message": "Missing or invalid API key."
}
```

---

## 7. References (real-world APIs)

- [Shipup – Delivery date estimation (POST)](https://developers.shipup.co/reference/delivery-date-estimation-post) — Bearer token, origin/destination, `delivery_date` / `safe_delivery_date` / `cutoff_datetime_utc`.
- [Shippit – Estimated delivery dates schema](https://developer.shippit.com/api_guide/estimated-delivery-dates/estimated-delivery-dates-schema.html) — Postcode-based request, `service_level` and `estimated_delivery_days` in response.
- FedEx Rates and Transit Times / carrier APIs — Origin/destination, ship date, service type; response includes delivery date and transit.
