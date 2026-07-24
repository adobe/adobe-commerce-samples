/**
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

const libDb = require("@adobe/aio-lib-db");
const { Core } = require("@adobe/aio-sdk");
const {
  getConfiguration,
  initialize,
  byCodeAndLevel,
} = require("@adobe/aio-commerce-lib-config");
const configSchema = require("../../commerce-configuration-1/.generated/configuration-schema.json");

const APPROVAL_REQUESTS_COLLECTION = "approval_requests";
const EXECUTION_LOGS_COLLECTION = "execution_logs";
const MAX_LOG_ENTRIES = 500;

// Indexes are created once per container warm-start.
let _indexesEnsured = false;

// aio-lib-db environment pin for a stage workspace.
// This app's App Builder Database (approval requests / execution logs) lives in the *stage* store,
// but aio-lib-db resolves its endpoint from `AIO_DB_ENVIRONMENT || getCliEnv()`, and getCliEnv()
// defaults to "prod" inside a deployed action (AIO_CLI_ENV is absent at runtime). Without this pin
// aio-lib-db calls hit the prod endpoint and are rejected with "401: Oauth token is not valid".
//
// Pin ONLY AIO_DB_ENVIRONMENT — do NOT set AIO_CLI_ENV. AIO_CLI_ENV globally overrides getCliEnv(),
// which the app-management framework itself uses for its own aio-lib-state operations (association
// + install/uninstall status). Overriding it mid-action leaves the framework's state split across
// the prod and stage stores and corrupts install-status tracking ("Installation has already
// completed" on reinstall). A real production namespace is left untouched.
//
// Must be called from *inside* the entry functions (not at module scope): a module-level statement
// gets tree-shaken out of the app-management installation action bundle. Use plain `if (!x) x=` —
// aio's webpack action bundler rejects ES2021 logical-assignment ("||=").
function pinStageRuntimeEnv() {
  if (
    (process.env.__OW_NAMESPACE || "").startsWith("development-") &&
    !process.env.AIO_DB_ENVIRONMENT
  ) {
    process.env.AIO_DB_ENVIRONMENT = "stage";
  }
}

async function getClient(params) {
  pinStageRuntimeEnv();
  const token = await Core.AuthClient.generateAccessToken(params);
  const dbBase = await libDb.init({ token: token.access_token });
  return dbBase.connect();
}

async function ensureIndexes(client) {
  if (_indexesEnsured) {
    return;
  }
  const ar = client.collection(APPROVAL_REQUESTS_COLLECTION);
  await ar.createIndex({ id: 1 }, { unique: true });
  await ar.createIndex({ status: 1, createdAt: -1 });
  const el = client.collection(EXECUTION_LOGS_COLLECTION);
  await el.createIndex({ timestamp: -1 });
  await el.createIndex({ source: 1 });
  await el.createIndex({ status: 1 });
  await el.createIndex({ orderId: 1 });
  _indexesEnsured = true;
}

// Approval requests
// biome-ignore lint/style/useDefaultParameterLast: reordering would break the established (filters, params) call signature used across all callers
async function getApprovalRequests({ status, limit = 50 } = {}, params) {
  const client = await getClient(params);
  try {
    await ensureIndexes(client);
    const collection = client.collection(APPROVAL_REQUESTS_COLLECTION);
    const query = {};
    if (status) {
      query.status = status;
    }
    return await collection
      .find(query)
      .project({
        id: 1,
        incrementId: 1,
        orderId: 1,
        customerName: 1,
        customerEmail: 1,
        grandTotal: 1,
        currency: 1,
        status: 1,
        createdAt: 1,
        _id: 0,
      })
      .sort({ createdAt: -1 })
      .limit(Math.min(limit, 100))
      .toArray();
  } finally {
    await client.close();
  }
}

async function getApprovalRequestsByOrderIds(incrementIds, params) {
  const client = await getClient(params);
  try {
    await ensureIndexes(client);
    const collection = client.collection(APPROVAL_REQUESTS_COLLECTION);
    const ids = incrementIds.map(String);
    return await collection
      .find({ incrementId: { $in: ids } })
      .project({
        incrementId: 1,
        status: 1,
        approvedBy: 1,
        createdAt: 1,
        _id: 0,
      })
      .toArray();
  } finally {
    await client.close();
  }
}

async function getApprovalRequest(id, params) {
  const client = await getClient(params);
  try {
    const collection = client.collection(APPROVAL_REQUESTS_COLLECTION);
    return (await collection.findOne({ id })) ?? null;
  } finally {
    await client.close();
  }
}

async function createApprovalRequest(request, params) {
  const client = await getClient(params);
  try {
    await ensureIndexes(client);
    const collection = client.collection(APPROVAL_REQUESTS_COLLECTION);
    await collection.insertOne(request);
    return request;
  } finally {
    await client.close();
  }
}

async function updateApprovalRequest(id, updates, params) {
  const client = await getClient(params);
  try {
    const collection = client.collection(APPROVAL_REQUESTS_COLLECTION);
    await collection.updateOne(
      { id },
      { $set: { ...updates, updatedAt: new Date().toISOString() } },
    );
    return (await collection.findOne({ id })) ?? null;
  } finally {
    await client.close();
  }
}

// Business configuration – read from aio-commerce-lib-config (global scope).
// Returns a plain key→value object. Falls back to schema defaults when a field
// has not been configured yet.
const CONFIG_DEFAULTS = {
  approvalThresholdAmount: "1000",
  currency: "USD",
  approverEmails: "",
  requireApprovalMessage:
    "This order requires manager approval before fulfillment.",
  alertWebhookUrl: "",
};

async function getApprovalConfig() {
  try {
    await initialize({ schema: configSchema });
    const result = await getConfiguration(byCodeAndLevel("global", "global"));
    const config = { ...CONFIG_DEFAULTS };
    for (const item of result.config) {
      if (item.value !== undefined && item.value !== null) {
        config[item.name] = item.value;
      }
    }
    return config;
  } catch {
    return { ...CONFIG_DEFAULTS };
  }
}

// Execution log (webhook + event handler invocations) — stored in DB
// biome-ignore lint/style/useDefaultParameterLast: reordering would break the established (filters, params) call signature used across all callers
async function getExecutionLog(filters = {}, params) {
  const client = await getClient(params);
  try {
    await ensureIndexes(client);
    const collection = client.collection(EXECUTION_LOGS_COLLECTION);
    const query = {};
    if (filters.source) {
      query.source = filters.source;
    }
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.orderId) {
      query.orderId = filters.orderId;
    }
    return await collection
      .find(query)
      .project({
        id: 1,
        timestamp: 1,
        source: 1,
        orderId: 1,
        result: 1,
        status: 1,
        message: 1,
        _id: 0,
      })
      .sort({ timestamp: -1 })
      .limit(MAX_LOG_ENTRIES)
      .toArray();
  } finally {
    await client.close();
  }
}

async function appendExecutionLog(entry, params) {
  const client = await getClient(params);
  try {
    const collection = client.collection(EXECUTION_LOGS_COLLECTION);
    await collection.insertOne(entry);
    return entry;
  } finally {
    await client.close();
  }
}

module.exports = {
  pinStageRuntimeEnv,
  getApprovalRequests,
  getApprovalRequestsByOrderIds,
  getApprovalRequest,
  createApprovalRequest,
  updateApprovalRequest,
  getApprovalConfig,
  getExecutionLog,
  appendExecutionLog,
};
