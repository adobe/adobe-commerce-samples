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
const { initializationTutorial } = require("../../shared/database-tutorial");
const {
  CATALOG_PAGE_SIZE,
  EXPLORER_PAGE_SIZE,
  EXPLORER_COLLECTIONS,
} = require("../../shared/catalog-config.json");

const TITLES = {
  initialize: "Initialize a repeat-safe workspace",
  status: "Read initialization state from the database",
  suppliers: "Find the suppliers in their own collection",
  schema: "Explore two collections and their indexes",
  browse: "Browse documents with a bounded find cursor",
  create: "Create a staged product with insertOne",
  get: "Find one supplier/SKU record",
  list: "Sort and project a bounded product list",
  update: "Update attributes with updateOne",
  upsert: "Update or insert by supplier and SKU",
  "save-review": "Return the saved review with returnDocument: 'after'",
  "delete-rejected": "Delete only a rejected product",
  "initial-import": "Import new products with batched insertMany",
  "sync-feed": "Mix upserts and discontinued updates with bulkWrite",
  "scan-pending": "Read a cursor with for await...of",
};

const NOTES = {
  initialize:
    "Ensure both collections and their unique indexes exist, then check persisted readiness. Seed the predefined suppliers and catalog only if initialization is incomplete. Insert-only upserts preserve existing edits, and readiness markers are saved after the seed writes succeed.",
  status:
    "Read the predefined supplier records and their initialization markers to discover whether setup is complete. This does not create or change records.",
  suppliers:
    "Read the predefined suppliers from their own collection. The projection omits internal IDs and returns only the directory fields and initialization markers.",
  schema:
    "Show each collection's application-defined document model alongside its actual database indexes. The model describes this app's fields; it is not an enforced relational schema.",
  browse: `Read matching documents in the chosen sort order and return only application-defined fields, omitting the internal _id. Skip to the requested page and read at most ${EXPLORER_PAGE_SIZE + 1} documents: display ${EXPLORER_PAGE_SIZE} and use the extra document to detect a next page. This is read-only and does not calculate a collection total.`,
  create:
    "Insert a new product for the selected supplier with pending review status and creation/update timestamps. The unique supplier/SKU index rejects an existing product rather than overwriting it.",
  get: "Find one product using both supplier ID and SKU. Return its projected details without changing the record; a missing product is reported as not found.",
  list: `Find this supplier's products, sort by most recently updated with a SKU tie-breaker, and return only SKU, name, price and review status. Read at most ${CATALOG_PAGE_SIZE} records from the requested offset.`,
  update:
    "Update the existing supplier/SKU record's name or price, reset its review status to pending and refresh updatedAt. A missing product is not inserted; createdAt is preserved.",
  upsert:
    "Update the matching supplier/SKU record or insert it if missing. Reset review status to pending and discontinued to false. Set createdAt only on insertion, preserving it for existing products.",
  "save-review":
    "Save the selected review status and return the updated product in the same call using returnDocument: 'after'. The review screen renders this saved after-image without a second detail read.",
  "delete-rejected":
    "Delete a product only when its supplier ID, SKU and rejected review status all match in the same atomic operation. Pending or approved products cannot be deleted.",
  "initial-import":
    "Validate every row, then insert new products sequentially in ordered batches of at most 50. Existing SKUs are rejected. Batches are not a transaction: a failure can leave earlier writes committed.",
  "sync-feed":
    "Validate every row, then apply sequential ordered bulkWrite batches of at most 50. Upsert rows update or create products; discontinuations only update existing records. Existing createdAt values are preserved. Batches are not a transaction: a failure can leave earlier writes committed.",
  "scan-pending":
    "Iterate lazily over this supplier's pending products instead of loading the catalog into memory. Count at most 1000 matches, retain only 20 preview SKUs, use one extra match to detect truncation, and close the cursor in finally.",
};

function explain(request, result) {
  const catalogName = JSON.stringify(EXPLORER_COLLECTIONS.catalog.name);
  const suppliersName = JSON.stringify(EXPLORER_COLLECTIONS.suppliers.name);
  const context = [
    "create",
    "get",
    "list",
    "update",
    "upsert",
    "save-review",
    "delete-rejected",
    "initial-import",
    "sync-feed",
    "scan-pending",
  ].includes(request.operation)
    ? `const catalog = client.collection(${catalogName});\nconst supplierId = ${JSON.stringify(request.supplierId)};\n${request.sku ? `const sku = ${JSON.stringify(request.sku)};\n` : ""}`
    : "";
  const snippets = {
    browse: `const documents = await client.collection(${JSON.stringify(result.collectionName)})\n  .find(${JSON.stringify(result.filter)})\n  .sort(${JSON.stringify(result.sort)})\n  .project(${JSON.stringify(result.projection)})\n  .skip(${result.offset}).limit(${EXPLORER_PAGE_SIZE + 1}).toArray();`,
    status: `await client.listCollections({ name: ${suppliersName} });\nawait suppliers.find({ supplierId: { $in: seedSupplierIds } })\n  .project({ _id: 0, supplierId: 1, name: 1, country: 1,\n    description: 1, initializedVersion: 1 }).sort({ name: 1 }).limit(${seed.suppliers.length}).toArray();`,
    suppliers: `await suppliers.find({ supplierId: { $in: seedSupplierIds } })\n  .project({ _id: 0, supplierId: 1, name: 1, country: 1,\n    description: 1, initializedVersion: 1 }).sort({ name: 1 }).limit(${seed.suppliers.length}).toArray();`,
    schema: `await client.collection(${suppliersName}).getIndexes();\nawait client.collection(${catalogName}).getIndexes();\n// Fields come from the app's documented model; indexes come from the database.`,
    create: `await catalog.insertOne({ supplierId, sku,\n  ...product, reviewStatus: "pending", discontinued: false,\n  createdAt: now, updatedAt: now });`,
    get: `await catalog.findOne({ supplierId, sku }, { projection: detailFields });`,
    list: `await catalog.find({ supplierId${request.reviewStatus ? `, reviewStatus: ${JSON.stringify(request.reviewStatus)}` : ""} })\n  .sort({ updatedAt: -1, sku: 1 })\n  .project({ _id: 0, sku: 1, name: 1, price: 1, reviewStatus: 1 })\n  .skip(${request.offset || 0}).limit(${CATALOG_PAGE_SIZE}).toArray();`,
    update: `await catalog.updateOne({ supplierId, sku }, {\n  $set: { ...product, reviewStatus: "pending", updatedAt: now }\n});`,
    upsert: `await catalog.updateOne({ supplierId, sku }, {\n  $set: { ...product, discontinued: false, reviewStatus: "pending", updatedAt: now },\n  $setOnInsert: { createdAt: now }\n}, { upsert: true });`,
    "save-review": `const savedProduct = await catalog.findOneAndUpdate(\n  { supplierId, sku },\n  { $set: { reviewStatus: ${JSON.stringify(request.reviewStatus)}, updatedAt: now } },\n  { returnDocument: "after", includeResultMetadata: false, projection: detailFields }\n);\n// The review screen renders savedProduct directly, without a second read.`,
    "delete-rejected": `await catalog.deleteOne({ supplierId, sku, reviewStatus: "rejected" });\n// The rejected-status condition is part of the same atomic delete.`,
    "initial-import": `for (let offset = 0; offset < rows.length; offset += 50) {\n  const batch = rows.slice(offset, offset + 50).map(row => ({\n    ...row, supplierId, reviewStatus: "pending", discontinued: false,\n    createdAt: now, updatedAt: now\n  }));\n  await catalog.insertMany(batch, { ordered: true });\n}\n// ${result.batchesCompleted || 0} completed batches; ${result.rowsCompleted || 0} completed rows.`,
    "sync-feed": `for (let offset = 0; offset < rows.length; offset += 50) {\n  const batch = rows.slice(offset, offset + 50);\n  await catalog.bulkWrite(batch.map(row => ({ updateOne: {\n    filter: { supplierId, sku: row.sku },\n    update: row.type === "discontinue"\n      ? { $set: { discontinued: true, reviewStatus: "pending", updatedAt: now } }\n      : { $set: { name: row.name, price: row.price, discontinued: false,\n          reviewStatus: "pending", updatedAt: now },\n          $setOnInsert: { createdAt: now } },\n    upsert: row.type === "upsert"\n  } })), { ordered: true });\n}\n// ${result.batchesCompleted || 0} completed batches; missing discontinued SKUs are not inserted.`,
    "scan-pending": `const cursor = catalog.find({ supplierId, reviewStatus: "pending" })\n  .project({ _id: 0, sku: 1 }).sort({ sku: 1 }).limit(1001).batchSize(50);\ntry {\n  for await (const product of cursor) {\n    // Count at most 1000; keep only 20 preview SKUs.\n    // One lookahead detects truncation, then break.\n  }\n} finally { await cursor.close(); }`,
  };
  let code;
  if (request.operation === "initialize") {
    const { structure, status, seedData, readiness } = initializationTutorial();
    code = [
      structure.code,
      status.code,
      ...(result.alreadyInitialized
        ? [
            "// Already initialized: no supplier/product seed writes were repeated.",
          ]
        : [seedData.code, readiness.code]),
    ].join("\n\n");
  } else {
    code =
      context +
      snippets[
        request.operation === "suppliers" ? "status" : request.operation
      ];
  }
  return {
    title: TITLES[request.operation],
    code,
    input: request,
    note: NOTES[request.operation],
  };
}

module.exports = { explain };
