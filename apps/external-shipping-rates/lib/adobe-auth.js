/*
Copyright 2024 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import aioIms from "@adobe/aio-lib-ims";

import { allNonEmpty } from "./params.js";

const { context, getToken } = aioIms;

/**
 * Generate access token to connect with Adobe services based on the given parameters.
 * Note these credentials are now retrieved from the action parameters but in a real-world scenario they should be treated
 * as secrets and stored in a dedicated secret manager.
 *
 * @param {object} params action input parameters.
 * @returns {Promise<string>} returns the access token
 * @see https://developer.adobe.com/runtime/docs/guides/using/security_general/#secrets
 */
export async function getAdobeAccessToken(params) {
  const config = {
    client_id: params.OAUTH_CLIENT_ID,
    client_secrets: JSON.parse(params.OAUTH_CLIENT_SECRETS),
    technical_account_id: params.OAUTH_TECHNICAL_ACCOUNT_ID,
    technical_account_email: params.OAUTH_TECHNICAL_ACCOUNT_EMAIL,
    ims_org_id: params.OAUTH_IMS_ORG_ID,
    scopes: JSON.parse(params.OAUTH_SCOPES),
    env: params.AIO_CLI_ENV ?? "prod",
  };
  await context.set("commerce-starter-kit-creds", config);
  return getToken("commerce-starter-kit-creds", {});
}

/**
 * Generates the credentials for the Adobe services based on the given parameters.
 * Note these credentials are now retrieved from the action parameters but in a real-world scenario they should be treated
 * as secrets and stored in a dedicated secret manager.
 *
 * @param {object} params action input parameters.
 * @returns {Promise<{apiKey: string, imsOrgId: string, accessToken: string}>} the generated credentials
 */
export async function resolveCredentials(params) {
  return {
    accessToken: await getAdobeAccessToken(params),
    imsOrgId: params.OAUTH_IMS_ORG_ID,
    apiKey: params.OAUTH_CLIENT_ID,
  };
}

/**
 * Resolve the authentication options based on the provided parameters.
 * Note that Commerce integration options is preferred over IMS authentication options.
 * @param {object} params action input parameters.
 * @returns {Promise<{imsOptions: object}|{integrationOptions: object}>} returns the resolved authentication options
 * @throws {Error} if neither Commerce integration options nor IMS options are provided as params
 */
export async function resolveAuthOptions(params) {
  if (
    allNonEmpty(params, [
      "COMMERCE_CONSUMER_KEY",
      "COMMERCE_CONSUMER_SECRET",
      "COMMERCE_ACCESS_TOKEN",
      "COMMERCE_ACCESS_TOKEN_SECRET",
    ])
  ) {
    return {
      integrationOptions: {
        consumerKey: params.COMMERCE_CONSUMER_KEY,
        consumerSecret: params.COMMERCE_CONSUMER_SECRET,
        accessToken: params.COMMERCE_ACCESS_TOKEN,
        accessTokenSecret: params.COMMERCE_ACCESS_TOKEN_SECRET,
      },
    };
  }

  if (
    allNonEmpty(params, [
      "OAUTH_CLIENT_ID",
      "OAUTH_CLIENT_SECRETS",
      "OAUTH_TECHNICAL_ACCOUNT_ID",
      "OAUTH_TECHNICAL_ACCOUNT_EMAIL",
      "OAUTH_IMS_ORG_ID",
      "OAUTH_SCOPES",
    ])
  ) {
    return { imsOptions: await resolveCredentials(params) };
  }

  throw new Error(
    "Can't resolve authentication options for the given params. " +
      "Please provide either IMS options (OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRETS, OAUTH_TECHNICAL_ACCOUNT_ID, OAUTH_TECHNICAL_ACCOUNT_EMAIL, OAUTH_IMS_ORG_ID, OAUTH_SCOPES) " +
      "or Commerce integration options (COMMERCE_CONSUMER_KEY, COMMERCE_CONSUMER_SECRET, COMMERCE_ACCESS_TOKEN, COMMERCE_ACCESS_TOKEN_SECRET). " +
      "See https://developer.adobe.com/commerce/extensibility/starter-kit/checkout/connect/#authentication for additional details.",
  );
}
