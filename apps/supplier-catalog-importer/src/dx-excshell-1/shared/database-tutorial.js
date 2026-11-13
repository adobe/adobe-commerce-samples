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
const seed = require("../../../examples/seed-data.json");
const { EXPLORER_COLLECTIONS } = require("./catalog-config.json");

const CLIENT_SETUP = {
  title: "Create the server-side ABDB client",
  note: "The Runtime action uses its injected OAuth server-to-server parameters to obtain a database access token. init selects the configured database region, and connect opens the workspace database client. The credentials and resulting token stay on the server; the browser's Shell token authenticates the web action, not the database connection.",
  code: `const { generateAccessToken } = require("@adobe/aio-lib-core-auth");
const { init } = require("@adobe/aio-lib-db");

const token = await generateAccessToken({
  __ims_oauth_s2s: params.__ims_oauth_s2s,
  __ims_env: params.__ims_env,
});
const database = await init({
  token: token.access_token,
  region: params.DB_REGION || "amer",
});
const client = await database.connect();`,
};

const CLIENT_CLEANUP = {
  title: "Close the client after the request",
  note: "The action calls close in finally whenever a client was connected, including when an operation fails. Cleanup errors produce a safe warning without replacing the operation result. Closing the client does not delete the database or its records. Each UI follow-up read is a separate Runtime request with its own client.",
  code: "await client.close();",
};

function initializationTutorial() {
  const suppliersName = JSON.stringify(EXPLORER_COLLECTIONS.suppliers.name);
  const catalogName = JSON.stringify(EXPLORER_COLLECTIONS.catalog.name);
  return {
    clientSetup: CLIENT_SETUP,
    structure: {
      title: "Ensure two collections and their unique indexes",
      note: "The deploy hook and Initialize app use the same structure helper. Create each collection only if it is missing, verify concurrent collection creation before ignoring an error, and ensure the unique supplier ID and compound supplier/SKU indexes. This does not provision a database or drop any records or indexes.",
      code: `const definitions = [
  {
    name: ${suppliersName},
    key: { supplierId: 1 },
    index: { unique: true, name: "supplier_id_unique" },
  },
  {
    name: ${catalogName},
    key: { supplierId: 1, sku: 1 },
    index: { unique: true, name: "supplier_sku_unique" },
  },
];
for (const definition of definitions) {
  const filter = { name: definition.name };
  const exists = entries =>
    entries.some(entry => entry.name === definition.name);
  if (!exists(await client.listCollections(filter))) {
    try {
      await client.createCollection(definition.name);
    } catch (error) {
      if (!exists(await client.listCollections(filter))) throw error;
    }
  }
  await client.collection(definition.name)
    .createIndex(definition.key, definition.index);
}`,
    },
    status: {
      title: "Check saved initialization status",
      note: "Read the expected suppliers and check their initializedVersion against the seed version. If setup is already complete, initialization returns the existing suppliers without repeating seed writes. Returning browser sessions use this same read-only status check before offering Initialize app. The seed import path below is relative to actions/lib/workbench.js.",
      code: `const seed = require("../../../../examples/seed-data.json");
async function status(client) {
  const collections = await client.listCollections({ name: ${suppliersName} });
  if (!collections.some(entry => entry.name === ${suppliersName})) {
    return { initialized: false, suppliers: [] };
  }
  const suppliers = await client.collection(${suppliersName})
    .find({ supplierId: { $in: seed.suppliers.map(supplier => supplier.supplierId) } })
    .project({ _id: 0, supplierId: 1, name: 1, country: 1,
      description: 1, initializedVersion: 1 })
    .sort({ name: 1 }).limit(${seed.suppliers.length}).toArray();
  return {
    initialized: suppliers.length === seed.suppliers.length &&
      suppliers.every(supplier => supplier.initializedVersion === seed.version),
    suppliers,
  };
}
const previous = await status(client);
if (previous.initialized) {
  return { ...previous, alreadyInitialized: true };
}`,
    },
    seedData: {
      title: "Seed missing suppliers and products",
      note: `The repository seed defines ${seed.suppliers.length} suppliers and ${seed.catalog.length} products, not a live database count. Supplier updateOne calls and an ordered catalog bulkWrite use upsert with $setOnInsert, so existing records and edits are preserved. Once setup is marked complete, later initialization calls skip these writes and do not restore deliberately deleted products. Seed writes are not a transaction; an incomplete first attempt can leave records for a retry to finish.`,
      code: `const now = new Date().toISOString();
const suppliers = client.collection(${suppliersName});
const catalog = client.collection(${catalogName});
for (const supplier of seed.suppliers) {
  await suppliers.updateOne(
    { supplierId: supplier.supplierId },
    { $setOnInsert: { ...supplier, createdAt: now } },
    { upsert: true },
  );
}
await catalog.bulkWrite(seed.catalog.map(product => ({
  updateOne: {
    filter: { supplierId: product.supplierId, sku: product.sku },
    update: { $setOnInsert: {
      ...product, discontinued: false, createdAt: now, updatedAt: now,
    } },
    upsert: true,
  },
})), { ordered: true });`,
    },
    readiness: {
      title: "Save readiness only after seed writes succeed",
      note: "Mark each supplier with the seed version only after the supplier and catalog writes succeed, then read status again. Readiness is stored in this workspace database, not in browser storage. The UI then makes a separate catalog-list request to display products.",
      code: `for (const supplier of seed.suppliers) {
  await suppliers.updateOne(
    { supplierId: supplier.supplierId },
    { $set: { initializedVersion: seed.version } },
  );
}
return {
  ...(await status(client)),
  seededProducts: seed.catalog.length,
  alreadyInitialized: false,
};`,
    },
    clientCleanup: CLIENT_CLEANUP,
  };
}

module.exports = { CLIENT_SETUP, CLIENT_CLEANUP, initializationTutorial };
