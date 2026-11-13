# Mock Shipping Rates API — Specification

This document describes the **mock shipping rates API** used in the tutorial. The contract is close enough to typical real shipping rates APIs so that the same Adobe Commerce extension can call a production provider by updating configuration.

**Audience:** Use this spec to implement a client that calls this API, or a server (e.g. Pipedream workflow, Beeceptor rules, or custom backend) that implements it. The spec can be passed to an agent or tool to generate integration code.

## Overview

| Item | Value |
|------|--------|
| **Purpose** | Return shipping rate options for a given shipment (ship-from, ship-to, packages). |
| **Base URL** | Provided by the implementer (e.g. `https://<your-id>.m.pipedream.net` for Pipedream). |
| **Single operation** | `POST <base_url>` — get shipping rates. No path suffix required when base URL is the workflow/endpoint root. |
| **Authentication** | API key passed in the `API-Key` HTTP header. Any non-empty value is accepted by the tutorial mock. |
| **Request/response** | JSON; `Content-Type: application/json`. |

## Authentication

- **Type:** API key in header.
- **Header name:** `API-Key` (case-sensitive for the client; some servers normalize headers to lowercase).
- **Value:** Any non-empty string for the tutorial mock (e.g. `tutorial-key`). A real provider uses a live API key.
- **If missing or empty:** Server MUST respond with `401 Unauthorized` and a JSON body (e.g. `{ "error": "Missing or invalid API-Key header" }`).

## Endpoint: Get shipping rates

### Request

- **Method:** `POST`
- **URL:** Base URL of the mock (no path suffix, or `/`).  
  Example: `POST https://xxxxx.m.pipedream.net`
- **Headers:**
  - `Content-Type: application/json` (required)
  - `API-Key: <your_api_key>` (required)

### Request body (JSON)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `shipment` | object | Yes | Shipment details (ship-from, ship-to, packages). |
| `rate_options` | object | No | Options for which carriers to use. |
| `rate_options.carrier_ids` | string[] | No | List of carrier IDs to request rates from. |

#### `shipment` object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ship_to` | object | Yes | Destination address. |
| `ship_from` | object | Yes | Origin address (e.g. warehouse). |
| `packages` | array | Yes | One or more packages (weight). |

#### `ship_to` / `ship_from` (address object)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | Name. |
| `phone` | string | No | Phone. |
| `address_line1` | string | No | Street address line 1. |
| `city_locality` | string | No | City. |
| `state_province` | string | No | State/region code. |
| `postal_code` | string | No | Postal code. |
| `country_code` | string | No | ISO country code (e.g. `US`). |

#### `packages[]` (package object)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `weight` | object | No | Package weight. |
| `weight.value` | number | No | Numeric weight. |
| `weight.unit` | string | No | Unit (e.g. `pound`). |

**Example request body:**

```json
{
  "shipment": {
    "ship_to": {
      "name": "Customer",
      "address_line1": "123 Main St",
      "city_locality": "Austin",
      "state_province": "TX",
      "postal_code": "78701",
      "country_code": "US"
    },
    "ship_from": {
      "name": "Warehouse",
      "address_line1": "456 Depot Rd",
      "city_locality": "Dallas",
      "state_province": "TX",
      "postal_code": "75201",
      "country_code": "US"
    },
    "packages": [
      { "weight": { "value": 1, "unit": "pound" } }
    ]
  },
  "rate_options": {
    "carrier_ids": ["se-123", "se-456"]
  }
}
```

## Response

### Success: 200 OK

- **Headers:** `Content-Type: application/json`
- **Body:** JSON with a top-level `rates` array. Each element is a rate object.

The client (e.g. the extension) also accepts a response in the form `rate_response.rates`. The mock can return either:

- `{ "rates": [ ... ] }` (preferred), or  
- `{ "rate_response": { "rates": [ ... ] } }`

#### Rate object (each element of `rates`)

At least one of the following cost fields MUST be present so the client can derive a price. The client uses the first available: `shipping_amount.amount`, then `shipment_cost`, then `cost`.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `service_code` | string | No | Carrier service code (e.g. `mock_standard`). |
| `service_type` | string | No | Alternative to `service_code`. |
| `service_name` | string | No | Human-readable name (e.g. `Mock Standard`). |
| `carrier_friendly_name` | string | No | Carrier display name. |
| `shipping_amount` | object | No | Amount object. |
| `shipping_amount.amount` | number | No | Numeric price. |
| `shipment_cost` | number | No | Alternative numeric price. |
| `cost` | number | No | Alternative numeric price. |

**Example success response:**

```json
{
  "rates": [
    {
      "service_code": "mock_standard",
      "service_name": "Mock Standard",
      "carrier_friendly_name": "Mock Carrier",
      "shipping_amount": { "amount": 5.99 },
      "shipment_cost": 5.99,
      "cost": 5.99
    },
    {
      "service_code": "mock_express",
      "service_name": "Mock Express",
      "carrier_friendly_name": "Mock Carrier",
      "shipping_amount": { "amount": 12.99 },
      "shipment_cost": 12.99,
      "cost": 12.99
    }
  ]
}
```

## Error responses

All error responses MUST use `Content-Type: application/json` and a JSON body. Suggested fields: `error` (string, human-readable message).

| HTTP status | When | Example body |
|-------------|------|--------------|
| **400 Bad Request** | Missing or invalid `shipment` (e.g. not an object). | `{ "error": "Missing or invalid shipment" }` |
| **401 Unauthorized** | Missing or empty `API-Key` header. | `{ "error": "Missing or invalid API-Key header" }` |
| **500 Internal Server Error** | Server error (optional; mock may omit). | `{ "error": "Internal server error" }` |

## Summary for integration

- **Method:** `POST` to base URL (no path).
- **Headers:** `Content-Type: application/json`, `API-Key: <non_empty_string>`.
- **Request body:** `{ "shipment": { "ship_to", "ship_from", "packages" }, "rate_options": { "carrier_ids": [] } }`.
- **Success:** `200` with `{ "rates": [ { "service_code", "service_name", "shipping_amount" or "shipment_cost" or "cost", ... } ] }`.
- **Errors:** `400` (bad shipment), `401` (missing/invalid API key), JSON body with `error`.

For step-by-step creation of the Pipedream mock, see the **Create the mock shipping rates API** section in the [Shipping method extension tutorial](shipping-method-extension.md).
