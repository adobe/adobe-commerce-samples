# Quick Start Guide

Get up and running with Auth0 + API Mesh in 10 minutes!

## ⚡ Prerequisites

- [ ] Adobe Developer account with API Mesh access
- [ ] Auth0 account ([sign up free](https://auth0.com/signup))
- [ ] Node.js 18+ installed
- [ ] Basic understanding of GraphQL

## 🚀 Step-by-Step Setup

### Step 1: Configure Auth0 (3 minutes)

#### 1.1 Create an Auth0 API

1. Go to [Auth0 Dashboard](https://manage.auth0.com/)
2. Navigate to **Applications** → **APIs**
3. Click **Create API**
4. Fill in:
   - **Name**: `Commerce API`
   - **Identifier**: `https://commerce.example.com/api` (⚠️ Save this!)
5. Click **Create**

#### 1.2 Create an Application

1. Go to **Applications** → **Applications**
2. Click **Create Application**
3. Fill in:
   - **Name**: `Commerce App`
   - **Type**: Select your app type (SPA, Regular Web App, etc.)
4. Click **Create**
5. Go to **Settings** tab and save:
   - Domain (e.g., `your-tenant.auth0.com`)
   - Client ID
   - Client Secret

#### 1.3 Get Management API Token

For **testing** (24-hour token):
1. Go to **Applications** → **APIs** → **Auth0 Management API**
2. Click **API Explorer** tab
3. Click **Create & Authorize a Test Application**
4. Copy the token

For **production** (see README.md for Machine-to-Machine setup)

### Step 2: Install Dependencies (1 minute)

```bash
cd api-mesh/auth0-integration
npm install
```

### Step 3: Configure Environment (2 minutes)

Create `.env` file:

```bash
cp sample.env .env
```

Edit `.env` with your Auth0 values:

```bash
AUTH0_DOMAIN="your-tenant.auth0.com"
AUTH0_AUDIENCE="https://commerce.example.com/api"
AUTH0_MANAGEMENT_TOKEN="eyJhbGci..."
COMMERCE_ENDPOINT="https://venia.magento.com/graphql"
```

### Step 4: Deploy to API Mesh (2 minutes)

Install Adobe API Mesh CLI:

```bash
npm install -g @adobe/aio-cli-plugin-api-mesh
```

Login to Adobe:

```bash
aio login
```

Create the mesh:

```bash
aio api-mesh create meshConfig.json
```

✅ Save the mesh endpoint URL provided in the output!

### Step 5: Test the Integration (2 minutes)

#### 5.1 Get an Auth0 Token

```bash
export AUTH0_DOMAIN="your-tenant.auth0.com"
export AUTH0_CLIENT_ID="your_client_id"
export AUTH0_CLIENT_SECRET="your_client_secret"
export AUTH0_AUDIENCE="https://commerce.example.com/api"

TOKEN=$(curl -s --request POST \
  --url "https://${AUTH0_DOMAIN}/oauth/token" \
  --header 'content-type: application/json' \
  --data "{
    \"client_id\": \"${AUTH0_CLIENT_ID}\",
    \"client_secret\": \"${AUTH0_CLIENT_SECRET}\",
    \"audience\": \"${AUTH0_AUDIENCE}\",
    \"grant_type\": \"client_credentials\"
  }" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

echo "Token: ${TOKEN:0:20}..."
```

#### 5.2 Query API Mesh

```bash
export MESH_ENDPOINT="https://your-mesh-id.adobeioruntime.net/graphql"

curl --request POST \
  --url "${MESH_ENDPOINT}" \
  --header "Authorization: Bearer ${TOKEN}" \
  --header 'Content-Type: application/json' \
  --data '{
    "query": "{ currentUser { email name picture } }"
  }' | jq
```

Expected response:

```json
{
  "data": {
    "currentUser": {
      "email": "user@example.com",
      "name": "John Doe",
      "picture": "https://..."
    }
  }
}
```

🎉 **Success!** Your API Mesh is secured with Auth0!

## 🧪 Test with Sample Queries

### Query 1: Get Current User

```bash
curl -X POST ${MESH_ENDPOINT} \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d @queries/currentUser.graphql
```

### Query 2: Get User with Orders

```bash
curl -X POST ${MESH_ENDPOINT} \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"query":"query { currentUser { email name orders(currentPage: 1, pageSize: 5) { items { id number order_date status } total_count } } }"}'
```

### Query 3: Get User with Wishlist

```bash
curl -X POST ${MESH_ENDPOINT} \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"query":"query { currentUser { email wishlist { items_count items { product { name sku } } } } }"}'
```

### Query 4: Get Complete Profile

```bash
curl -X POST ${MESH_ENDPOINT} \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"query":"query { currentUser { email name customer { firstname lastname } orders(pageSize: 5) { total_count } wishlist { items_count } addresses { city country_code } } }"}'
```

### Query 5: Use the Example Script

```bash
cd queries
./example-request.sh
```

## 🐛 Troubleshooting

### Error: "No authorization header provided"

**Fix**: Make sure to include the Authorization header:
```bash
-H "Authorization: Bearer YOUR_TOKEN"
```

### Error: "Invalid token: jwt audience invalid"

**Fix**: Check that `AUTH0_AUDIENCE` in `.env` matches your Auth0 API Identifier exactly.

### Error: "Invalid token: jwt malformed"

**Fix**: Ensure you're using the access token (not ID token) and it hasn't expired.

### Auth0 Management API Returns 401

**Fix**: Your Management API token expired (24 hours). Generate a new one or set up Machine-to-Machine app.

### Mesh Deployment Fails

**Fix**: Check you're logged in to Adobe:
```bash
aio where
aio login
```

## 📚 Next Steps

- [ ] Read the full [README.md](./README.md) for detailed documentation
- [ ] Review [ARCHITECTURE.md](./ARCHITECTURE.md) to understand the flow
- [ ] Implement refresh token flow for production
- [ ] Add custom scopes and permissions
- [ ] Configure caching for better performance
- [ ] Set up monitoring and logging
- [ ] Add custom resolvers for your business logic

## 💡 Common Use Cases

### Use Case 1: Customer Portal
Authenticate customers, show their orders, wishlists, and account info.

### Use Case 2: Admin Dashboard
Secure admin operations with role-based access control (RBAC).

### Use Case 3: Mobile App
Use Auth0 native SDKs for iOS/Android with API Mesh backend.

### Use Case 4: Third-Party Integration
Allow partners to access your Commerce data with OAuth 2.0.

## 🔗 Helpful Links

- [Auth0 Documentation](https://auth0.com/docs)
- [API Mesh Documentation](https://developer.adobe.com/graphql-mesh-gateway/mesh/)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)
- [JWT.io Debugger](https://jwt.io) - Decode and verify tokens

## 🆘 Need Help?

- Check existing [GitHub Issues](https://github.com/adobe/adobe-commerce-samples/issues)
- Ask in [Adobe Commerce Community](https://community.adobe.com/)
- Contact [Auth0 Support](https://support.auth0.com/)

---

**Pro Tip**: Use [Postman](https://www.postman.com/) or [GraphQL Playground](https://github.com/graphql/graphql-playground) to test your API Mesh endpoints interactively!

