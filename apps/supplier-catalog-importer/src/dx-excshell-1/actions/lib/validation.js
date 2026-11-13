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
const MAX_ROWS = 500;
const { COLLECTIONS } = require("./explorer");
const {
  EXPLORER_PAGE_SIZE,
  MAX_OFFSET,
} = require("../../shared/catalog-config.json");
const MAX_BYTES = 512 * 1024;
const STATUSES = ["pending", "approved", "rejected"];
const OPERATIONS = [
  "status",
  "initialize",
  "suppliers",
  "schema",
  "browse",
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
];

class InputError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

function object(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new InputError(`${label} must be an object.`);
  }
}

function identifier(value, label) {
  if (
    typeof value !== "string" ||
    !/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(value)
  ) {
    throw new InputError(`${label} must be 1-64 letters, numbers, "_" or "-".`);
  }
  return value;
}

function attributes(value, allowed, required) {
  object(value, "product");
  if (Object.keys(value).some((key) => !allowed.includes(key))) {
    throw new InputError("Product contains unsupported fields.");
  }
  const result = {};
  if (value.name !== undefined) {
    if (
      typeof value.name !== "string" ||
      value.name.trim().length === 0 ||
      value.name.length > 200
    ) {
      throw new InputError(
        "name must be a non-empty string of at most 200 characters.",
      );
    }
    result.name = value.name.trim();
  }
  if (value.price !== undefined) {
    if (
      typeof value.price !== "number" ||
      !Number.isFinite(value.price) ||
      value.price < 0 ||
      value.price > 1_000_000 ||
      Math.abs(value.price * 100 - Math.round(value.price * 100)) > 0.000001
    ) {
      throw new InputError(
        "price must be between 0 and 1000000, with at most two decimals.",
      );
    }
    result.price = value.price;
  }
  if (required && (result.name === undefined || result.price === undefined)) {
    throw new InputError("name and price are required.");
  }
  if (!required && Object.keys(result).length === 0) {
    throw new InputError("Provide name or price to update.");
  }
  return result;
}

function validate(params) {
  if (!OPERATIONS.includes(params.operation)) {
    throw new InputError(`operation must be one of: ${OPERATIONS.join(", ")}.`);
  }
  if (
    ["status", "initialize", "suppliers", "schema"].includes(params.operation)
  ) {
    return { operation: params.operation };
  }
  if (params.operation === "browse") {
    const allowed = [
      "operation",
      "collection",
      "supplierId",
      "sku",
      "reviewStatus",
      "sortBy",
      "sortDirection",
      "offset",
    ];
    // Runtime supplies trusted platform metadata alongside the browser parameters.
    if (
      Object.keys(params).some(
        (key) =>
          !allowed.includes(key) &&
          !key.startsWith("__") &&
          key !== "DB_REGION",
      )
    ) {
      throw new InputError("Unsupported database explorer parameter.");
    }
    if (
      typeof params.collection !== "string" ||
      !Object.hasOwn(COLLECTIONS, params.collection)
    ) {
      throw new InputError("collection must be suppliers or catalog.");
    }
    const definition = COLLECTIONS[params.collection];
    const request = {
      operation: "browse",
      collection: params.collection,
      sortBy: params.sortBy ?? definition.defaultSort,
      sortDirection: params.sortDirection ?? definition.defaultDirection,
      offset: params.offset ?? 0,
    };
    if (
      !definition.sortFields.includes(request.sortBy) ||
      !["asc", "desc"].includes(request.sortDirection)
    ) {
      throw new InputError("Invalid database explorer sort.");
    }
    if (
      !Number.isInteger(request.offset) ||
      request.offset < 0 ||
      request.offset > MAX_OFFSET ||
      request.offset % EXPLORER_PAGE_SIZE !== 0
    ) {
      throw new InputError(
        `Explorer offset must be a multiple of ${EXPLORER_PAGE_SIZE} between 0 and ${MAX_OFFSET}.`,
      );
    }
    if (params.supplierId !== undefined && params.supplierId !== "")
      request.supplierId = identifier(params.supplierId, "supplierId");
    for (const field of ["sku", "reviewStatus"]) {
      if (params[field] !== undefined && params[field] !== "") {
        if (request.collection !== "catalog")
          throw new InputError(`${field} applies only to catalog documents.`);
        if (field === "sku") request.sku = identifier(params.sku, "sku");
        else if (STATUSES.includes(params.reviewStatus))
          request.reviewStatus = params.reviewStatus;
        else throw new InputError("Invalid reviewStatus.");
      }
    }
    return request;
  }
  const request = {
    operation: params.operation,
    supplierId: identifier(params.supplierId, "supplierId"),
  };
  if (["initial-import", "sync-feed"].includes(request.operation)) {
    if (
      !Array.isArray(params.rows) ||
      params.rows.length === 0 ||
      params.rows.length > MAX_ROWS
    ) {
      throw new InputError(`rows must contain 1-${MAX_ROWS} products.`);
    }
    if (Buffer.byteLength(JSON.stringify(params.rows)) > MAX_BYTES) {
      throw new InputError("rows exceed the 512 KiB demo payload limit.", 413);
    }
    const seen = new Set();
    request.rows = params.rows.map((row) => {
      object(row, "row");
      const sku = identifier(row.sku, "sku");
      if (seen.has(sku)) {
        throw new InputError("Each SKU must appear only once per feed.");
      }
      seen.add(sku);
      if (request.operation === "sync-feed" && row.type === "discontinue") {
        if (Object.keys(row).some((key) => !["type", "sku"].includes(key))) {
          throw new InputError("Discontinue rows accept only type and sku.");
        }
        return { type: "discontinue", sku };
      }
      const sync = request.operation === "sync-feed";
      if (sync && row.type !== "upsert") {
        throw new InputError("Feed row type must be upsert or discontinue.");
      }
      return {
        ...(sync ? { type: "upsert" } : {}),
        sku,
        ...attributes(
          row,
          sync ? ["type", "sku", "name", "price"] : ["sku", "name", "price"],
          true,
        ),
      };
    });
  } else if (request.operation === "list") {
    const offset = params.offset ?? 0;
    if (!Number.isInteger(offset) || offset < 0 || offset > MAX_OFFSET) {
      throw new InputError(
        `offset must be an integer between 0 and ${MAX_OFFSET}.`,
      );
    }
    request.offset = offset;
    if (params.reviewStatus !== undefined && params.reviewStatus !== "") {
      if (!STATUSES.includes(params.reviewStatus)) {
        throw new InputError("Invalid reviewStatus.");
      }
      request.reviewStatus = params.reviewStatus;
    }
  } else if (request.operation !== "scan-pending") {
    request.sku = identifier(params.sku, "sku");
    if (["create", "update", "upsert"].includes(request.operation)) {
      request.product = attributes(
        params.product,
        ["name", "price"],
        request.operation !== "update",
      );
    }
    if (request.operation === "save-review") {
      if (!STATUSES.includes(params.reviewStatus)) {
        throw new InputError("Invalid reviewStatus.");
      }
      request.reviewStatus = params.reviewStatus;
    }
  }
  return request;
}

module.exports = { InputError, validate };
