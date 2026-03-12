const MIN_RATING = 1;
const MAX_RATING = 5;

/**
 * Parse POST body from params (merged body or params.body string).
 *
 * @param {object} params - Action params (may contain body fields or params.body)
 * @returns {object} - Normalized body { sku?, rating?, review?, user? }
 */
function getBody(params) {
  if (params.body && typeof params.body === "string") {
    try {
      return JSON.parse(params.body);
    } catch {
      return {};
    }
  }
  return {
    sku: params.sku,
    rating: params.rating,
    review: params.review,
    user: params.user,
  };
}

/**
 * Validate POST body for submitting a review.
 *
 * @param {object} params - Action params (body or parsed body fields)
 * @returns {{ valid: boolean, error?: string, body?: object }}
 */
function validate(params) {
  const body = getBody(params);
  const sku = typeof body.sku === "string" ? body.sku.trim() : undefined;
  if (!sku) {
    return { valid: false, error: "Body parameter 'sku' is required." };
  }

  if (body.rating === undefined || body.rating === null) {
    return { valid: false, error: "Body parameter 'rating' is required." };
  }
  const rating = Number.parseInt(String(body.rating), 10);
  if (Number.isNaN(rating) || rating < MIN_RATING || rating > MAX_RATING) {
    return {
      valid: false,
      error: `'rating' must be an integer between ${MIN_RATING} and ${MAX_RATING}.`,
    };
  }

  const review =
    body.review !== undefined && body.review !== null
      ? String(body.review).trim()
      : undefined;
  const user =
    body.user !== undefined && body.user !== null
      ? String(body.user).trim()
      : undefined;

  return {
    valid: true,
    body: { sku, rating, review, user },
  };
}

module.exports = {
  validate,
  getBody,
};
