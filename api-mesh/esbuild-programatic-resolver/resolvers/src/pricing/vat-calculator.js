// ============================================================================
// VAT CALCULATION
// ============================================================================
// Simple VAT calculation utilities

/**
 * Get the country code for VAT lookup from the policy market header
 * @param {string} policyMarket - Value from AC-Policy-Market header (e.g., "UK", "DE", "FR")
 * @returns {string|null} - Uppercase country code or null
 */
function getVatCountryCode(policyMarket) {
    return policyMarket ? policyMarket.toUpperCase() : null;
}

/**
 * Calculate price with VAT applied, rounded to 2 decimal places
 * @param {number} baseValue - Base price value
 * @param {number} vatRate - VAT rate as decimal (e.g., 0.20 for 20%)
 * @returns {number} - Price with VAT included, rounded to 2 decimal places
 *
 * @example
 * calculatePriceWithVat(28.48, 0.19) // Returns: 33.89 (not 33.8912)
 */
function calculatePriceWithVat(baseValue, vatRate) {
    const valueWithVat = baseValue * (1 + vatRate);
    // Round to 2 decimal places to avoid floating point precision issues
    return Math.round(valueWithVat * 100) / 100;
}

module.exports = {
    getVatCountryCode,
    calculatePriceWithVat
};
