# Testing Out-of-Stock Notifications from the Command Line

Follow these steps to test the REST API, back-in-stock handler, and scheduled check-stock action.

---

## Prerequisites

1. **Environment**
   - Copy and fill `.env`: `cp env.dist .env`
   - Ensure at least `COMMERCE_BASE_URL` is set if you will test back-in-stock or check-stock (can leave empty to test only the API).

2. **Adobe I/O CLI**
   - Log in and select org/project/workspace:
     ```bash
     aio login
     aio console org select
     aio console project select
     aio console workspace select
     ```
   - Link the app: `aio app use` (choose merge if prompted).

3. **Deploy**
   - From the project root:
     ```bash
     aio app deploy
     ```
   - Wait until the deploy finishes successfully.

---

## 1. Test the REST API (subscriptions CRUD)

### 1.1 Get the web action URL

```bash
aio runtime action get notify-out-of-stock/api --url
```

Copy the URL (e.g. `https://xxx.adobeio-static.net/api/v1/web/xxx/notify-out-of-stock/api`). Use it as `API_URL` in the next steps.

### 1.2 Create a subscription (POST)

```bash
API_URL="<paste the URL from step 1.1>"

curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","sku":"MY-SKU-001"}'
```

Expected: HTTP 201 and a JSON body with `id`, `email`, `sku`, `createdAt`.

### 1.3 List all subscriptions (GET)

```bash
curl -X GET "$API_URL"
```

Expected: HTTP 200 and `{ "subscriptions": [ ... ] }`.

### 1.4 List by SKU or email (GET)

```bash
curl -X GET "$API_URL?sku=MY-SKU-001"
curl -X GET "$API_URL?email=test@example.com"
```

### 1.5 Read one subscription by id (GET)

Use the `id` from the create response:

```bash
curl -X GET "$API_URL?id=<subscription-id>"
```

Expected: HTTP 200 and the single subscription object.

### 1.6 Duplicate subscription (expect 409)

```bash
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","sku":"MY-SKU-001"}'
```

Expected: HTTP 409 and a message that the subscription already exists.

### 1.7 Delete subscription (DELETE)

By id:

```bash
curl -X DELETE "$API_URL?id=<subscription-id>"
```

Or by email + sku:

```bash
curl -X DELETE "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","sku":"MY-SKU-001"}'
```

Expected: HTTP 200 with `{ "success": true }`. A subsequent GET for that id or email+sku should return 404.

---

## 2. Test the back-in-stock action (event payload)

This invokes the back-in-stock handler with a fake stock payload (as if Commerce had sent the event). It will try to resolve `product_id` to SKU via Commerce REST if `COMMERCE_BASE_URL` is set; otherwise it will skip notifications.

### 2.1 Invoke with a test payload

Use a real `product_id` from your Commerce catalog if you want the SKU lookup to succeed; otherwise use any number.

```bash
aio runtime action invoke notify-out-of-stock/back-in-stock \
  --param data '{"product_id":1,"is_in_stock":true}' \
  --result
```

Expected: A JSON result with `statusCode: 200` and a message like "Back-in-stock notifications logged" or "No subscriptions to notify".

### 2.2 See logs (audit)

To see the back-in-stock log lines (e.g. "Back-in-stock notification (audit): sku=..."):

```bash
aio runtime activation list --limit 5
aio runtime activation get <activation-id>
```

Or use the Adobe Developer Console: your workspace → Runtime → Activations, then open the activation for `notify-out-of-stock/back-in-stock`.

---

## 3. Test the scheduled check-stock action

This loads subscriptions from state, calls Commerce `is-product-salable` for each SKU, and logs notifications for in-stock SKUs. Requires `COMMERCE_BASE_URL` (and Commerce auth) to be set.

### 3.1 Create at least one subscription (see section 1.2)

Use a SKU that exists and is in stock in your Commerce so that the check finds it.

### 3.2 Invoke check-stock

```bash
aio runtime action invoke notify-out-of-stock/check-stock --result
```

Expected: JSON with `statusCode: 200` and a body like `{ "success": true, "subscriptionsChecked": 1, "notified": 1 }` if the SKU is salable. If `COMMERCE_BASE_URL` is not set, you get a "Skipped: no Commerce URL" message.

### 3.3 Check logs

```bash
aio runtime activation list --limit 5
aio runtime activation get <activation-id>
```

Look for log lines: "Back-in-stock notification (scheduled audit): sku=... email=...".

---

## Quick copy-paste flow (after deploy)

Replace `YOUR_API_URL` with the URL from step 1.1.

```bash
# Create
curl -X POST "YOUR_API_URL" -H "Content-Type: application/json" -d '{"email":"cli@test.com","sku":"SKU-1"}'

# List
curl -X GET "YOUR_API_URL"

# Delete (use id from create response)
curl -X DELETE "YOUR_API_URL?id=YOUR_ID"

# Invoke back-in-stock (test payload)
aio runtime action invoke notify-out-of-stock/back-in-stock --param data '{"product_id":1,"is_in_stock":true}' --result

# Invoke scheduled check-stock
aio runtime action invoke notify-out-of-stock/check-stock --result
```
