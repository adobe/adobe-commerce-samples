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
const seed = require("../../../../examples/seed-data.json");
const { execute } = require("./catalog");
const { COLLECTION, SUPPLIERS } = require("./database");
const { MODEL, ensureStructure } = require("./structure");
const { explain } = require("./lessons");
const { browse } = require("./explorer");

async function status(client) {
  const collections = await client.listCollections({ name: SUPPLIERS });
  if (!collections.some((entry) => entry.name === SUPPLIERS)) {
    return { initialized: false, suppliers: [] };
  }
  const suppliers = await client
    .collection(SUPPLIERS)
    .find({
      supplierId: {
        $in: seed.suppliers.map((supplier) => supplier.supplierId),
      },
    })
    .project({
      _id: 0,
      supplierId: 1,
      name: 1,
      country: 1,
      description: 1,
      initializedVersion: 1,
    })
    .sort({ name: 1 })
    .limit(seed.suppliers.length)
    .toArray();
  return {
    initialized:
      suppliers.length === seed.suppliers.length &&
      suppliers.every(
        (supplier) => supplier.initializedVersion === seed.version,
      ),
    suppliers,
  };
}

async function initialize(client) {
  await ensureStructure(client);
  const previous = await status(client);
  if (previous.initialized) {
    return { ...previous, alreadyInitialized: true };
  }
  const now = new Date().toISOString();
  for (const supplier of seed.suppliers) {
    await client
      .collection(SUPPLIERS)
      .updateOne(
        { supplierId: supplier.supplierId },
        { $setOnInsert: { ...supplier, createdAt: now } },
        { upsert: true },
      );
  }
  // Insert-only upserts make retries safe without overwriting a learner's edits.
  await client.collection(COLLECTION).bulkWrite(
    seed.catalog.map((product) => ({
      updateOne: {
        filter: { supplierId: product.supplierId, sku: product.sku },
        update: {
          $setOnInsert: {
            ...product,
            discontinued: false,
            createdAt: now,
            updatedAt: now,
          },
        },
        upsert: true,
      },
    })),
    { ordered: true },
  );
  for (const supplier of seed.suppliers) {
    await client
      .collection(SUPPLIERS)
      .updateOne(
        { supplierId: supplier.supplierId },
        { $set: { initializedVersion: seed.version } },
      );
  }
  return {
    ...(await status(client)),
    seededProducts: seed.catalog.length,
    alreadyInitialized: false,
  };
}

async function run(client, request) {
  let result;
  switch (request.operation) {
    case "browse":
      result = await browse(client, request);
      break;
    case "status":
    case "suppliers":
      result = await status(client);
      break;
    case "initialize":
      result = await initialize(client);
      break;
    case "schema":
      result = {
        relationship:
          "suppliers.supplierId -> catalog.supplierId (one-to-many; no automatic foreign-key constraint)",
        note: "This is the application's document model, not an enforced relational schema. Each workspace database can contain multiple collections.",
        collections: await Promise.all(
          MODEL.map(async (definition) => ({
            name: definition.name,
            purpose: definition.purpose,
            fields: definition.fields,
            indexes: await client.collection(definition.name).getIndexes(),
          })),
        ),
      };
      break;
    default:
      result = await execute(client.collection(COLLECTION), request);
  }
  return {
    operation: request.operation,
    result,
    lesson: explain(request, result),
  };
}

module.exports = { run, initialize, status };
