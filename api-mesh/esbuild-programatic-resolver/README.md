# API Mesh with esbuild Programmatic Resolver - VAT Rates POC

This proof of concept demonstrates two key concepts:

1. **Using esbuild to compile programmatic resolvers for Adobe API Mesh**
2. **Fetching VAT rates from a remote endpoint, storing them in `context.state`, and appending VAT information to the `ProductViewMoney` GraphQL type**

## Overview

This project extends the `ProductViewMoney` type in Adobe Commerce's Catalog Service GraphQL schema to include VAT (Value-Added Tax) information. The VAT rates are fetched from a mock API endpoint and cached using API Mesh's state management.

## Features

- **Programmatic GraphQL Resolvers**: Extends `ProductViewMoney` with two new fields:
  - `value_with_vat`: The product price including VAT
  - `vat_rate`: The VAT rate applied (as a decimal, e.g., 0.20 for 20%)

- **Remote Data Fetching**: Retrieves VAT rates from a mock API endpoint
- **State Management**: Caches VAT rates in `context.state` with a 7-day TTL
- **Header-based Country Detection**: Uses the `AC-Policy-Market` header to determine which VAT rate to apply
- **esbuild Compilation**: Bundles all resolver code into a single file for API Mesh deployment

## Project Structure

```
esbuild-programatic-resolver/
├── README.md                          # This file
├── meshConfig.json                    # API Mesh configuration
├── sample.env                         # Environment variables template
└── resolvers/
    ├── package.json                   # Node dependencies
    ├── esbuild.config.js              # esbuild configuration
    ├── resolvers.js                   # Built output (generated)
    └── src/
        ├── index.js                   # Entry point
        ├── resolvers.js               # GraphQL resolver definitions
        ├── constants.js               # Configuration constants
        ├── utils/
        │   └── headers.js             # Header parsing utilities
        ├── data-fetchers/
        │   ├── cache.js               # Generic caching utility
        │   └── vat-rates.js           # VAT rates fetcher
        └── pricing/
            └── vat-calculator.js      # VAT calculation logic
```

## How It Works

### 1. GraphQL Schema Extension

The [meshConfig.json](meshConfig.json) extends the `ProductViewMoney` type with two new fields:

```graphql
extend type ProductViewMoney {
  value_with_vat: Float
  vat_rate: Float
}
```

### 2. Data Flow

```
GraphQL Query
    ↓
ProductViewMoney.value_with_vat resolver
    ↓
Check context.state for cached VAT rates
    ↓
If not cached → Fetch from mock API
    ↓
Cache in context.state (7 day TTL)
    ↓
Extract country from AC-Policy-Market header
    ↓
Look up VAT rate for country
    ↓
Calculate: basePrice * (1 + vatRate)
    ↓
Return value with VAT applied
```

### 3. VAT Rate Lookup

The system uses the `AC-Policy-Market` header to determine which country's VAT rate to apply:

- Header: `AC-Policy-Market: UK` → Applies UK VAT rate
- Header: `AC-Policy-Market: DE` → Applies German VAT rate
- No header or unknown country → No VAT applied (rate = 0)

### 4. Caching Strategy

VAT rates are cached in API Mesh's state management:

- **Cache Key**: `VAT_RATES`
- **TTL**: 7 days (604,800 seconds)
- **Storage**: `context.state.put()` and `context.state.get()`

This ensures VAT rates are fetched once and reused across requests for optimal performance.

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- Adobe I/O CLI with API Mesh plugin
- Access to Adobe Commerce Catalog Service GraphQL endpoint

### Installation

1. **Navigate to the resolver directory**:
   ```bash
   cd resolvers
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the resolver**:
   ```bash
   npm run build
   ```

   This compiles all source files in `src/` into a single `resolvers.js` file.

### Development Workflow

For active development with automatic rebuilds:

```bash
npm run build:watch
```

This watches for file changes and automatically rebuilds.

## Deployment to API Mesh

1. **Update mesh configuration** (if needed):
   Edit [meshConfig.json](meshConfig.json) to point to your Commerce endpoint and configure headers.

2. **Deploy to API Mesh**:
   ```bash
   aio api-mesh:create meshConfig.json
   ```

   Or update an existing mesh:
   ```bash
   aio api-mesh:update meshConfig.json
   ```

3. **Get your mesh endpoint**:
   ```bash
   aio api-mesh:get
   ```

## Testing

### Sample GraphQL Query

Query product prices with VAT information:

```graphql
query {
  products(skus: ["MJ01"]) {
    ... on SimpleProductView {
      name
      sku
      price {
        final {
          amount {
            value
            value_with_vat
            vat_rate
            currency
          }
        }
      }
    }
  }
}
```

### Cache Management

Clear the cached VAT rates to force a fresh fetch:

```graphql
# Clear all caches
mutation {
  clearCache
}
```

```graphql
# Clear specific cache key
mutation {
  clearCache(key: "VAT_RATES")
}
```

This is useful when:
- VAT rates have been updated in the source API
- Testing cache behavior during development
- Troubleshooting stale data issues

### Test with Different Countries

Add the `AC-Policy-Market` header to your requests:

**Austrian VAT (20%)**:
```bash
curl -X POST https://your-mesh-endpoint/graphql \
  -H "AC-Policy-Market: AT" \
  -H "Content-Type: application/json" \
  -d '{"query": "query { products(skus: [\"MJ01\"]) { ... } }"}'
```

**German VAT (19%)**:
```bash
curl -X POST https://your-mesh-endpoint/graphql \
  -H "AC-Policy-Market: DE" \
  -H "Content-Type: application/json" \
  -d '{"query": "query { products(skus: [\"MJ01\"]) { ... } }"}'
```

**Spanish VAT (21%)**:
```bash
curl -X POST https://your-mesh-endpoint/graphql \
  -H "AC-Policy-Market: ES" \
  -H "Content-Type: application/json" \
  -d '{"query": "query { products(skus: [\"MJ01\"]) { ... } }"}'
```

## Code Documentation

### Key Files

#### [src/resolvers.js](resolvers/src/resolvers.js)

The main resolver configuration. Exports resolvers for:

**ProductViewMoney type extensions:**
- `value_with_vat`: Calculates the price including VAT
- `vat_rate`: Returns the VAT rate as a decimal

Both field resolvers:
1. Fetch VAT rates (cached)
2. Extract country from headers
3. Look up appropriate VAT rate
4. Return calculated value

**Mutation:**
- `clearCache(key: String): Boolean`: Clears cached data from `context.state`
  - Called without arguments: clears all caches (VAT_RATES)
  - Called with `key` argument: clears specific cache key
  - Returns `true` on success, `false` on error
  - Useful for forcing fresh data fetch or debugging

#### [src/data-fetchers/vat-rates.js](resolvers/src/data-fetchers/vat-rates.js)

Fetches VAT rates from the mock API endpoint:
- **Endpoint**: `https://68f9294cdeff18f212b8d32d.mockapi.io/vatrates`
- **Format**: Array of `{ country: string, rate: number }`
- **Processing**: Converts to `{ [country]: rate/100 }` object for fast lookup

#### [src/data-fetchers/cache.js](resolvers/src/data-fetchers/cache.js)

Generic caching wrapper using `context.state`:
- Checks cache first
- Fetches fresh data on cache miss
- Stores in cache with TTL
- Returns empty object on error (graceful degradation)

#### [src/pricing/vat-calculator.js](resolvers/src/pricing/vat-calculator.js)

Simple VAT calculation utilities:
- `getVatCountryCode(policyMarket)`: Normalizes country code from header
- `calculatePriceWithVat(baseValue, vatRate)`: Applies VAT to price and rounds to 2 decimal places to avoid floating point precision issues

### esbuild Configuration

The [esbuild.config.js](resolvers/esbuild.config.js) bundles all resolver code:

```javascript
{
  entryPoints: { 'resolvers': 'src/index.js' },
  bundle: true,           // Bundle all dependencies
  platform: 'node',       // Node.js runtime
  target: 'node18',       // Target Node 18
  format: 'cjs',          // CommonJS modules
  outdir: __dirname,      // Output to resolvers/
  minify: false,          // Keep readable for debugging
  keepNames: true,        // Preserve function names for errors
  sourcemap: false        // No sourcemap needed
}
```

## Configuration

### Constants

Edit [src/constants.js](resolvers/src/constants.js) to configure:

```javascript
// Header name for country/market detection
const policyMarketHeader = 'AC-Policy-Market';

// Mock API endpoint for VAT rates
const ratesEndpoint = 'https://68f9294cdeff18f212b8d32d.mockapi.io/vatrates';

// Cache TTL in seconds (7 days)
const VAT_RATES_TTL = 604800;
```

### Mock API Format

The mock API returns an array where each element is an object with a country code as the key:

```json
[
  {"at": 0.2},
  {"be": 0.21},
  {"hr": 0.25},
  {"de": 0.19},
  {"fr": 0.2},
  {"es": 0.21}
]
```

Rates are already in decimal format (e.g., 0.2 = 20% VAT). Country codes are normalized to uppercase internally.

## Troubleshooting

### Build Errors

If the build fails:
1. Ensure Node.js 18+ is installed: `node --version`
2. Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
3. Check for syntax errors in `src/` files

### VAT Not Applied

If VAT rates aren't being applied:
1. Check the `AC-Policy-Market` header is being sent
2. Verify the mock API is returning data: `curl https://68f9294cdeff18f212b8d32d.mockapi.io/vatrates`
3. Check API Mesh logs: `aio api-mesh:logs`
4. Clear the cache by updating the cache key in [constants.js](resolvers/src/constants.js)

### Debugging

Add logging to see what's happening:

```javascript
context.logger.log('DEBUG_VAT', {
  headers: context.headers,
  vatRates,
  countryCode,
  vatRate
});
```

View logs:
```bash
aio api-mesh:logs --follow
```

## Production Considerations

### Performance

- VAT rates are cached for 7 days, reducing API calls
- esbuild creates a single optimized bundle
- Graceful error handling prevents resolver failures

### Security

- No sensitive data is cached
- Mock API endpoint can be replaced with internal service
- Header validation can be added for production

### Scalability

- State management is distributed across mesh nodes
- Cache reduces external API dependencies
- Resolver is stateless and horizontally scalable

## Learn More

- [Adobe API Mesh Documentation](https://developer.adobe.com/graphql-mesh-gateway/)
- [API Mesh Resolvers Guide](https://developer.adobe.com/graphql-mesh-gateway/gateway/custom-resolvers/)
- [esbuild Documentation](https://esbuild.github.io/)
- [Adobe Commerce Catalog Service](https://developer.adobe.com/commerce/services/graphql/)

## License

See parent repository for license information.
