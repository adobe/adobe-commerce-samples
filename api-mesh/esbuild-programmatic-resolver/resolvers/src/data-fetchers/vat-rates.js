// ============================================================================
// VAT RATES DATA FETCHER
// ============================================================================
/**
 * Fetches VAT (Value-Added Tax) rates from a remote API endpoint
 *
 * This module retrieves tax rates for different countries and caches them
 * in API Mesh's state management for optimal performance. The data is stored
 * with a 7-day TTL since VAT rates don't change frequently.
 */

const { fetchWithCache } = require('./cache');
const { VAT_RATES_TTL, ratesEndpoint } = require('../constants');

/**
 * Fetch and cache VAT rates from the configured endpoint
 *
 * The function expects the remote API to return an array of objects where
 * each object has a country code as the key and rate as the value:
 * [{"at": 0.2}, {"be": 0.21}, {"de": 0.19}, ...]
 *
 * The data is transformed into a lookup object for fast access:
 * { "AT": 0.20, "BE": 0.21, "DE": 0.19, ... }
 *
 * @param {Object} context - API Mesh resolver context
 * @param {Object} context.state - State management API (get/put)
 * @param {Object} context.logger - Logger API (log/error)
 * @returns {Promise<Object>} - Object mapping country codes to VAT rates (as decimals)
 *
 * @example
 * // Returns: { "AT": 0.20, "DE": 0.19, "FR": 0.20 }
 * const rates = await fetchVatRates(context);
 * const deRate = rates["DE"]; // 0.19 (19%)
 */
async function fetchVatRates(context) {
    /**
     * Fetch function - retrieves raw data from the VAT rates API
     * @returns {Promise<Array>} - Raw API response
     */
    const fetchFn = async () => {
        const response = await fetch(ratesEndpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`VAT rates API request failed: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    };

    /**
     * Process function - transforms raw API data into a lookup object
     * @param {Array} data - Array of objects where each key is a country code
     * @returns {Object} - Lookup object { [countryCode]: rateAsDecimal }
     */
    const processFn = (data) => {
        const vatRates = {};
        // API returns array like: [{"at": 0.2}, {"be": 0.21}, ...]
        if (Array.isArray(data)) {
            data.forEach(item => {
                // Each item is an object with a single country code key
                Object.keys(item).forEach(countryCode => {
                    const rate = item[countryCode];
                    if (typeof rate === 'number') {
                        // Rates are already in decimal format (0.2 = 20%)
                        // Normalize country code to uppercase
                        vatRates[countryCode.toUpperCase()] = rate;
                    }
                });
            });
        }
        return vatRates;
    };

    // Use the generic cache wrapper with 7-day TTL
    return fetchWithCache('VAT_RATES', VAT_RATES_TTL, fetchFn, processFn, context, 'VAT_RATES');
}

module.exports = {
    fetchVatRates
};
