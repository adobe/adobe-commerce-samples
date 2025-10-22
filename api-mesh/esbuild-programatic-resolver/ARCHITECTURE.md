# Architecture Overview

## High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                       Client GraphQL Query                       │
│  query { products { price { final { amount { value_with_vat }}}}}│
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API Mesh Gateway                          │
│  • Routes request to CatalogServices source                      │
│  • Adds AC-Policy-Market header to upstream request             │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Catalog Service GraphQL                      │
│  • Returns base product data with ProductViewMoney.value        │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              Programmatic Resolver (resolvers.js)               │
│  • Intercepts ProductViewMoney type                             │
│  • Adds value_with_vat and vat_rate fields                      │
└───────────────────────────┬─────────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        ▼                                       ▼
┌────────────────────────┐          ┌────────────────────────┐
│   Check Cache          │          │  Extract Country from  │
│  context.state.get()   │          │  AC-Policy-Market      │
└──────┬─────────────────┘          └───────────┬────────────┘
       │                                        │
   Hit │   Miss                                 │
       │    │                                   │
       │    ▼                                   │
       │  ┌────────────────────────┐            │
       │  │   Fetch VAT Rates      │            │
       │  │  from Mock API         │            │
       │  └──────┬─────────────────┘            │
       │         │                              │
       │         ▼                              │
       │  ┌────────────────────────┐            │
       │  │  Cache with 7-day TTL  │            │
       │  │  context.state.put()   │            │
       │  └──────┬─────────────────┘            │
       │         │                              │
       └─────────┴──────────────────────────────┘
                            │
                            ▼
               ┌────────────────────────┐
               │  Look up VAT rate for  │
               │  country (e.g., UK)    │
               └──────┬─────────────────┘
                      │
                      ▼
               ┌────────────────────────┐
               │  Calculate:            │
               │  baseValue * (1 + VAT) │
               └──────┬─────────────────┘
                      │
                      ▼
               ┌────────────────────────┐
               │  Return enhanced data: │
               │  • value_with_vat      │
               │  • vat_rate            │
               └────────────────────────┘
```

## Module Breakdown

### Core Modules

#### 1. **resolvers.js** (Main Resolver)
- **Purpose**: Defines GraphQL field resolvers for `ProductViewMoney`
- **Exports**: `{ resolvers: { ProductViewMoney: { value_with_vat, vat_rate } } }`
- **Dependencies**:
  - `data-fetchers/vat-rates` - Fetches VAT data
  - `utils/headers` - Extracts country from headers
  - `pricing/vat-calculator` - Calculates VAT values
  - `constants` - Configuration values

#### 2. **data-fetchers/vat-rates.js** (Data Layer)
- **Purpose**: Fetches VAT rates from remote API with caching
- **API Contract**:
  - Input: API Mesh context
  - Output: `{ "UK": 0.20, "DE": 0.19, ... }`
- **Dependencies**:
  - `data-fetchers/cache` - Generic cache wrapper
  - `constants` - Endpoint URL and TTL

#### 3. **data-fetchers/cache.js** (Infrastructure)
- **Purpose**: Generic caching utility for any data
- **Pattern**: Cache-aside (check cache → fetch if miss → store)
- **Storage**: API Mesh `context.state` (distributed KV store)
- **Features**:
  - Automatic serialization/deserialization
  - Configurable TTL
  - Error handling with graceful degradation

#### 4. **pricing/vat-calculator.js** (Business Logic)
- **Purpose**: VAT calculation utilities
- **Functions**:
  - `getVatCountryCode(header)` - Normalizes country code
  - `calculatePriceWithVat(base, rate)` - Applies VAT formula and rounds to 2 decimal places
- **Precision**: Uses `Math.round(value * 100) / 100` to avoid floating point errors like `33.879999999999995`

#### 5. **utils/headers.js** (Utilities)
- **Purpose**: HTTP header parsing
- **Function**: `getHeaderValue(headers, name)` - Case-insensitive lookup

#### 6. **constants.js** (Configuration)
- **Purpose**: Centralized configuration
- **Values**:
  - `policyMarketHeader` - "AC-Policy-Market"
  - `ratesEndpoint` - Mock API URL
  - `VAT_RATES_TTL` - Cache duration (7 days)

### Build System

#### esbuild.config.js
- **Input**: `src/index.js` (entry point)
- **Output**: `resolvers.js` (bundled)
- **Features**:
  - Bundles all dependencies into single file
  - CommonJS format for Node.js compatibility
  - Preserves function names for debugging
  - No minification (readable output)
  - Watch mode for development

## Data Structures

### VAT Rates Cache Format

**Raw API Response**:
```json
[
  {"at": 0.2},
  {"de": 0.19},
  {"fr": 0.2},
  {"es": 0.21}
]
```

**Processed Cache Format**:
```javascript
{
  "AT": 0.20,    // 20% VAT (Austria)
  "DE": 0.19,    // 19% VAT (Germany)
  "FR": 0.20,    // 20% VAT (France)
  "ES": 0.21     // 21% VAT (Spain)
}
```

### Context Object (API Mesh)
```javascript
{
  headers: {
    "ac-policy-market": "UK",
    "content-type": "application/json",
    // ... other headers
  },
  state: {
    get: async (key) => string | null,
    put: async (key, value, { ttl }) => void
  },
  logger: {
    log: (message, data) => void,
    error: (message, data) => void
  },
  secrets: {
    // Environment variables (not used in this POC)
  }
}
```

### GraphQL Schema Extensions

**Type Extensions:**
```graphql
extend type ProductViewMoney {
  value_with_vat: Float
  vat_rate: Float
}
```

**Mutations:**
```graphql
type Mutation {
  clearCache(key: String): Boolean
}
```

## Request Lifecycle

### Example Request

**Query**:
```graphql
query {
  products(skus: ["MJ01"]) {
    price {
      final {
        amount {
          value          # Original: 49.99
          value_with_vat # Enhanced: 59.99 (with UK VAT)
          vat_rate       # Enhanced: 0.20 (20%)
          currency
        }
      }
    }
  }
}
```

**Headers**:
```
AC-Policy-Market: DE
Content-Type: application/json
```

**Processing Steps**:

1. **API Mesh receives request**
   - Validates query
   - Routes to CatalogServices source

2. **CatalogServices returns base data**
   ```json
   {
     "price": {
       "final": {
         "amount": {
           "value": 49.99,
           "currency": "USD"
         }
       }
     }
   }
   ```

3. **Resolver intercepts ProductViewMoney.value_with_vat**
   - Fetches VAT rates (from cache or API)
   - Extracts "DE" from AC-Policy-Market header
   - Looks up VAT rate: 0.19 (19% German VAT)
   - Calculates: 49.99 * (1 + 0.19) = 59.4881
   - Rounds to 2 decimal places: 59.49
   - Returns: 59.49

4. **Resolver intercepts ProductViewMoney.vat_rate**
   - Returns: 0.19

5. **API Mesh returns enhanced response**
   ```json
   {
     "price": {
       "final": {
         "amount": {
           "value": 49.99,
           "value_with_vat": 59.49,
           "vat_rate": 0.19,
           "currency": "USD"
         }
       }
     }
   }
   ```

## Caching Strategy

### Why Cache VAT Rates?

1. **Performance**: VAT rates don't change frequently
2. **Reliability**: Reduces dependency on external API
3. **Cost**: Minimizes API calls to external service
4. **Latency**: Cache hits are 10-100x faster than API calls

### Cache Behavior

| Scenario | Action | Performance |
|----------|--------|-------------|
| First request | Fetch from API → Cache for 7 days | ~200-500ms |
| Subsequent requests | Return from cache | ~1-10ms |
| Cache expired | Fetch from API → Update cache | ~200-500ms |
| API unavailable | Return empty object (graceful fail) | ~1ms |

### Cache Invalidation

**Option 1: Use the clearCache mutation (Recommended)**

Clear the cache via GraphQL mutation:

```graphql
# Clear all caches
mutation {
  clearCache
}
```

```graphql
# Clear specific cache
mutation {
  clearCache(key: "VAT_RATES")
}
```

This is the preferred method as it requires no code changes or redeployment.

**Option 2: Change the cache key in code**

To force a cache refresh with code changes:
1. Change the cache key in [constants.js](resolvers/src/constants.js):
   ```javascript
   // Before
   return fetchWithCache('VAT_RATES', ...)

   // After
   return fetchWithCache('VAT_RATES_V2', ...)
   ```
2. Rebuild and redeploy

This is useful when you want to permanently reset the cache as part of a deployment.

## Error Handling

### Graceful Degradation

All errors are handled gracefully to prevent query failures:

```javascript
// If VAT rates fetch fails
return {} // Empty rates object

// If country lookup fails
vatRate = 0 // No VAT applied

// If calculation fails
return root.value || 0 // Return base value
```

### Logging

All operations are logged for debugging:

```javascript
context.logger.log('VAT_CALCULATION', {
  country: 'UK',
  baseValue: 49.99,
  vatRate: 0.20,
  valueWithVat: 59.99
});
```

View logs:
```bash
aio api-mesh:logs --follow
```

## Performance Characteristics

### Latency Impact

| Operation | Latency |
|-----------|---------|
| Cache hit (typical) | +1-10ms |
| Cache miss (first request) | +200-500ms |
| Calculation overhead | <1ms |

### Optimization Techniques

1. **Long TTL**: 7-day cache reduces API calls to ~1 per week
2. **Distributed cache**: `context.state` is shared across all mesh nodes
3. **Efficient lookup**: Object key access is O(1)
4. **Minimal processing**: Simple multiplication, no complex logic

## Security Considerations

### Current Implementation (POC)

- No sensitive data cached
- Public mock API endpoint
- No authentication required
- Header values are trusted

### Production Recommendations

1. **Validate headers**: Check AC-Policy-Market against allowed values
2. **Secure endpoint**: Use internal service with authentication
3. **Rate limiting**: Implement on external API calls
4. **Input sanitization**: Validate country codes
5. **Audit logging**: Log all VAT calculations for compliance

## Extensibility

### Adding New Fields

To add another field to ProductViewMoney:

1. Update [meshConfig.json](meshConfig.json):
   ```json
   "additionalTypeDefs": [
     "extend type ProductViewMoney { value_with_vat: Float, vat_rate: Float, new_field: String }"
   ]
   ```

2. Add resolver in [resolvers.js](resolvers/src/resolvers.js):
   ```javascript
   ProductViewMoney: {
     new_field: {
       resolve: (root, args, context) => {
         return "calculated value";
       }
     }
   }
   ```

### Adding New Data Sources

Follow the same pattern as VAT rates:

1. Create fetcher in `data-fetchers/my-data.js`
2. Use `fetchWithCache` for caching
3. Import in resolvers
4. Use in field resolvers

## Deployment Checklist

- [ ] Update `ratesEndpoint` in constants.js to production API
- [ ] Test with production data
- [ ] Review cache TTL (7 days appropriate?)
- [ ] Run `npm run build`
- [ ] Verify resolvers.js was generated
- [ ] Update meshConfig.json with production endpoints
- [ ] Deploy: `aio api-mesh:update meshConfig.json`
- [ ] Test all country codes
- [ ] Monitor logs: `aio api-mesh:logs --follow`
- [ ] Verify caching behavior
- [ ] Test error scenarios (API down, invalid headers)

## Troubleshooting

### Resolver not working
- Check API Mesh logs: `aio api-mesh:logs`
- Verify resolvers.js exists and is referenced in meshConfig.json
- Ensure additionalTypeDefs and additionalResolvers are correct

### VAT not applied
- Check AC-Policy-Market header is being sent
- Verify country code exists in mock API response
- Check cache: change cache key to force refresh

### Build fails
- Run `npm install` to ensure dependencies are installed
- Check for syntax errors in src/ files
- Verify esbuild version: `npm list esbuild`

### Performance issues
- Check cache hit rate in logs (look for CACHE_HIT vs CACHE_MISS)
- Verify TTL is appropriate for your use case
- Consider reducing resolver complexity
