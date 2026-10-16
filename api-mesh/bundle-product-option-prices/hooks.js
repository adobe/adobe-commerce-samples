/**
 * Key name for storing the IMS auth token response in shared state.
 * @type {string}
 */
const STATE_IMS_AUTH_TOKEN_KEY = "ims-service-token-response";

/**
 * IMS endpoint for authorization.
 * @type {string}
 */
const IMS_ENDPOINT = "https://ims-na1.adobelogin.com/ims/token/v3";

/**
 * Generates an IMS auth token using the provided secrets.
 * @param secrets {{ IMS_CLIENT_ID: string, IMS_CLIENT_SECRET: string, IMS_SCOPE: string }} Mesh secrets.
 * @returns {Promise<{ access_token: string, expires_in: number, type: string }>} IMS auth token response.
 */
async function generateToken(secrets) {
 const authResponse = await fetch(IMS_ENDPOINT, {
    method: "POST",
    header: {
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
 * Whether the IMS auth token is valid.
 * @param accessToken {string} Access token from IMS auth response.
 * @param expiresIn {number} Expiration time in seconds from IMS auth response.
 * @returns {boolean}
 */
function isTokenValid({ accessToken, expiresIn }) {
const now = Date.now();
const expires = now + (expiresIn * 1000);
return accessToken && now < expires;
}

module.exports = {
    accsRestAuth: async ({ context }) => {
        const { secrets } = context;
        let imsAuthTokenResponse;

        // Attempt to retrieve the IMS auth token response from shared state.
        try {
            imsAuthTokenResponse = JSON.parse(
               context.state.get(STATE_IMS_AUTH_TOKEN_KEY),
            );
        } catch (err) {
        // Failed to parse the IMS auth token response from shared state.
    }

    // Validate the IMS auth token.
    let accessToken = imsAuthTokenResponse?.access_token;
    let expiresIn = imsAuthTokenResponse?.expires_in;
    if (!isTokenValid({ accessToken, expiresIn })) {
        // Token is invalid or expired, generate a new one.
        try {
            imsAuthTokenResponse = await generateToken(secrets);
        } catch (err) {
            // Failed to generate a new token. Return hook error state.
            return {
                status: "ERROR",
                message: "Service-to-service authentication failed.",
            };
        }

        // Store the new token in shared state for future use with a ttl of 24 hours.
        context.state.put(STATE_IMS_AUTH_TOKEN_KEY, imsAuthTokenResponse, {
            ttl: 86399,
        });
        accessToken = imsAuthTokenResponse?.access_token;
        }

        // Return hook success state with the access token in headers.
        return {
            status: "SUCCESS",
            message: "Authorized",
            data: {
                headers: {
                    "x-ims-auth-token": accessToken,
                },
            },
        };
    }
};
