const hidden = ["secret", "token"];

/**
 * Returns a log-ready string of the action input parameters.
 * Sensitive headers and param names are replaced by '<hidden>'.
 *
 * @param {object} params - Action input parameters.
 * @returns {string}
 */
function stringParameters(params) {
  let headers = params.__ow_headers || {};
  if (headers.authorization) {
    headers = { ...headers, authorization: "<hidden>" };
  }
  let sanitizedParams = { ...params };
  for (const key of Object.keys(sanitizedParams)) {
    if (
      !hidden.every((v) => key.toLowerCase().indexOf(v) === -1)
    ) {
      sanitizedParams = { ...sanitizedParams, [key]: "<hidden>" };
    }
  }
  return JSON.stringify({ ...sanitizedParams, __ow_headers: headers });
}

module.exports = {
  stringParameters,
};
