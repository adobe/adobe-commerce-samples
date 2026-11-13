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
const { InputError } = require("./validation");
const {
  CATALOG_PAGE_SIZE: PAGE_SIZE,
} = require("../../shared/catalog-config.json");

const BATCH_SIZE = 50;
const SCAN_LIMIT = 1000;
const PREVIEW_SIZE = 20;
const LIST_FIELDS = { _id: 0, sku: 1, name: 1, price: 1, reviewStatus: 1 };
const DETAIL_FIELDS = {
  ...LIST_FIELDS,
  supplierId: 1,
  discontinued: 1,
  createdAt: 1,
  updatedAt: 1,
};

function updateFor(product, now, discontinued = false) {
  // These operators must have disjoint fields. Only inserts set createdAt.
  return {
    $set: { ...product, discontinued, reviewStatus: "pending", updatedAt: now },
    $setOnInsert: { createdAt: now },
  };
}

async function writeBatches(collection, request, now) {
  const progress = {
    batchesCompleted: 0,
    rowsCompleted: 0,
    insertedCount: 0,
    matchedCount: 0,
    modifiedCount: 0,
    upsertedCount: 0,
  };
  for (let offset = 0; offset < request.rows.length; offset += BATCH_SIZE) {
    const rows = request.rows.slice(offset, offset + BATCH_SIZE);
    let result;
    try {
      if (request.operation === "initial-import") {
        // Sequential batches intentionally stop at the first failed batch.
        result = await collection.insertMany(
          rows.map((row) => ({
            ...row,
            supplierId: request.supplierId,
            reviewStatus: "pending",
            discontinued: false,
            createdAt: now,
            updatedAt: now,
          })),
          { ordered: true },
        );
      } else {
        result = await collection.bulkWrite(
          rows.map((row) => ({
            updateOne: {
              filter: { supplierId: request.supplierId, sku: row.sku },
              update:
                row.type === "discontinue"
                  ? {
                      $set: {
                        discontinued: true,
                        reviewStatus: "pending",
                        updatedAt: now,
                      },
                    }
                  : updateFor({ name: row.name, price: row.price }, now),
              upsert: row.type === "upsert",
            },
          })),
          { ordered: true },
        );
      }
    } catch (cause) {
      const error = new Error(
        "Feed stopped. Earlier batches are saved; the failed batch may also have partial writes. Inspect the catalog before retrying.",
        { cause },
      );
      error.progress = {
        ...progress,
        failedBatch: progress.batchesCompleted + 1,
        failedBatchMayHaveWrites: true,
      };
      throw error;
    }
    for (const key of [
      "insertedCount",
      "matchedCount",
      "modifiedCount",
      "upsertedCount",
    ]) {
      progress[key] += result[key] || 0;
    }
    progress.batchesCompleted++;
    progress.rowsCompleted += rows.length;
  }
  return progress;
}

async function scanPending(collection, supplierId) {
  const cursor = collection
    .find({ supplierId, reviewStatus: "pending" })
    .project({ _id: 0, sku: 1 })
    .sort({ sku: 1 })
    .limit(SCAN_LIMIT + 1)
    .batchSize(BATCH_SIZE);
  const preview = [];
  let scanned = 0;
  let truncated = false;
  try {
    // The SDK fetches cursor pages; we keep a count and at most 20 SKUs in memory.
    for await (const product of cursor) {
      if (scanned === SCAN_LIMIT) {
        truncated = true;
        break;
      }
      scanned++;
      if (preview.length < PREVIEW_SIZE) {
        preview.push(product.sku);
      }
    }
  } finally {
    await cursor.close();
  }
  return { scanned, preview, truncated, scanLimit: SCAN_LIMIT };
}

async function execute(collection, request) {
  const { operation, supplierId, sku } = request;
  const filter = { supplierId, sku };
  const now = new Date().toISOString();
  switch (operation) {
    case "create": {
      const product = {
        ...filter,
        ...request.product,
        reviewStatus: "pending",
        discontinued: false,
        createdAt: now,
        updatedAt: now,
      };
      await collection.insertOne(product);
      return product;
    }
    case "get": {
      const product = await collection.findOne(filter, {
        projection: DETAIL_FIELDS,
      });
      if (!product) {
        throw new InputError("Product not found.", 404);
      }
      return product;
    }
    case "list":
      return collection
        .find({
          supplierId,
          ...(request.reviewStatus
            ? { reviewStatus: request.reviewStatus }
            : {}),
        })
        .sort({ updatedAt: -1, sku: 1 })
        .project(LIST_FIELDS)
        .skip(request.offset)
        .limit(PAGE_SIZE)
        .toArray();
    case "update": {
      const result = await collection.updateOne(filter, {
        $set: { ...request.product, reviewStatus: "pending", updatedAt: now },
      });
      if (!result.matchedCount) {
        throw new InputError("Product not found.", 404);
      }
      return {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
      };
    }
    case "upsert":
      return collection.updateOne(filter, updateFor(request.product, now), {
        upsert: true,
      });
    case "save-review": {
      const product = await collection.findOneAndUpdate(
        filter,
        { $set: { reviewStatus: request.reviewStatus, updatedAt: now } },
        {
          returnDocument: "after",
          includeResultMetadata: false,
          projection: DETAIL_FIELDS,
        },
      );
      if (!product) {
        throw new InputError("Product not found.", 404);
      }
      return product;
    }
    case "delete-rejected": {
      // The status check and deletion happen atomically, even with concurrent reviews.
      const result = await collection.deleteOne({
        ...filter,
        reviewStatus: "rejected",
      });
      if (!result.deletedCount) {
        throw new InputError(
          "No rejected product with this supplier and SKU.",
          409,
        );
      }
      return { deletedCount: result.deletedCount };
    }
    case "initial-import":
    case "sync-feed":
      return writeBatches(collection, request, now);
    case "scan-pending":
      return scanPending(collection, supplierId);
    default:
      throw new InputError("Unsupported operation.");
  }
}

module.exports = { execute };
