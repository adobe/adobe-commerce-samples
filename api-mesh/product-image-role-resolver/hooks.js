const STATE_IMS_AUTH_TOKEN_KEY = "ims-service-token-response";
const IMS_ENDPOINT = "https://ims-na1.adobelogin.com/ims/token/v3";

// Context state TTL must be between 60s and 604800s.
const MIN_STATE_TTL_SECONDS = 60;
const MAX_STATE_TTL_SECONDS = 604800;

// Expire the cached token this many seconds before IMS does.
const TOKEN_EXPIRY_SAFETY_SECONDS = 300;

/**
 * Generates an IMS service-to-service token.
 * @param {{ IMS_CLIENT_ID: string, IMS_CLIENT_SECRET: string, IMS_SCOPE: string }} secrets Mesh secrets.
 * @returns {Promise<{ access_token: string, expires_in: number }>}
 */
async function generateToken(secrets) {
  const authResponse = await fetch(IMS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: secrets.IMS_CLIENT_ID,
      client_secret: secrets.IMS_CLIENT_SECRET,
      scope: secrets.IMS_SCOPE,
    }),
  });
  if (!authResponse.ok) {
    throw new Error(
      "IMS auth token generation failed: " + authResponse.statusText,
    );
  }
  return authResponse.json();
}

/**
 * Reads a still-valid token from shared state.
 * @param {object} context Hook context.
 * @returns {Promise<string|null>}
 */
async function readCachedToken(context) {
  try {
    const raw = await context.state.get(STATE_IMS_AUTH_TOKEN_KEY);
    if (!raw) {
      return null;
    }
    const { accessToken, expiresAt } = JSON.parse(raw);
    return accessToken && Date.now() < expiresAt ? accessToken : null;
  } catch (err) {
    return null;
  }
}

/**
 * Caches the token for slightly less than the lifetime IMS reports, so the
 * cache entry can never outlive the token.
 * @param {object} context Hook context.
 * @param {{ access_token: string, expires_in: number }} tokenResponse IMS response.
 */
async function cacheToken(context, tokenResponse) {
  const lifetimeSeconds = Number(tokenResponse.expires_in) - TOKEN_EXPIRY_SAFETY_SECONDS;
  if (!Number.isFinite(lifetimeSeconds) || lifetimeSeconds < MIN_STATE_TTL_SECONDS) {
    return;
  }
  const ttl = Math.min(lifetimeSeconds, MAX_STATE_TTL_SECONDS);
  try {
    await context.state.put(
      STATE_IMS_AUTH_TOKEN_KEY,
      JSON.stringify({
        accessToken: tokenResponse.access_token,
        expiresAt: Date.now() + ttl * 1000,
      }),
      { ttl },
    );
  } catch (err) {
    // Caching is best-effort; the token is still usable for this request.
  }
}

module.exports = {
  accsRestAuth: async ({ context }) => {
    let accessToken = await readCachedToken(context);

    if (!accessToken) {
      try {
        const tokenResponse = await generateToken(context.secrets);
        accessToken = tokenResponse.access_token;
        await cacheToken(context, tokenResponse);
      } catch (err) {
        // This hook runs before every operation. Do not fail unrelated
        // operations (cart, checkout, ...); the image-roles resolver falls
        // back to the unmodified Catalog Service images without a token.
        return {
          status: "SUCCESS",
          message: "Service-to-service token unavailable.",
        };
      }
    }

    return {
      status: "SUCCESS",
      message: "Authorized",
      data: {
        headers: {
          "x-ims-auth-token": accessToken,
        },
      },
    };
  },
};
