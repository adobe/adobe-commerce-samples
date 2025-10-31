# Architecture Overview

## Authentication Flow

```mermaid
sequenceDiagram
    participant Client
    participant Auth0
    participant API Mesh
    participant Resolver
    participant Commerce API
    participant Auth0 Management API

    Client->>Auth0: 1. Login / Get Token
    Auth0-->>Client: 2. JWT Access Token
    
    Client->>API Mesh: 3. GraphQL Query + JWT Token
    API Mesh->>Resolver: 4. Execute Custom Resolver
    
    Resolver->>Resolver: 5. Validate JWT Token<br/>(Signature, Audience, Issuer)
    
    alt Token Valid
        Resolver->>Auth0 Management API: 6. Get User Profile
        Auth0 Management API-->>Resolver: 7. User Data
        
        Resolver->>Commerce API: 8. Query Commerce<br/>(with user context)
        Commerce API-->>Resolver: 9. Customer Data
        
        Resolver-->>API Mesh: 10. Combined Response
        API Mesh-->>Client: 11. GraphQL Response
    else Token Invalid
        Resolver-->>API Mesh: Error: Authentication Failed
        API Mesh-->>Client: 401 Unauthorized
    end
```

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Application                       │
│  (Web, Mobile, SPA - with Auth0 SDK integrated)                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTPS + Authorization: Bearer <token>
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                      API Mesh Gateway                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           GraphQL Unified Schema                         │   │
│  │  - Type Definitions (mesh config)                        │   │
│  │  - Custom Resolvers (Auth0 validation)                   │   │
│  │  - Source Handlers (GraphQL, OpenAPI)                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         JWT Token Validation Layer                       │   │
│  │  - JWKS signature verification                           │   │
│  │  - Audience validation                                    │   │
│  │  - Issuer validation                                      │   │
│  │  - Expiration check                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────┬──────────────────────┬──────────────────────────┘
                │                      │
                │                      │
    ┌───────────▼──────────┐  ┌────────▼────────────────┐
    │   Auth0 API          │  │  Adobe Commerce API     │
    │                      │  │                         │
    │  - Management API    │  │  - GraphQL Endpoint     │
    │  - User Profiles     │  │  - Customer Data        │
    │  - User Metadata     │  │  - Orders               │
    └──────────────────────┘  │  - Products             │
                              │  - Cart Operations      │
                              └─────────────────────────┘
```

## Data Flow

### 1. Token Acquisition
- User authenticates with Auth0 (login page, SDK, etc.)
- Auth0 validates credentials
- Returns JWT access token with claims (sub, email, audience, etc.)

### 2. Request Authentication
- Client includes token in Authorization header
- API Mesh receives request with token
- Custom resolver intercepts and validates token

### 3. Token Validation
```javascript
// Key validation steps in resolvers.js:
1. Extract token from Authorization header
2. Fetch public keys from Auth0 JWKS endpoint
3. Verify token signature using public key
4. Validate token claims:
   - audience: Must match configured API identifier
   - issuer: Must match Auth0 domain
   - exp: Must not be expired
5. Extract user identity from 'sub' claim
```

### 4. User Context Enrichment
- Extract user ID from token (`sub` claim)
- Optionally fetch full user profile from Auth0 Management API
- Store user context for use in subsequent resolvers

### 5. Authorized Data Access
- Pass authenticated user context to Commerce API
- Fetch user-specific data (orders, wishlist, addresses)
- Combine Auth0 user data with Commerce customer data

### 6. Response Assembly
- Merge data from multiple sources
- Return unified GraphQL response
- Include custom headers (e.g., X-Auth0-User-Id)

## Security Layers

### 1. Transport Security
- **TLS/HTTPS**: All communication encrypted in transit
- **Secure Headers**: CORS, CSP, HSTS headers configured

### 2. Authentication
- **JWT Token**: Cryptographically signed by Auth0
- **RS256 Algorithm**: Asymmetric encryption prevents token forgery
- **JWKS Rotation**: Public keys rotated automatically for security

### 3. Authorization
- **Audience Validation**: Ensures token is for your API
- **Scope Checking**: Validate permissions in token
- **Custom Claims**: Additional business logic validation

### 4. API Gateway Security
- **Rate Limiting**: Prevent abuse (configured in API Mesh)
- **WAF Protection**: Web Application Firewall for known attacks
- **DDoS Protection**: Distributed denial of service mitigation

## Token Claims

### Standard Claims (JWT)
```json
{
  "iss": "https://your-tenant.auth0.com/",
  "sub": "auth0|507f1f77bcf86cd799439011",
  "aud": "https://commerce.example.com/api",
  "iat": 1516239022,
  "exp": 1516325422,
  "azp": "your_client_id",
  "scope": "openid profile email"
}
```

### Custom Claims (Optional)
```json
{
  "https://example.com/roles": ["customer", "premium"],
  "https://example.com/customer_id": "CUST-12345",
  "https://example.com/tier": "gold"
}
```

## Error Handling

### Authentication Errors
| Error | HTTP Status | Description |
|-------|-------------|-------------|
| No token provided | 401 | Missing Authorization header |
| Invalid signature | 401 | Token signature verification failed |
| Token expired | 401 | Token exp claim is in the past |
| Invalid audience | 401 | Token aud doesn't match configured audience |
| Invalid issuer | 401 | Token iss doesn't match Auth0 domain |

### Authorization Errors
| Error | HTTP Status | Description |
|-------|-------------|-------------|
| Insufficient scope | 403 | Token lacks required permissions |
| Invalid role | 403 | User role not authorized for operation |

## Performance Considerations

### Caching Strategy

1. **JWKS Cache**
   - Public keys cached for 24 hours
   - Reduces latency on token validation
   - Automatic refresh on cache miss

2. **User Profile Cache** (Optional)
   ```json
   {
     "cache": {
       "http": {
         "ttl": 3600
       }
     }
   }
   ```

3. **Commerce API Cache**
   - Use API Mesh's built-in caching
   - Configure per-query TTL
   - Invalidate on mutations

### Optimization Tips

1. **Minimize Management API Calls**
   - Use token claims when possible
   - Cache user profiles client-side
   - Implement refresh token flow

2. **Batch Requests**
   - Use GraphQL query batching
   - Combine multiple data fetches
   - Reduce round trips

3. **Edge Caching**
   - Leverage Fastly CDN (API Mesh edge)
   - Cache public data aggressively
   - Use cache-control headers

## Scalability

### Horizontal Scaling
- API Mesh runs on Adobe I/O Runtime (serverless)
- Auto-scales based on demand
- No infrastructure management required

### Global Distribution
- API Mesh deployed on edge locations
- Low latency worldwide
- Regional failover support

## Monitoring & Observability

### Logging
```javascript
// Add custom logging in resolvers
console.log('User authenticated:', {
  userId: decoded.sub,
  email: decoded.email,
  timestamp: new Date().toISOString()
});
```

### Metrics to Track
- Token validation success/failure rate
- Response times per query
- Error rates by type
- Cache hit/miss ratios
- API Mesh throughput

### Debugging
```bash
# Enable debug mode in API Mesh
aio api-mesh:update --debug

# View logs
aio api-mesh:logs --tail
```

## Best Practices

### 1. Token Management
- Use short-lived access tokens (15-60 minutes)
- Implement refresh token flow for long sessions
- Store tokens securely (httpOnly cookies, secure storage)

### 2. Secret Management
- Never commit secrets to source control
- Use API Mesh secrets for sensitive values
- Rotate Management API tokens regularly

### 3. Error Handling
- Return meaningful error messages
- Don't expose sensitive information in errors
- Log errors for debugging

### 4. Testing
- Test with invalid tokens
- Test with expired tokens
- Test edge cases (missing claims, malformed tokens)
- Load test authentication flow

### 5. Compliance
- Implement proper consent management
- Follow GDPR/CCPA requirements
- Audit authentication logs
- Document data flows

## Additional Resources

- [Auth0 Token Best Practices](https://auth0.com/docs/secure/tokens/token-best-practices)
- [API Mesh Security](https://developer.adobe.com/graphql-mesh-gateway/mesh/advanced/security/)
- [GraphQL Security](https://graphql.org/learn/authorization/)

