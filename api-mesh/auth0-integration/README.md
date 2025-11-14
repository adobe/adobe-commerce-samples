# API Mesh with Auth0 Integration

This example demonstrates how to integrate Auth0 authentication with Adobe API Mesh to secure your GraphQL endpoints and manage user authentication.

## Overview

This sample shows how to:

- **Validate Auth0 JWT tokens** in custom resolvers
- **Integrate Auth0 Management API** as a GraphQL source
- **Protect API endpoints** with authentication
- **Fetch user-specific data** from Adobe Commerce based on Auth0 identity
- **Pass authentication context** between sources

## Architecture

```
Client (with Auth0 token)
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
│  Auth0 API   │  Commerce API    │
│  (User data) │  (Orders, etc)   │
└──────────────┴──────────────────┘
```

## Prerequisites

Before you begin, ensure you have:

1. **Adobe Developer Account** with API Mesh access
2. **Auth0 Account** - [Sign up here](https://auth0.com/docs/get-started)
3. **Node.js 18.x** or higher
4. **Adobe Commerce instance** (or use the Venia demo store)

## Auth0 Setup

### 1. Create an Auth0 Application

1. Log in to your [Auth0 Dashboard](https://manage.auth0.com/)
2. Go to **Applications** → **Applications**
3. Click **Create Application**
4. Choose your application type (SPA, Regular Web App, etc.)
5. Note your **Domain**, **Client ID**, and **Client Secret**

### 2. Create an Auth0 API

1. Go to **Applications** → **APIs**
2. Click **Create API**
3. Set a name (e.g., "Commerce API")
4. Set an **Identifier** (e.g., `https://commerce.example.com/api`)
   - This will be your `AUTH0_AUDIENCE`
5. Click **Create**

### 3. Get a Management API Token

To access Auth0's Management API for user profile data:

1. Go to **Applications** → **APIs**
2. Select **Auth0 Management API**
3. Go to **API Explorer** tab
4. Click **Create & Authorize a Test Application**
5. Copy the token (valid for 24 hours)

**For production**, create a Machine-to-Machine application:

1. Go to **Applications** → **Applications**
2. Click **Create Application**
3. Select **Machine to Machine Applications**
4. Authorize it for **Auth0 Management API**
5. Grant scopes: `read:users`, `read:user_idp_tokens`
6. Use Client Credentials flow to get tokens programmatically

## Installation

### 1. Clone and Install Dependencies

```bash
cd api-mesh/auth0-integration
npm install
```

### 2. Configure Environment Variables

Copy the sample environment file:

```bash
cp sample.env .env
```

Edit `.env` with your values:

```bash
# Your Auth0 tenant domain (without https://)
AUTH0_DOMAIN="your-tenant.auth0.com"

# The API identifier you created in Auth0
AUTH0_AUDIENCE="https://commerce.example.com/api"

# Management API token (see Auth0 Setup section)
AUTH0_MANAGEMENT_TOKEN="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."

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

### 1. Get an Auth0 Access Token

#### Option A: Using Auth0's Authentication API (for testing)

```bash
curl --request POST \
  --url https://YOUR_AUTH0_DOMAIN/oauth/token \
  --header 'content-type: application/json' \
  --data '{
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET",
    "audience": "YOUR_API_IDENTIFIER",
    "grant_type": "client_credentials"
  }'
```

#### Option B: Using Auth0 SDK in your app

See [Auth0 Quickstarts](https://auth0.com/docs/quickstarts) for your platform.

### 2. Query the API Mesh

Use the token in the Authorization header:

```bash
curl --request POST \
  --url https://your-mesh-id.adobeioruntime.net/graphql \
  --header 'Authorization: Bearer YOUR_AUTH0_TOKEN' \
  --header 'Content-Type: application/json' \
  --data '{
    "query": "{ currentUser { email name customer { firstname lastname } orders(currentPage: 1, pageSize: 10) { items { id number order_date status } total_count } } }"
  }'
```

## Example Queries

See the `queries/` directory for example GraphQL queries:

- **`currentUser.graphql`** - Get basic authenticated user profile from Auth0
- **`simpleUserProfile.graphql`** - Minimal query with Auth0 + basic customer info
- **`fullCustomerProfile.graphql`** - Complete profile with orders, wishlist, and addresses
- **`userWithOrders.graphql`** - Get user with their Commerce orders (paginated)
- **`customerOrders.graphql`** - Detailed orders query with variables for pagination
- **`customerWishlist.graphql`** - Get customer's wishlist with product details
- **`customerAddresses.graphql`** - Get all customer shipping and billing addresses
- **`protectedQuery.graphql`** - Comprehensive example combining all data sources

## Features

### 🔒 Token Validation

The resolver validates Auth0 JWT tokens using:
- **JWKS** (JSON Web Key Set) for signature verification
- **Audience** validation to ensure tokens are for your API
- **Issuer** validation to verify tokens are from your Auth0 tenant
- **Algorithm** validation (RS256)

### 👤 User Context

Authenticated user information is:
- Extracted from the JWT token
- Enriched with data from Auth0 Management API
- Made available throughout the mesh via context
- Can be used to personalize queries

### 🔗 Source Integration

The mesh integrates:
- **Auth0 Management API** (OpenAPI handler) for user profile data
- **Adobe Commerce API** (GraphQL handler) for e-commerce data
- Custom resolvers to link Auth0 users with Commerce customers

### 📊 Custom Schema Extensions

Additional GraphQL types:
- **`currentUser`** query returns authenticated user
- **`Auth0User`** type with user profile fields:
  - `customer` - Full Commerce Customer object
  - `orders` - Paginated CustomerOrders with items and totals
  - `wishlist` - Customer's Wishlist with products
  - `addresses` - Array of CustomerAddress objects
  - Auth0 fields: `sub`, `email`, `name`, `nickname`, `picture`, `email_verified`, `updated_at`

## Query Examples

### Basic User Profile
```graphql
query {
  currentUser {
    email
    name
    picture
  }
}
```

### User with Customer Data
```graphql
query {
  currentUser {
    email
    name
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

### User with Wishlist
```graphql
query {
  currentUser {
    email
    wishlist {
      items_count
      items {
        product {
          name
          sku
          price_range {
            minimum_price {
              final_price {
                value
                currency
              }
            }
          }
        }
      }
    }
  }
}
```

### User with Addresses
```graphql
query {
  currentUser {
    email
    addresses {
      firstname
      lastname
      street
      city
      region {
        region_code
      }
      postcode
      country_code
      default_shipping
      default_billing
    }
  }
}
```

### Complete Profile Query
```graphql
query {
  currentUser {
    # Auth0 data
    sub
    email
    name
    picture
    
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

1. **Never expose your Management API token** - Store it as a secret in API Mesh
2. **Use short-lived tokens** - Set appropriate token expiration times in Auth0
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
- `AUTH0_AUDIENCE` matches your API identifier in Auth0
- The token was requested with the correct audience

### "Auth0 Management API call failed"

This is often due to:
- Expired Management API token (regenerate it)
- Missing scopes (ensure `read:users` is granted)
- Incorrect `AUTH0_DOMAIN`

## Advanced Configuration

### Using API Mesh Secrets

For production, store sensitive values as secrets:

```bash
aio api-mesh secret:create AUTH0_MANAGEMENT_TOKEN "your_token_here"
```

Then reference in meshConfig.json:

```json
{
  "operationHeaders": {
    "Authorization": "Bearer {{secret.AUTH0_MANAGEMENT_TOKEN}}"
  }
}
```

### Custom Token Validation

Modify `resolvers.js` to add custom validation logic:

```javascript
// Check for specific scopes
if (!decoded.scope || !decoded.scope.includes('read:orders')) {
  throw new Error('Insufficient permissions');
}

// Check for custom claims
if (decoded.role !== 'admin') {
  throw new Error('Admin access required');
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

- [Auth0 Documentation](https://auth0.com/docs/get-started)
- [API Mesh Documentation](https://developer.adobe.com/graphql-mesh-gateway/mesh/)
- [Auth0 Management API Reference](https://auth0.com/docs/api/management/v2)
- [Adobe Commerce GraphQL Reference](https://developer.adobe.com/commerce/webapi/graphql/)

## License

Copyright 2024 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0.

