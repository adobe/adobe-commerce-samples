/*
Copyright 2026 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/
const { EXPLORER_COLLECTIONS } = require("../../shared/catalog-config.json");

const COLLECTION = EXPLORER_COLLECTIONS.catalog.name;
const SUPPLIERS = EXPLORER_COLLECTIONS.suppliers.name;

async function openDatabase(params) {
  // The SDK imports dotenv; defer loading it until a real connection is requested.
  const { generateAccessToken } = require("@adobe/aio-lib-core-auth");
  const { init } = require("@adobe/aio-lib-db");
  // Runtime injects workspace S2S credentials; no browser DB credentials are needed.
  const token = await generateAccessToken({
    __ims_oauth_s2s: params.__ims_oauth_s2s,
    __ims_env: params.__ims_env,
  });
  return init({
    token: token.access_token,
    region: params.DB_REGION || "amer",
  });
}

module.exports = { COLLECTION, SUPPLIERS, openDatabase };
