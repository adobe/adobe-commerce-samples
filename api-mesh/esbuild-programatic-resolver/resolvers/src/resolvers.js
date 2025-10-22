// ============================================================================
// GRAPHQL RESOLVERS
// ============================================================================
/**
 * Main resolver configuration for API Mesh programmatic resolvers
 *
 * This module exports resolvers for:
 * - ProductViewMoney type extensions (value_with_vat, vat_rate)
 * - Mutation for cache management (clearCache)
 */

const { fetchVatRates } = require('./data-fetchers/vat-rates');
const { getHeaderValue } = require('./utils/headers');
const { getVatCountryCode, calculatePriceWithVat } = require('./pricing/vat-calculator');
const { policyMarketHeader } = require('./constants');

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the VAT rate for the current request
 * Shared logic for both value_with_vat and vat_rate resolvers
 *
 * @param {Object} context - API Mesh resolver context
 * @returns {Promise<number>} - VAT rate as decimal (e.g., 0.19 for 19%)
 */
async function getVatRateForRequest(context) {
  // Get VAT rates from cache or fetch
  const vatRates = await fetchVatRates(context);

  // Get the policy market from headers (country code)
  const policyMarket = getHeaderValue(context.headers, policyMarketHeader);
  const countryCode = getVatCountryCode(policyMarket);

  // Look up VAT rate for this country
  return countryCode && vatRates[countryCode] ? vatRates[countryCode] : 0;
}

module.exports = {
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
        resolve: async (_, args, context) => {
          const { key } = args;

          try {
            if (key) {
              // Clear specific cache key
              await context.state.delete(key);
              context.logger.log('CACHE_CLEARED', { key });
              return true;
            } else {
              // Clear the VAT_RATES cache (only cache used in this POC)
              await context.state.delete('VAT_RATES');
              context.logger.log('ALL_CACHE_CLEARED');
              return true;
            }
          } catch (error) {
            context.logger.error('CACHE_CLEAR_ERROR', { error: error.message, key });
            return false;
          }
        }
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
        selectionSet: '{ value }',
        resolve: async (root, args, context) => {
          try {
            // Get VAT rate for this request
            const vatRate = await getVatRateForRequest(context);

            // Calculate price with VAT
            const baseValue = root.value || 0;
            const valueWithVat = calculatePriceWithVat(baseValue, vatRate);

            context.logger.log('VAT_CALCULATION', {
              baseValue,
              vatRate,
              valueWithVat
            });

            return valueWithVat;
          } catch (error) {
            context.logger.error('VAT_CALCULATION_ERROR', { error: error.message });
            // Return base value if calculation fails
            return root.value || 0;
          }
        },
      },

      /**
       * Return the VAT rate for the current country/market
       *
       * Determines country from AC-Policy-Market header and returns
       * the corresponding VAT rate as a decimal (e.g., 0.19 for 19%).
       */
      vat_rate: {
        resolve: async (root, args, context) => {
          try {
            return await getVatRateForRequest(context);
          } catch (error) {
            context.logger.error('VAT_RATE_LOOKUP_ERROR', { error: error.message });
            return 0;
          }
        },
      },
    },
  },
};
