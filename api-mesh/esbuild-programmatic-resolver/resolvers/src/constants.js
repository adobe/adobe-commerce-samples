// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================
/**
 * Configuration constants for the VAT rates resolver
 *
 * This file centralizes all configuration values used throughout the resolver.
 * Update these values to customize behavior without modifying core logic.
 */

/**
 * HTTP header name used to identify the customer's country/market
 * @type {string}
 * @example "AC-Policy-Market: UK" for United Kingdom
 * @example "AC-Policy-Market: DE" for Germany
 */
const policyMarketHeader = 'AC-Policy-Market';

/**
 * Mock API endpoint that returns VAT rates by country
 * @type {string}
 * Expected response format: [{ country: "UK", rate: 20 }, ...]
 * Replace with your actual VAT rates service endpoint for production
 */
const ratesEndpoint = 'https://68f9294cdeff18f212b8d32d.mockapi.io/vatrates';

/**
 * Cache TTL (Time To Live) in seconds
 * @type {number}
 * Default: 604800 seconds = 7 days
 * VAT rates don't change frequently, so long caching is appropriate
 */
const VAT_RATES_TTL = 604800;

module.exports = {
    policyMarketHeader,
    ratesEndpoint,
    VAT_RATES_TTL
};
