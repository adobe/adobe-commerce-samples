// ============================================================================
// HEADER UTILITIES
// ============================================================================
/**
 * Utilities for parsing and extracting values from HTTP headers
 * in API Mesh resolver context
 */

/**
 * Extract and normalize a header value from the context headers object
 *
 * This function performs case-insensitive header lookup and normalizes
 * the value to uppercase for consistent processing.
 *
 * @param {Object} headers - The context.headers object from API Mesh
 * @param {string} headerName - Name of the header to extract (case-insensitive)
 * @returns {string|null} - Uppercase header value or null if not found
 *
 * @example
 * // With headers: { "ac-policy-market": "uk", "Content-Type": "application/json" }
 * getHeaderValue(headers, "AC-Policy-Market") // Returns: "UK"
 * getHeaderValue(headers, "content-type")     // Returns: "APPLICATION/JSON"
 * getHeaderValue(headers, "X-Missing")        // Returns: null
 */
function getHeaderValue(headers, headerName) {
    const key = Object.keys(headers || {}).find(k => k.toLowerCase() === headerName.toLowerCase());
    return key ? headers[key]?.toString().toUpperCase() : null;
}

module.exports = {
    getHeaderValue
};
