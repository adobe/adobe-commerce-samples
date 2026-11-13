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
const { COLLECTION, SUPPLIERS } = require("./database");

const MODEL = [
  {
    name: SUPPLIERS,
    purpose: "One document per supplier. supplierId links its catalog records.",
    fields: {
      supplierId: "string (unique)",
      name: "string",
      country: "string",
      description: "string",
      createdAt: "ISO timestamp",
      initializedVersion: "number (set only after seed data is saved)",
    },
    key: { supplierId: 1 },
    index: { unique: true, name: "supplier_id_unique" },
  },
  {
    name: COLLECTION,
    purpose: "Staged products from all suppliers, scoped by supplierId.",
    fields: {
      supplierId: "string (application-level reference to suppliers)",
      sku: "string (unique within a supplier)",
      name: "string",
      price: "number",
      reviewStatus: "pending | approved | rejected",
      discontinued: "boolean",
      createdAt: "ISO timestamp",
      updatedAt: "ISO timestamp",
    },
    key: { supplierId: 1, sku: 1 },
    index: { unique: true, name: "supplier_sku_unique" },
  },
];

async function ensureStructure(client) {
  for (const definition of MODEL) {
    const filter = { name: definition.name };
    const exists = (entries) =>
      entries.some((entry) => entry.name === definition.name);
    if (!exists(await client.listCollections(filter))) {
      try {
        await client.createCollection(definition.name);
      } catch (error) {
        // Only a verified concurrent collection creation is safe to ignore.
        if (!exists(await client.listCollections(filter))) {
          throw error;
        }
      }
    }
    await client
      .collection(definition.name)
      .createIndex(definition.key, definition.index);
  }
}

module.exports = { MODEL, ensureStructure };
