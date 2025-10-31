# Quick Start Guide

Get up and running with Okta + API Mesh in 10 minutes!

## ⚡ Prerequisites

- [ ] Adobe Developer account with API Mesh access
- [ ] Okta account ([sign up free](https://developer.okta.com/signup/))
- [ ] Node.js 18+ installed
- [ ] Basic understanding of GraphQL

## 🚀 Step-by-Step Setup

### Step 1: Configure Okta (3 minutes)

#### 1.1 Create an Okta Application

1. Go to [Okta Admin Dashboard](https://login.okta.com/)
2. Navigate to **Applications** → **Applications**
3. Click **Create App Integration**
4. Select:
   - **Sign-in method**: OIDC - OpenID Connect
   - **Application type**: Web Application (or appropriate for your use case)
5. Fill in:
   - **App integration name**: `Commerce API Integration`
   - **Grant type**: Select Authorization Code and Client Credentials
6. Click **Save**
7. Note your:
   - **Client ID**
   - **Client Secret**
   - **Okta domain** (e.g., `your-domain.okta.com`)

#### 1.2 Get an API Token

1. Go to **Security** → **API** → **Tokens**
2. Click **Create Token**
3. Name it: `API Mesh Integration`
4. Click **Create Token**
5. **Copy the token immediately** (⚠️ you won't see it again!)

#### 1.3 Note Your Authorization Server

1. Go to **Security** → **API**
2. Select your authorization server (typically `default`)
3. Copy the **Issuer URI** (e.g., `https://your-domain.okta.com/oauth2/default`)

### Step 2: Install Dependencies (1 minute)

```bash
cd api-mesh/okta-integration
npm install
```

### Step 3: Configure Environment (2 minutes)

Create `.env` file:

```bash
cp sample.env .env
```

Edit `.env` with your Okta values:

```bash
OKTA_DOMAIN="your-domain.okta.com"
OKTA_CLIENT_ID="0oa1a2b3c4d5e6f7g8h9"
OKTA_ISSUER="https://your-domain.okta.com/oauth2/default"
OKTA_API_TOKEN="00AbCdEfGhIjKlMnOpQrStUvWxYz..."
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

#### 5.1 Get an Okta Token

```bash
export OKTA_DOMAIN="your-domain.okta.com"
export OKTA_CLIENT_ID="your_client_id"
export OKTA_CLIENT_SECRET="your_client_secret"

TOKEN=$(curl -s --request POST \
  --url "https://${OKTA_DOMAIN}/oauth2/default/v1/token" \
  --header 'content-type: application/x-www-form-urlencoded' \
  --data "client_id=${OKTA_CLIENT_ID}" \
  --data "client_secret=${OKTA_CLIENT_SECRET}" \
  --data "grant_type=client_credentials" \
  --data "scope=openid profile email" \
  | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

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
    "query": "{ currentUser { email firstName lastName } }"
  }' | jq
```

Expected response:

```json
{
  "data": {
    "currentUser": {
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

🎉 **Success!** Your API Mesh is secured with Okta!

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
  -d '{"query":"query { currentUser { email firstName orders(currentPage: 1, pageSize: 5) { items { id number order_date status } total_count } } }"}'
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
  -d '{"query":"query { currentUser { email firstName customer { firstname lastname } orders(pageSize: 5) { total_count } wishlist { items_count } addresses { city country_code } } }"}'
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

**Fix**: Check that `OKTA_ISSUER` in `.env` matches your authorization server's issuer URI exactly.

### Error: "Invalid token: jwt malformed"

**Fix**: Ensure you're using the access token (not ID token) and it hasn't expired. Tokens typically expire in 1 hour.

### Okta Users API Returns 401

**Fix**: Your API token may be invalid or expired. Create a new one in the Okta admin dashboard.

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
Use Okta native SDKs for iOS/Android with API Mesh backend.

### Use Case 4: Third-Party Integration
Allow partners to access your Commerce data with OAuth 2.0.

## 🔗 Helpful Links

- [Okta Developer Docs](https://developer.okta.com/docs/)
- [API Mesh Documentation](https://developer.adobe.com/graphql-mesh-gateway/mesh/)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)
- [JWT.io Debugger](https://jwt.io) - Decode and verify tokens

## 🆘 Need Help?

- Check existing [GitHub Issues](https://github.com/adobe/adobe-commerce-samples/issues)
- Ask in [Adobe Commerce Community](https://community.adobe.com/)
- Contact [Okta Support](https://support.okta.com/)

---

**Pro Tip**: Use [Postman](https://www.postman.com/) or [GraphQL Playground](https://github.com/graphql/graphql-playground) to test your API Mesh endpoints interactively!

