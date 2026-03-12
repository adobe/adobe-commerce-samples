const DEFAULT_LIMIT = 10;
const DEFAULT_OFFSET = 0;
const MAX_LIMIT = 100;

/**
 * Validate query parameters for GET reviews.
 *
 * @param {object} params - Action params (query: sku, limit?, offset?)
 * @returns {{ valid: boolean, error?: string, sku?: string, limit?: number, offset?: number }}
 */
function validate(params) {
  const sku = typeof params.sku === "string" ? params.sku.trim() : undefined;
  if (!sku) {
    return { valid: false, error: "Query parameter 'sku' is required." };
  }

  let limit = DEFAULT_LIMIT;
  if (params.limit !== undefined && params.limit !== null) {
    const n = Number.parseInt(String(params.limit), 10);
    if (Number.isNaN(n) || n < 1 || n > MAX_LIMIT) {
      return {
        valid: false,
        error: `'limit' must be an integer between 1 and ${MAX_LIMIT}.`,
      };
    }
    limit = n;
  }

  let offset = DEFAULT_OFFSET;
  if (params.offset !== undefined && params.offset !== null) {
    const n = Number.parseInt(String(params.offset), 10);
    if (Number.isNaN(n) || n < 0) {
      return {
        valid: false,
        error: "'offset' must be a non-negative integer.",
      };
    }
    offset = n;
  }

  return { valid: true, sku, limit, offset };
}

module.exports = {
  validate,
};
