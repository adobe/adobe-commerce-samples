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
const { MODEL } = require("./structure");
const {
  EXPLORER_PAGE_SIZE: PAGE_SIZE,
  MAX_OFFSET,
  EXPLORER_COLLECTIONS,
} = require("../../shared/catalog-config.json");

const COLLECTIONS = Object.fromEntries(
  Object.entries(EXPLORER_COLLECTIONS).map(([id, definition]) => [
    id,
    {
      ...definition,
      model: MODEL.find((model) => model.name === definition.name),
    },
  ]),
);

async function browse(client, request) {
  const definition = COLLECTIONS[request.collection];
  const filter = {};
  for (const field of ["supplierId", "sku", "reviewStatus"]) {
    if (request[field]) filter[field] = request[field];
  }
  const sort = {
    [request.sortBy]: request.sortDirection === "asc" ? 1 : -1,
  };
  for (const key of request.collection === "catalog"
    ? ["supplierId", "sku"]
    : ["supplierId"]) {
    if (!(key in sort)) sort[key] = 1;
  }
  const projection = {
    _id: 0,
    ...Object.fromEntries(
      Object.keys(definition.model.fields).map((field) => [field, 1]),
    ),
  };
  // One lookahead determines pagination without a costly or misleading total count.
  const documents = await client
    .collection(definition.model.name)
    .find(filter)
    .sort(sort)
    .project(projection)
    .skip(request.offset)
    .limit(PAGE_SIZE + 1)
    .toArray();
  return {
    collection: request.collection,
    collectionName: definition.model.name,
    documents: documents.slice(0, PAGE_SIZE),
    offset: request.offset,
    pageSize: PAGE_SIZE,
    hasNext: documents.length > PAGE_SIZE && request.offset < MAX_OFFSET,
    pageLimitReached:
      documents.length > PAGE_SIZE && request.offset === MAX_OFFSET,
    filter,
    sort,
    projection,
  };
}

module.exports = { browse, COLLECTIONS };
