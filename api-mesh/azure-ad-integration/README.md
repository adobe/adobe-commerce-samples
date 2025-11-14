# API Mesh with Azure AD (Microsoft Entra ID) Integration

This example demonstrates how to integrate Azure AD (Microsoft Entra ID) authentication with Adobe API Mesh to secure your GraphQL endpoints using OAuth 2.0 and OpenID Connect.

## Overview

This sample shows how to:

- **Validate Azure AD JWT tokens** (OAuth 2.0 / OIDC) in custom resolvers
- **Integrate Microsoft Graph API** for user profiles
- **Protect API endpoints** with authentication
- **Fetch user-specific data** from Adobe Commerce based on Azure AD identity
- **Pass authentication context** between sources

## Architecture

```
Client (with Azure AD token)
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
│  Azure AD    │  Commerce API    │
│  (Graph API) │  (Orders, etc)   │
└──────────────┴──────────────────┘
```

## Prerequisites

Before you begin, ensure you have:

1. **Adobe Developer Account** with API Mesh access
2. **Azure AD (Microsoft Entra ID) tenant** - [Sign up here](https://azure.microsoft.com/en-us/free/)
3. **Node.js 18.x** or higher
4. **Adobe Commerce instance** (or use the Venia demo store)

## Azure AD Setup

### 1. Register an Application in Azure AD

1. Log in to [Azure Portal](https://portal.azure.com/)
2. Go to **Azure Active Directory** (or **Microsoft Entra ID**)
3. Select **App registrations** → **New registration**
4. Configure the application:
   - **Name**: Commerce API Integration
   - **Supported account types**: Accounts in this organizational directory only
   - **Redirect URI**: Leave blank for now (or add your app's callback)
5. Click **Register**
6. Note your:
   - **Application (client) ID**
   - **Directory (tenant) ID**

### 2. Create a Client Secret

1. In your app registration, go to **Certificates & secrets**
2. Click **New client secret**
3. Provide a description and select an expiry period
4. Click **Add**
5. **Copy the secret value immediately** (you won't see it again!)

### 3. Configure API Permissions

1. Go to **API permissions**
2. Click **Add a permission** →**Microsoft Graph** → **Delegated permissions**
3. Add permissions:
   - `User.Read` - Read user profile
   - `email` - View users' email address
   - `profile` - View users' basic profile
4. Click **Add permissions**
5. Click **Grant admin consent** (if you're an admin)

### 4. Configure Authentication

1. Go to **Authentication**
2. Under **Platform configurations**, add platforms if needed
3. Under **Implicit grant and hybrid flows**, check:
   - **Access tokens** (for implicit flow)
   - **ID tokens** (for implicit flow)
4. Click **Save**

## Installation

### 1. Clone and Install Dependencies

```bash
cd api-mesh/azure-ad-integration
npm install
```

### 2. Configure Environment Variables

Copy the sample environment file:

```bash
cp sample.env .env
```

Edit `.env` with your values:

```bash
# Your Azure AD tenant ID (Directory ID)
AZURE_TENANT_ID="12345678-1234-1234-1234-123456789abc"

# Your Application (client) ID
AZURE_CLIENT_ID="87654321-4321-4321-4321-210987654321"

# Your client secret
AZURE_CLIENT_SECRET="your_client_secret_value"

# Microsoft Graph API endpoint
GRAPH_API_ENDPOINT="https://graph.microsoft.com/v1.0"

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

### 1. Get an Azure AD Access Token

#### Option A: Using OAuth 2.0 Client Credentials Flow (for backend apps)

```bash
curl --request POST \
  --url https://login.microsoftonline.com/YOUR_TENANT_ID/oauth2/v2.0/token \
  --header 'content-type: application/x-www-form-urlencoded' \
  --data 'client_id=YOUR_CLIENT_ID' \
  --data 'client_secret=YOUR_CLIENT_SECRET' \
  --data 'scope=https://graph.microsoft.com/.default' \
  --data 'grant_type=client_credentials'
```

#### Option B: Using Authorization Code Flow (for web/mobile apps)

See [Microsoft identity platform documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow) for your platform.

### 2. Query the API Mesh

Use the token in the Authorization header:

```bash
curl --request POST \
  --url https://your-mesh-id.adobeioruntime.net/graphql \
  --header 'Authorization: Bearer YOUR_AZURE_AD_TOKEN' \
  --header 'Content-Type: application/json' \
  --data '{
    "query": "{ currentUser { mail displayName givenName surname customer { firstname lastname } orders(currentPage: 1, pageSize: 10) { items { id number order_date status } total_count } } }"
  }'
```

## Example Queries

See the `queries/` directory for example GraphQL queries:

- **`currentUser.graphql`** - Get basic authenticated user profile from Azure AD
- **`simpleUserProfile.graphql`** - Minimal query with Azure AD + basic customer info
- **`fullCustomerProfile.graphql`** - Complete profile with orders, wishlist, and addresses
- **`userWithOrders.graphql`** - Get user with their Commerce orders (paginated)

## Features

### 🔒 Token Validation

The resolver validates Azure AD JWT tokens using:
- **JWKS** (JSON Web Key Set) for signature verification
- **Audience** validation to ensure tokens are for your application
- **Issuer** validation to verify tokens are from your Azure AD tenant
- **Algorithm** validation (RS256)

### 👤 User Context

Authenticated user information is:
- Extracted from the JWT token
- Enriched with data from Microsoft Graph API
- Made available throughout the mesh via context
- Can be used to personalize queries

### 🔗 Source Integration

The mesh integrates:
- **Microsoft Graph API** (OpenAPI handler) for user profile data
- **Adobe Commerce API** (GraphQL handler) for e-commerce data
- Custom resolvers to link Azure AD users with Commerce customers

### 📊 Custom Schema Extensions

Additional GraphQL types:
- **`currentUser`** query returns authenticated user
- **`AzureADUser`** type with user profile fields:
  - `customer` - Full Commerce Customer object
  - `orders` - Paginated CustomerOrders with items and totals
  - `wishlist` - Customer's Wishlist with products
  - `addresses` - Array of CustomerAddress objects
  - Azure AD fields: `id`, `userPrincipalName`, `mail`, `displayName`, `givenName`, `surname`, `jobTitle`, `officeLocation`, `mobilePhone`

## Query Examples

### Basic User Profile
```graphql
query {
  currentUser {
    mail
    displayName
    givenName
    surname
  }
}
```

### User with Customer Data
```graphql
query {
  currentUser {
    mail
    displayName
    customer {
      firstname
      lastname
      created_at
    }
  }
}
```

### Complete Profile Query
```graphql
query {
  currentUser {
    # Azure AD data
    id
    mail
    displayName
    jobTitle
    
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

1. **Never expose your client secret** - Store it as a secret in API Mesh
2. **Use short-lived tokens** - Configure appropriate token expiration in Azure AD
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
- The token was issued for the correct audience (your Application ID)
- The `AZURE_CLIENT_ID` in your `.env` matches your app registration

### "Microsoft Graph API call failed"

This is often due to:
- Missing API permissions in Azure AD
- Token doesn't have required scopes
- Incorrect `AZURE_TENANT_ID`

## Advanced Configuration

### Using API Mesh Secrets

For production, store sensitive values as secrets:

```bash
aio api-mesh secret:create AZURE_CLIENT_SECRET "your_secret_here"
```

Then reference in environment variables or mesh config.

### Custom Token Validation

Modify `resolvers.js` to add custom validation logic:

```javascript
// Check for specific scopes
if (!decoded.scp || !decoded.scp.includes('User.Read')) {
  throw new Error('Insufficient permissions');
}

// Check for specific roles
if (decoded.roles && !decoded.roles.includes('Admin')) {
  throw new Error('Admin access required');
}
```

## Resources

- [Azure AD Documentation](https://docs.microsoft.com/en-us/azure/active-directory/)
- [Microsoft Identity Platform](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
- [Microsoft Graph API](https://docs.microsoft.com/en-us/graph/)
- [API Mesh Documentation](https://developer.adobe.com/graphql-mesh-gateway/mesh/)
- [Adobe Commerce GraphQL Reference](https://developer.adobe.com/commerce/webapi/graphql/)

## License

Copyright 2024 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0.

