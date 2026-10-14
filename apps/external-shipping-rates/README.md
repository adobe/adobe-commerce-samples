# External Shipping Rates Integration

An Adobe Commerce checkout extension that integrates external shipping rate services via webhooks, built with the Adobe Commerce Checkout Starter Kit and Adobe App Builder.

## Overview

This extension enables merchants to integrate with external shipping rate providers at checkout, providing dynamic shipping costs calculated by third-party carrier APIs or custom pricing engines. The extension includes an Admin UI for merchants to configure their external service credentials and warehouse address without developer assistance.

### Features

- **Dynamic Shipping Rates**: Call external APIs to calculate shipping costs at checkout
- **Admin UI Configuration**: Secure configuration screen for service URL, API key, and warehouse address
- **Dual Security**: OAuth authentication + webhook signature verification
- **API Key Masking**: Secure storage and masked display of sensitive credentials
- **Error Handling**: Graceful fallback to default carriers when external API is unavailable
- **Telemetry**: Built-in monitoring and metrics for production observability

### Architecture

- **Webhook Action**: `actions/shipping-methods/index.js` - Intercepts shipping rate requests
- **Admin UI**: `commerce-backend-ui-1/` - React-based configuration screen using Admin UI SDK
- **Configuration Storage**: aio-lib-state (encrypted key-value storage)
- **External API**: Configurable HTTPS endpoint with API key authentication

---

## Prerequisites

You must install or have access to the following prerequisites to deploy this extension:

- Adobe Commerce as a Cloud Service (SaaS) or Adobe Commerce version **2.4.5** or higher (PaaS)
- [Node.js](https://nodejs.org/) version **22** or higher:
  ```bash
  nvm install 22 && nvm use
  ```
- [Adobe I/O CLI](https://developer.adobe.com/app-builder/docs/guides/runtime_guides/tools/cli-install):
  ```bash
  npm install -g @adobe/aio-cli
  ```
- Access to the [Adobe Developer Console](https://console.adobe.io/) with an App Builder license
- An external shipping rates API endpoint (mock or production)

---

## Install Adobe Commerce Modules (PaaS only)

For PaaS (on-premise/cloud) installations, install the required modules:

```bash
# Required: Out-of-process shipping methods module
composer require magento/module-out-of-process-shipping-methods --with-dependencies

# Required: Commerce Webhooks
composer require magento/module-adobe-commerce-webhooks-admin --with-dependencies
composer require magento/module-adobe-commerce-webhooks-subscriber --with-dependencies
```

For more details, refer to [Install Adobe Commerce Webhooks](https://developer.adobe.com/commerce/extensibility/webhooks/installation/).

Install the Admin UI SDK module (version 3.0.0 or higher):

```bash
composer require "magento/commerce-backend-sdk": ">=3.0"
```

Refer to the [Admin UI SDK installation process](https://developer.adobe.com/commerce/extensibility/admin-ui-sdk/installation/).

**Note:** SaaS installations include these modules by default.

---

## Create an App Builder Project

1. Log in to the [Adobe Developer Console](https://console.adobe.io/)
2. Select your organization from the dropdown menu in the top-right corner
3. Click **Create new project from template**
4. Select **App Builder**
5. Specify a project title and app name
6. Mark the **Include Runtime with each workspace** checkbox
7. Click **Save**

---

## Initialize App Builder Project

1. Navigate to the project directory and run:

   ```bash
   npm install
   aio login
   aio console org select
   aio console project select
   aio console workspace select
   aio app use --merge
   ```

2. Add required services to your project:

   ```bash
   aio app add service
   ```

   Select the following from the list:
   - **I/O Management API** (required)
   - **Adobe Commerce as a Cloud Service** (if connecting to SaaS)

3. Copy the environment variables template:

   ```bash
   cp env.dist .env
   ```

4. Run the OAuth credentials sync script:

   ```bash
   npm run sync-oauth-credentials
   ```

   This populates `.env` with:
   ```env
   OAUTH_CLIENT_ID=
   OAUTH_CLIENT_SECRETS=[""]
   OAUTH_TECHNICAL_ACCOUNT_ID=
   OAUTH_TECHNICAL_ACCOUNT_EMAIL=
   OAUTH_SCOPES=[""]
   OAUTH_IMS_ORG_ID=
   ```

---

## Configure Adobe Commerce Connection

Update the `.env` file with your Commerce instance details:

```env
# Commerce instance URL
# PaaS: https://<your-commerce-url>/rest/all/
# SaaS: https://na1.api.commerce.adobe.com/<tenant_id>/
COMMERCE_BASE_URL=

# Webhook signature verification public key
# (Generate in Commerce Admin: Stores → Configuration → Adobe Services → Webhooks)
COMMERCE_WEBHOOKS_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
-----END PUBLIC KEY-----"
```

### Authentication Options

**Option 1: IMS Authentication (Recommended for SaaS, Required for Admin UI)**

1. Go to [Adobe Developer Console](https://developer.adobe.com/console) → Your Project → OAuth Server-to-Server
2. Note the credentials (already in `.env` from `sync-oauth-credentials`)
3. In Commerce Admin, create a technical account user:
   - Go to **System → Permissions → All Users → Add New User**
   - Email: Use the **Technical Account Email** from IMS credentials (`<account>@techacct.adobe.com`)
   - Assign appropriate API permissions (Catalog, Sales, Stores, etc.)

**Option 2: Commerce Integration (PaaS only, without Admin UI)**

1. Go to **System → Extensions → Integrations → Add New Integration**
2. Copy the credentials to `.env`:
   ```env
   COMMERCE_CONSUMER_KEY=
   COMMERCE_CONSUMER_SECRET=
   COMMERCE_ACCESS_TOKEN=
   COMMERCE_ACCESS_TOKEN_SECRET=
   ```

**Note:** Admin UI requires IMS authentication.

---

## Configure Shipping Carrier

Create the external shipping carrier in Commerce Admin:

```bash
npm run create-shipping-carriers
```

This script reads `shipping-carriers.yaml` and creates a carrier with:
- **Code**: `external_shipping`
- **Title**: External Shipping Service
- **Countries**: US, CA, GB, DE, FR, AU
- **Active**: true

---

## Configure Webhooks

### 1. Generate Webhook Public Key

1. In Commerce Admin, go to **Stores → Configuration → Adobe Services → Webhooks**
2. Enable **Digital Signature Configuration**
3. Click **Regenerate Key Pair**
4. Copy the **Public Key** and add to `.env` as shown above

### 2. Deploy the Application

Deploy your App Builder actions:

```bash
aio app deploy
```

Note the **shipping-methods action URL** from the deployment output.

### 3. Register the Webhook

**For SaaS:**

Go to **System → Webhooks → Webhooks Subscriptions** and create a new webhook:
- **Name**: External Shipping Rates
- **Method**: `plugin.magento.out_of_process_shipping_methods.api.shipping_rate_repository.get_rates`
- **Type**: `after`
- **URL**: `<your-shipping-methods-action-url>`
- **Required**: **Optional** (enables fallback to default carriers)
- **Logging**: Enable `x-ow-extra-logging: on` for debugging

**For PaaS:**

Use the `webhooks.xml` configuration file (refer to Checkout Starter Kit documentation).

---

## Configure External Shipping Service

### Option 1: Use Mock API (Testing)

For testing, you can use a mock service like Pipedream or Beeceptor:

1. Create a mock endpoint at [https://pipedream.com/](https://pipedream.com/)
2. Configure it to return shipping rates in the format specified in `docs/mock-rates-api-spec.md`
3. Note the endpoint URL and generate an API key

### Option 2: Use Production API

If you have a production shipping rates API, ensure it supports:
- **Method**: POST
- **Authentication**: API key in `API-Key` header
- **Request format**: See `docs/mock-rates-api-spec.md`
- **Response format**: JSON with `rates` array

### Configure in Commerce Admin UI

1. Log in to Commerce Admin
2. Navigate to **System → External Shipping Config** (menu item added by the extension)
3. Fill in the configuration form:
   - **Service URL**: Your external API endpoint (e.g., `https://example.m.pipedream.net`)
   - **API Key**: Your authentication key (will be masked after saving)
   - **Warehouse Address**: Ship-from location details
     - Name (e.g., "Main Warehouse")
     - Phone (optional)
     - Street Address
     - City
     - State/Province
     - Postal Code
     - Country Code (ISO 2-letter, e.g., "US")
4. Click **Save Configuration**
5. (Optional) Click **Test Connection** to verify API connectivity

The API key is stored encrypted and never exposed in full in the UI or logs.

---

## Validation & Testing

### Test the Checkout Flow

1. Add a product to the cart
2. Proceed to checkout
3. Enter a shipping address
4. Verify that shipping options from your external service appear

### Troubleshooting

**Shipping rates not appearing:**
- Check Commerce Admin webhook configuration (Status should be "Active")
- Enable `x-ow-extra-logging: on` in webhook settings
- View action logs: `aio app logs --action shipping-methods`
- Verify external API is accessible and returns valid response
- Check COMMERCE_WEBHOOKS_PUBLIC_KEY is correct in `.env`

**Configuration not saving:**
- Check browser console for errors
- Verify IMS authentication is working (Admin UI requires IMS)
- Check action logs: `aio app logs --action config`

**External API errors:**
- Verify API key is correct
- Check service URL is HTTPS
- Test API endpoint directly with curl/Postman
- Review action logs for detailed error messages

### View Logs

```bash
# View all logs
aio app logs

# View shipping-methods action logs
aio app logs --action shipping-methods

# Tail logs in real-time
aio app logs --tail
```

---

## Development

### Local Development

Run the app locally:

```bash
aio app dev
```

This starts a local development server and watches for file changes.

### Code Quality

```bash
# Check code quality
npm run code:check

# Auto-fix issues
npm run code:fix

# Format code
npm run format

# Lint code
npm run lint
```

### Testing

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

---

## Architecture & Security

### Webhook Flow

```
Commerce Checkout
    ↓ (webhook: shipping rate request)
shipping-methods Action
    ↓ 1. Verify signature
    ↓ 2. Fetch config from aio-lib-state
    ↓ 3. Transform request → external format
    ↓ 4. Call external API (POST with API-Key header)
    ↓ 5. Transform response → Commerce operations array
    ↓ 6. Return shipping methods
Commerce Checkout
    ↓ (displays shipping options to customer)
```

### Dual Security Model

1. **Webhook Signature Verification** (in action code)
   - Validates payload authenticity using COMMERCE_WEBHOOKS_PUBLIC_KEY
   - Ensures request originated from Commerce

2. **OAuth Authentication** (optional, via `require-adobe-auth`)
   - Controls who can invoke the action URL
   - IMS validates caller identity

**Current Configuration:** Signature-only (`require-adobe-auth: false`)

### Data Security

- **API Key**: Stored encrypted in aio-lib-state, masked in UI (shows last 3 characters)
- **PII**: Customer addresses only in memory during webhook processing, never persisted
- **Logging**: No credentials or PII in logs
- **Environment Variables**: `.env` gitignored, never committed

---

## Support & Resources

### Documentation

- [Adobe Commerce Checkout Starter Kit](https://developer.adobe.com/commerce/extensibility/starter-kit/checkout/)
- [Webhooks Documentation](https://developer.adobe.com/commerce/extensibility/webhooks/)
- [Admin UI SDK](https://developer.adobe.com/commerce/extensibility/admin-ui-sdk/)
- [App Builder Documentation](https://developer.adobe.com/app-builder/)

### Commands Reference

```bash
# Deployment
aio app deploy                     # Deploy to Adobe I/O Runtime
aio app deploy --local --verbose   # Local validation

# Development
aio app dev                        # Local development server
aio app logs                       # View action logs
aio app logs --tail               # Tail logs in real-time

# Configuration
npm run sync-oauth-credentials     # Sync OAuth creds from console
npm run create-shipping-carriers   # Create carrier in Commerce Admin

# Testing
npm test                           # Run unit tests
npm run code:check                 # Check code quality
```

### Getting Help

- Review [REQUIREMENTS.md](./REQUIREMENTS.md) for detailed specifications
- Check [docs/APP_SUBMISSION_AUDIT_REPORT.md](./docs/APP_SUBMISSION_AUDIT_REPORT.md) for compliance status
- Report issues on your project's issue tracker

---

## License

Apache-2.0 License. See [LICENSE](./LICENSE) for details.

---

**Built with:** Adobe Commerce Checkout Starter Kit | Adobe App Builder | Node.js 22
