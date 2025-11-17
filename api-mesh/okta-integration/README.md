# API Mesh with Okta Integration

This example demonstrates how to integrate Okta authentication with Adobe API Mesh to secure your GraphQL endpoints and manage user authentication using OAuth 2.0 and OpenID Connect.

## Overview

This sample shows how to:

- **Validate Okta JWT tokens** (OAuth 2.0 / OIDC) in custom resolvers
- **Integrate Okta Users API** as a GraphQL source
- **Protect API endpoints** with authentication
- **Fetch user-specific data** from Adobe Commerce based on Okta identity
- **Pass authentication context** between sources

## Architecture

```
Client (with Okta token)
    ↓
API Mesh Gateway
    ↓
┌─────────────────────────────────┐
│  Token Validation (Resolver)   │
│  - Verify JWT signature         │
│  - Check audience & issuer      │
│  - Extract user identity        │
└─────────────────────────────────┘
    ↓
┌──────────────┬──────────────────┐
│  Okta API    │  Commerce API    │
│  (User data) │  (Orders, etc)   │
└──────────────┴──────────────────┘
```

## Prerequisites

Before you begin, ensure you have:

1. **Adobe Developer Account** with API Mesh access
2. **Okta Account** - [Sign up here](https://developer.okta.com/signup/)
3. **Node.js 18.x** or higher
4. **Adobe Commerce instance** (or use the Venia demo store)

## Okta Setup

### 1. Create an Okta Application

1. Log in to your [Okta Admin Dashboard](https://login.okta.com/)
2. Go to **Applications** → **Applications**
3. Click **Create App Integration**
4. Select:
   - **Sign-in method**: OIDC - OpenID Connect
   - **Application type**: Choose based on your use case (Web Application, SPA, Native, etc.)
5. Configure the application:
   - **App integration name**: Commerce API Integration
   - **Grant type**: Authorization Code (or Client Credentials for backend)
   - **Sign-in redirect URIs**: Add your app's callback URL
6. Click **Save**
7. Note your **Client ID** and **Client Secret**

### 2. Configure Authorization Server

1. Go to **Security** → **API**
2. Select your authorization server (or use `default`)
3. Note the **Issuer URI** (e.g., `https://your-domain.okta.com/oauth2/default`)
4. Under **Scopes**, ensure you have:
   - `openid`
   - `profile`
   - `email`

### 3. Get an API Token

To access Okta's Users API:

1. Go to **Security** → **API** → **Tokens**
2. Click **Create Token**
3. Give it a name (e.g., "API Mesh Integration")
4. Click **Create Token**
5. **Copy the token immediately** (you won't be able to see it again)

## Installation

### 1. Clone and Install Dependencies

```bash
cd api-mesh/okta-integration
npm install
```

### 2. Configure Environment Variables

Copy the sample environment file:

```bash
cp sample.env .env
```

Edit `.env` with your values:

```bash
# Your Okta domain (without https://)
OKTA_DOMAIN="your-domain.okta.com"

# The Client ID from your Okta application
OKTA_CLIENT_ID="your_client_id"

# The issuer URI from your authorization server
OKTA_ISSUER="https://your-domain.okta.com/oauth2/default"

# API token from Okta (see Okta Setup section)
OKTA_API_TOKEN="your_api_token"

# Your Adobe Commerce GraphQL endpoint
COMMERCE_ENDPOINT="https://your-commerce-instance.com/graphql"
```

### 3. Deploy to API Mesh

Install the Adobe API Mesh CLI if you haven't already:

```bash
npm install -g @adobe/aio-cli-plugin-api-mesh
```

Create or update your mesh:

```bash
aio api-mesh create meshConfig.json
```

Or update an existing mesh:

```bash
aio api-mesh update meshConfig.json
```

## Usage

### 1. Get an Okta Access Token

#### Option A: Using OAuth 2.0 Client Credentials Flow (for backend apps)

```bash
curl --request POST \
  --url https://YOUR_OKTA_DOMAIN/oauth2/default/v1/token \
  --header 'content-type: application/x-www-form-urlencoded' \
  --data 'client_id=YOUR_CLIENT_ID' \
  --data 'client_secret=YOUR_CLIENT_SECRET' \
  --data 'grant_type=client_credentials' \
  --data 'scope=openid profile email'
```

#### Option B: Using Authorization Code Flow (for web/mobile apps)

See [Okta OAuth 2.0 Guide](https://developer.okta.com/docs/guides/implement-grant-type/authcode/main/) for your platform.

### 2. Query the API Mesh

Use the token in the Authorization header:

```bash
curl --request POST \
  --url https://your-mesh-id.adobeioruntime.net/graphql \
  --header 'Authorization: Bearer YOUR_OKTA_TOKEN' \
  --header 'Content-Type: application/json' \
  --data '{
    "query": "{ currentUser { email firstName lastName customer { firstname lastname } orders(currentPage: 1, pageSize: 10) { items { id number order_date status } total_count } } }"
  }'
```

## Example Queries

See the `queries/` directory for example GraphQL queries:

- **`currentUser.graphql`** - Get basic authenticated user profile from Okta
- **`simpleUserProfile.graphql`** - Minimal query with Okta + basic customer info
- **`fullCustomerProfile.graphql`** - Complete profile with orders, wishlist, and addresses
- **`userWithOrders.graphql`** - Get user with their Commerce orders (paginated)

## Features

### 🔒 Token Validation

The resolver validates Okta JWT tokens using:
- **JWKS** (JSON Web Key Set) for signature verification
- **Audience** validation to ensure tokens are for your API
- **Issuer** validation to verify tokens are from your Okta tenant
- **Algorithm** validation (RS256)

### 👤 User Context

Authenticated user information is:
- Extracted from the JWT token
- Enriched with data from Okta Users API
- Made available throughout the mesh via context
- Can be used to personalize queries

### 🔗 Source Integration

The mesh integrates:
- **Okta Users API** (OpenAPI handler) for user profile data
- **Adobe Commerce API** (GraphQL handler) for e-commerce data
- Custom resolvers to link Okta users with Commerce customers

### 📊 Custom Schema Extensions

Additional GraphQL types:
- **`currentUser`** query returns authenticated user
- **`OktaUser`** type with user profile fields:
  - `customer` - Full Commerce Customer object
  - `orders` - Paginated CustomerOrders with items and totals
  - `wishlist` - Customer's Wishlist with products
  - `addresses` - Array of CustomerAddress objects
  - Okta fields: `id`, `email`, `login`, `firstName`, `lastName`, `status`, `created`, `activated`, `lastLogin`

## Query Examples

### Basic User Profile
```graphql
query {
  currentUser {
    email
    firstName
    lastName
  }
}
```

### User with Customer Data
```graphql
query {
  currentUser {
    email
    firstName
    customer {
      firstname
      lastname
      created_at
    }
  }
}
```

### User with Orders (Paginated)
```graphql
query {
  currentUser {
    email
    orders(currentPage: 1, pageSize: 10) {
      items {
        number
        order_date
        status
        total {
          grand_total {
            value
            currency
          }
        }
      }
      total_count
      page_info {
        current_page
        total_pages
      }
    }
  }
}
```

### Complete Profile Query
```graphql
query {
  currentUser {
    # Okta data
    id
    email
    firstName
    lastName
    
    # Customer info
    customer {
      id
      firstname
      lastname
    }
    
    # Orders
    orders(pageSize: 5) {
      items {
        number
        status
      }
      total_count
    }
    
    # Wishlist
    wishlist {
      items_count
    }
    
    # Addresses
    addresses {
      id
      city
      country_code
    }
  }
}
```

## Security Best Practices

1. **Never expose your API token** - Store it as a secret in API Mesh
2. **Use short-lived tokens** - Configure appropriate token expiration in Okta
3. **Implement token refresh** - Use refresh tokens for long-lived sessions
4. **Validate scopes** - Check token permissions for sensitive operations
5. **Rate limiting** - Configure rate limits in API Mesh
6. **HTTPS only** - Always use HTTPS in production

## Troubleshooting

### "No authorization header provided"

Ensure you're sending the `Authorization` header with your requests:

```bash
Authorization: Bearer YOUR_TOKEN_HERE
```

### "Invalid token: jwt malformed"

Check that:
- Your token is a valid JWT (three base64-encoded parts separated by dots)
- You're using an access token, not an ID token
- The token hasn't expired

### "Invalid token: jwt audience invalid"

Verify that:
- Your token was issued for the correct audience
- The issuer matches your `OKTA_ISSUER` configuration

### "Okta Users API call failed"

This is often due to:
- Expired or invalid API token
- Missing permissions on the API token
- Incorrect `OKTA_DOMAIN`

## Advanced Configuration

### Using API Mesh Secrets

For production, store sensitive values as secrets:

```bash
aio api-mesh secret:create OKTA_API_TOKEN "your_token_here"
```

Then reference in meshConfig.json:

```json
{
  "operationHeaders": {
    "Authorization": "SSWS {{secret.OKTA_API_TOKEN}}"
  }
}
```

### Custom Token Validation

Modify `resolvers.js` to add custom validation logic:

```javascript
// Check for specific scopes
if (!decoded.scp || !decoded.scp.includes('orders:read')) {
  throw new Error('Insufficient permissions');
}

// Check for custom claims
if (decoded.department !== 'sales') {
  throw new Error('Access restricted to sales department');
}
```

### Caching

Add caching to improve performance:

```json
{
  "meshConfig": {
    "cache": {
      "http": {
        "ttl": 3600
      }
    }
  }
}
```

## Resources

- [Okta Developer Documentation](https://developer.okta.com/docs/reference/api/authn/)
- [API Mesh Documentation](https://developer.adobe.com/graphql-mesh-gateway/mesh/)
- [Okta OAuth 2.0 Guide](https://developer.okta.com/docs/guides/implement-grant-type/overview/)
- [Adobe Commerce GraphQL Reference](https://developer.adobe.com/commerce/webapi/graphql/)

## License

Copyright 2024 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0.

