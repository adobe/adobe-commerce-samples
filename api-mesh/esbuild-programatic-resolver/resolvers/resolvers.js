var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// src/data-fetchers/cache.js
var require_cache = __commonJS({
  "src/data-fetchers/cache.js"(exports2, module2) {
    async function fetchWithCache(cacheKey, ttl, fetchFn, processFn, context, logPrefix) {
      try {
        const cachedData = await context.state.get(cacheKey);
        if (cachedData) {
          context.logger.log(`${logPrefix}_CACHE_HIT`);
          return JSON.parse(cachedData);
        }
        context.logger.log(`${logPrefix}_CACHE_MISS_FETCHING_API`);
        const data = await fetchFn();
        const processedData = processFn(data);
        context.logger.log(`${logPrefix}_FETCHED_SUCCESS`);
        await context.state.put(cacheKey, JSON.stringify(processedData), { ttl });
        return processedData;
      } catch (error) {
        context.logger.error(`${logPrefix}_FETCH_ERROR`, { error: error.message });
        return {};
      }
    }
    __name(fetchWithCache, "fetchWithCache");
    module2.exports = {
      fetchWithCache
    };
  }
});

// src/constants.js
var require_constants = __commonJS({
  "src/constants.js"(exports2, module2) {
    var policyMarketHeader = "AC-Policy-Market";
    var ratesEndpoint = "https://68f9294cdeff18f212b8d32d.mockapi.io/vatrates";
    var VAT_RATES_TTL = 604800;
    module2.exports = {
      policyMarketHeader,
      ratesEndpoint,
      VAT_RATES_TTL
    };
  }
});

// src/data-fetchers/vat-rates.js
var require_vat_rates = __commonJS({
  "src/data-fetchers/vat-rates.js"(exports2, module2) {
    var { fetchWithCache } = require_cache();
    var { VAT_RATES_TTL, ratesEndpoint } = require_constants();
    async function fetchVatRates(context) {
      const fetchFn = /* @__PURE__ */ __name(async () => {
        const response = await fetch(ratesEndpoint, {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          }
        });
        if (!response.ok) {
          throw new Error(`VAT rates API request failed: ${response.status} ${response.statusText}`);
        }
        return await response.json();
      }, "fetchFn");
      const processFn = /* @__PURE__ */ __name((data) => {
        const vatRates = {};
        if (Array.isArray(data)) {
          data.forEach((item) => {
            Object.keys(item).forEach((countryCode) => {
              const rate = item[countryCode];
              if (typeof rate === "number") {
                vatRates[countryCode.toUpperCase()] = rate;
              }
            });
          });
        }
        return vatRates;
      }, "processFn");
      return fetchWithCache("VAT_RATES", VAT_RATES_TTL, fetchFn, processFn, context, "VAT_RATES");
    }
    __name(fetchVatRates, "fetchVatRates");
    module2.exports = {
      fetchVatRates
    };
  }
});

// src/utils/headers.js
var require_headers = __commonJS({
  "src/utils/headers.js"(exports2, module2) {
    function getHeaderValue(headers, headerName) {
      const key = Object.keys(headers || {}).find((k) => k.toLowerCase() === headerName.toLowerCase());
      return key ? headers[key]?.toString().toUpperCase() : null;
    }
    __name(getHeaderValue, "getHeaderValue");
    module2.exports = {
      getHeaderValue
    };
  }
});

// src/pricing/vat-calculator.js
var require_vat_calculator = __commonJS({
  "src/pricing/vat-calculator.js"(exports2, module2) {
    function getVatCountryCode(policyMarket) {
      return policyMarket ? policyMarket.toUpperCase() : null;
    }
    __name(getVatCountryCode, "getVatCountryCode");
    function calculatePriceWithVat(baseValue, vatRate) {
      const valueWithVat = baseValue * (1 + vatRate);
      return Math.round(valueWithVat * 100) / 100;
    }
    __name(calculatePriceWithVat, "calculatePriceWithVat");
    module2.exports = {
      getVatCountryCode,
      calculatePriceWithVat
    };
  }
});

// src/resolvers.js
var require_resolvers = __commonJS({
  "src/resolvers.js"(exports2, module2) {
    var { fetchVatRates } = require_vat_rates();
    var { getHeaderValue } = require_headers();
    var { getVatCountryCode, calculatePriceWithVat } = require_vat_calculator();
    var { policyMarketHeader } = require_constants();
    async function getVatRateForRequest(context) {
      const vatRates = await fetchVatRates(context);
      const policyMarket = getHeaderValue(context.headers, policyMarketHeader);
      const countryCode = getVatCountryCode(policyMarket);
      return countryCode && vatRates[countryCode] ? vatRates[countryCode] : 0;
    }
    __name(getVatRateForRequest, "getVatRateForRequest");
    module2.exports = {
      resolvers: {
        // ========================================================================
        // MUTATIONS
        // ========================================================================
        Mutation: {
          /**
           * Clear cached data from context.state
           *
           * @param {Object} _ - Parent (unused)
           * @param {Object} args - Mutation arguments
           * @param {string} [args.key] - Optional specific cache key to clear (e.g., "VAT_RATES")
           * @param {Object} context - API Mesh resolver context
           * @returns {boolean} - true if successful, false otherwise
           *
           * @example
           * # Clear all caches
           * mutation { clearCache }
           *
           * @example
           * # Clear specific cache
           * mutation { clearCache(key: "VAT_RATES") }
           */
          clearCache: {
            resolve: /* @__PURE__ */ __name(async (_, args, context) => {
              const { key } = args;
              try {
                if (key) {
                  await context.state.delete(key);
                  context.logger.log("CACHE_CLEARED", { key });
                  return true;
                } else {
                  await context.state.delete("VAT_RATES");
                  context.logger.log("ALL_CACHE_CLEARED");
                  return true;
                }
              } catch (error) {
                context.logger.error("CACHE_CLEAR_ERROR", { error: error.message, key });
                return false;
              }
            }, "resolve")
          }
        },
        // ========================================================================
        // TYPE EXTENSIONS
        // ========================================================================
        ProductViewMoney: {
          /**
           * Calculate product price with VAT included
           *
           * Fetches VAT rates from cache/API, determines country from headers,
           * looks up the appropriate rate, and applies it to the base price.
           */
          value_with_vat: {
            selectionSet: "{ value }",
            resolve: /* @__PURE__ */ __name(async (root, args, context) => {
              try {
                const vatRate = await getVatRateForRequest(context);
                const baseValue = root.value || 0;
                const valueWithVat = calculatePriceWithVat(baseValue, vatRate);
                context.logger.log("VAT_CALCULATION", {
                  baseValue,
                  vatRate,
                  valueWithVat
                });
                return valueWithVat;
              } catch (error) {
                context.logger.error("VAT_CALCULATION_ERROR", { error: error.message });
                return root.value || 0;
              }
            }, "resolve")
          },
          /**
           * Return the VAT rate for the current country/market
           *
           * Determines country from AC-Policy-Market header and returns
           * the corresponding VAT rate as a decimal (e.g., 0.19 for 19%).
           */
          vat_rate: {
            resolve: /* @__PURE__ */ __name(async (root, args, context) => {
              try {
                return await getVatRateForRequest(context);
              } catch (error) {
                context.logger.error("VAT_RATE_LOOKUP_ERROR", { error: error.message });
                return 0;
              }
            }, "resolve")
          }
        }
      }
    };
  }
});

// src/index.js
var resolvers = require_resolvers();
module.exports = resolvers;
