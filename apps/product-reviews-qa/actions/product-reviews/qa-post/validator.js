const VALID_TYPES = new Set(["question", "answer"]);

/**
 * Parse POST body from params (merged body or params.body string).
 *
 * @param {object} params - Action params
 * @returns {object} - Normalized body { sku?, type?, questionId?, content?, user? }
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
    type: params.type,
    questionId: params.questionId,
    content: params.content,
    user: params.user,
  };
}

function validateSku(body) {
  const sku = typeof body.sku === "string" ? body.sku.trim() : undefined;
  if (!sku) {
    return { valid: false, error: "Body parameter 'sku' is required." };
  }
  return { valid: true, sku };
}

function validateType(body) {
  if (body.type === undefined || body.type === null) {
    return { valid: false, error: "Body parameter 'type' is required." };
  }
  const type =
    typeof body.type === "string" ? body.type.trim().toLowerCase() : "";
  if (!VALID_TYPES.has(type)) {
    return {
      valid: false,
      error: "'type' must be 'question' or 'answer'.",
    };
  }
  return { valid: true, type };
}

function validateContent(body) {
  if (body.content === undefined || body.content === null) {
    return { valid: false, error: "Body parameter 'content' is required." };
  }
  const content = String(body.content).trim();
  if (!content) {
    return { valid: false, error: "'content' cannot be empty." };
  }
  return { valid: true, content };
}

function normalizeUser(body) {
  return body.user !== undefined && body.user !== null
    ? String(body.user).trim()
    : undefined;
}

/**
 * Validate POST body for submitting a question or answer.
 * Does not check existence of questionId (done in index after loading state).
 *
 * @param {object} params - Action params (body or parsed body fields)
 * @returns {{ valid: boolean, error?: string, body?: object }}
 */
function validate(params) {
  const body = getBody(params);

  const skuResult = validateSku(body);
  if (!skuResult.valid) {
    return skuResult;
  }

  const typeResult = validateType(body);
  if (!typeResult.valid) {
    return typeResult;
  }

  const contentResult = validateContent(body);
  if (!contentResult.valid) {
    return contentResult;
  }

  const { sku } = skuResult;
  const { type } = typeResult;
  const { content } = contentResult;
  const user = normalizeUser(body);

  if (type === "answer") {
    const questionId =
      typeof body.questionId === "string" ? body.questionId.trim() : undefined;
    if (!questionId) {
      return {
        valid: false,
        error: "Body parameter 'questionId' is required when type is 'answer'.",
      };
    }
    return {
      valid: true,
      body: { sku, type, questionId, content, user },
    };
  }

  return {
    valid: true,
    body: { sku, type, content, user },
  };
}

module.exports = {
  validate,
  getBody,
};
