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
const {
  ensureStructure,
} = require("../src/dx-excshell-1/actions/lib/structure");

async function configuredDatabase() {
  const config = {
    AIO_RUNTIME_NAMESPACE:
      process.env.AIO_RUNTIME_NAMESPACE || process.env.AIO_runtime_namespace,
    DB_CLIENT_ID:
      process.env.DB_CLIENT_ID || process.env.IMS_OAUTH_S2S_CLIENT_ID,
    DB_CLIENT_SECRET:
      process.env.DB_CLIENT_SECRET || process.env.IMS_OAUTH_S2S_CLIENT_SECRET,
    DB_ORG_ID: process.env.DB_ORG_ID || process.env.IMS_OAUTH_S2S_ORG_ID,
    DB_SCOPES: process.env.DB_SCOPES || process.env.IMS_OAUTH_S2S_SCOPES,
  };
  for (const [key, value] of Object.entries(config)) {
    if (!value?.trim()) {
      throw new Error(
        `Set ${key} in .env for the selected development workspace.`,
      );
    }
  }
  const scopes = config.DB_SCOPES.trim().startsWith("[")
    ? JSON.parse(config.DB_SCOPES)
    : config.DB_SCOPES.split(",");
  if (
    !Array.isArray(scopes) ||
    scopes.some((scope) => typeof scope !== "string")
  ) {
    throw new Error(
      "DB_SCOPES must be comma-separated scopes or a JSON string array.",
    );
  }
  // The SDK imports dotenv; reusable helpers must stay free of configuration side effects.
  const { generateAccessToken } = require("@adobe/aio-lib-core-auth");
  const { init } = require("@adobe/aio-lib-db");
  const token = await generateAccessToken({
    clientId: config.DB_CLIENT_ID,
    clientSecret: config.DB_CLIENT_SECRET,
    orgId: config.DB_ORG_ID,
    scopes: scopes.map((scope) => scope.trim()).filter(Boolean),
  });
  return init({
    token: token.access_token,
    region: process.env.DB_REGION || "amer",
    ow: { namespace: config.AIO_RUNTIME_NAMESPACE },
  });
}

async function setupDatabase(db) {
  const status = await db.provisionStatus();
  if (status?.status?.toUpperCase() !== "PROVISIONED") {
    throw new Error(
      "Database is not provisioned. Run aio app db provision, then aio app db status before retrying.",
    );
  }
  const client = await db.connect();
  try {
    await ensureStructure(client);
  } finally {
    await client.close();
  }
}

if (require.main === module) {
  require("dotenv").config({ quiet: true });
  configuredDatabase()
    .then(setupDatabase)
    .then(() =>
      console.log(
        "Supplier and catalog collections and unique indexes are ready. Initialize sample data from the UI.",
      ),
    )
    .catch(() => {
      console.error(
        "Database setup failed. Check .env workspace credentials, provisioning status and existing index/data conflicts. No data was deleted.",
      );
      process.exitCode = 1;
    });
}

module.exports = { configuredDatabase, setupDatabase };
