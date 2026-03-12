# Pipedream Setup — Delivery Date Estimation Mock API

This guide walks you through deploying the **Shipping / Delivery Date Estimation** mock API on [Pipedream](https://pipedream.com) so you can call it from your Adobe Commerce App Builder extension or any HTTP client. The mock implements [PIPEDREAM_API_SPEC.md](../PIPEDREAM_API_SPEC.md).

---

## Prerequisites

- A [Pipedream](https://pipedream.com) account (free tier is sufficient).
- The Node.js handler code from this folder: **`delivery-estimate-handler.js`**.

---

## 1. Create a new workflow

1. In Pipedream, go to **Workflows** and click **New Workflow**.
2. Name it (e.g. **Delivery Date Estimation Mock API**).

---

## 2. Add the HTTP / Webhook trigger

1. Click **+** to add a step and choose **HTTP / Webhook** as the trigger.
2. Configure the trigger:
   - **HTTP Method:** `POST`
   - **Path:** `/v1/delivery-estimate`  
     (If your plan only allows a single path, use the default path and call that URL; the handler does not check the path.)
3. Save. Pipedream will show your **Webhook URL**, e.g.:
   - `https://<your-endpoint>.m.pipedream.net`
4. Your full request URL will be:
   - **`https://<your-endpoint>.m.pipedream.net/v1/delivery-estimate`**  
   Use this as the mock API base URL in your App Builder app (e.g. in `.env`).

---

## 3. Add the Code step (handler)

1. Click **+** below the trigger to add another step.
2. Select **Run Node.js code**.
3. In the code editor, **replace the default code** with the contents of **`delivery-estimate-handler.js`** from this repo (`docs/pipedream/delivery-estimate-handler.js`).
4. Save the step.

The handler:

- Reads the request **body** and **headers** from the trigger event.
- Validates the **Bearer** token if `MOCK_API_KEY` is set (see below).
- Returns **401** for missing/invalid auth, **400** for invalid `ship_date`, and **200** with `estimates` and `best_estimation` per the API spec.

---

## 4. Configure the API key (optional)

To enforce Bearer token authentication:

1. Open your **workflow** (not the step).
2. Go to the workflow **Settings** (gear or **...** menu).
3. Add an **Environment variable** (or **Secret** if available):
   - **Name:** `MOCK_API_KEY`
   - **Value:** e.g. `mock-api-key` (or any secret you will send as `Authorization: Bearer <value>`).

If **`MOCK_API_KEY`** is not set, the handler accepts any request (and any Bearer value); useful for local testing.

---

## 5. Deploy and get the URL

1. **Deploy** or **Publish** the workflow so the HTTP endpoint is active.
2. Copy the **Webhook URL** from the trigger step.
3. Your mock API endpoint is:
   - **POST** `https://<your-endpoint>.m.pipedream.net/v1/delivery-estimate`

---

## 6. Test the mock API

### Minimal request (no auth if `MOCK_API_KEY` not set)

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer mock-api-key" \
  -d '{}' \
  "https://<your-endpoint>.m.pipedream.net/v1/delivery-estimate"
```

### Full request (origin, destination, ship_date, carriers)

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer mock-api-key" \
  -d '{
    "origin": { "country_code": "US", "postal_code": "90210", "city": "Beverly Hills" },
    "destination": { "country_code": "US", "postal_code": "10001", "city": "New York" },
    "ship_date": "2025-03-10",
    "carriers": ["standard", "express"],
    "service_levels": ["standard", "express"]
  }' \
  "https://<your-endpoint>.m.pipedream.net/v1/delivery-estimate"
```

Expected: **200** with JSON like:

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
  "best_estimation": { ... }
}
```

### Test 401 (when `MOCK_API_KEY` is set)

Send a wrong or missing token:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{}' \
  "https://<your-endpoint>.m.pipedream.net/v1/delivery-estimate"
```

Expected: **401** with body `{ "error": "unauthorized", "message": "Missing or invalid API key." }`.

---

## 7. Use in App Builder

In your Adobe Commerce checkout extension:

1. Put the mock base URL in config (e.g. `.env`):
   - `DELIVERY_ESTIMATE_API_BASE_URL=https://<your-endpoint>.m.pipedream.net`
   - `DELIVERY_ESTIMATE_API_KEY=mock-api-key` (or the value you set in `MOCK_API_KEY`).
2. From your shipping webhook action, call:
   - **POST** `{{DELIVERY_ESTIMATE_API_BASE_URL}}/v1/delivery-estimate`
   - **Headers:** `Authorization: Bearer {{DELIVERY_ESTIMATE_API_KEY}}`, `Content-Type: application/json`
   - **Body:** JSON per [PIPEDREAM_API_SPEC.md](../PIPEDREAM_API_SPEC.md) (origin, destination, ship_date, carriers, service_levels as needed).

---

## 8. Troubleshooting

| Issue | What to check |
|-------|----------------|
| **401** with correct key | Ensure `MOCK_API_KEY` in the workflow env matches exactly what you send in `Authorization: Bearer <key>`. |
| **Empty or wrong body** | In Pipedream, inspect the trigger step output: `steps.trigger.event.body` and `steps.trigger.event.headers`. If your trigger uses a different shape, adjust the first lines of the handler to match (e.g. `const body = steps.trigger.event?.body ?? {}`). |
| **Path not found / 404** | Confirm the trigger path is `/v1/delivery-estimate` and you are POSTing to the full URL including that path. |
| **No response or timeout** | Ensure the Code step runs and calls `$.respond()`. The HTTP trigger must be answered with `$.respond()` from a code step; otherwise the client may time out. |

---

## Files in this folder

| File | Purpose |
|------|---------|
| **PIPEDREAM_SETUP.md** | This deployment guide. |
| **delivery-estimate-handler.js** | Node.js code to paste into the Pipedream “Run Node.js code” step; implements the mock per PIPEDREAM_API_SPEC.md. |
