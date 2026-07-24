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

import { defineCustomInstallationStep } from "@adobe/aio-commerce-lib-app/management";
import libDb from "@adobe/aio-lib-db";
import { Core } from "@adobe/aio-sdk";

// aio-lib-db environment pin — mirrors pinStageRuntimeEnv() in
// src/common/lib/storage.js (keep them in sync).
// This stage workspace's Database lives in the stage store, but aio-lib-db resolves its endpoint
// from `AIO_DB_ENVIRONMENT || getCliEnv()`, and getCliEnv() defaults to "prod" inside a deployed
// action. Without this pin the create/drop collection calls hit the prod endpoint and are rejected
// with "401: Oauth token is not valid".
//
// Pin ONLY AIO_DB_ENVIRONMENT — do NOT set AIO_CLI_ENV. AIO_CLI_ENV globally overrides getCliEnv(),
// which the app-management framework uses for its own install/uninstall status state (aio-lib-state);
// overriding it here corrupts that tracking. Called from inside getDbBase() (not module scope): a
// module-level statement is tree-shaken out of the installation action bundle. Use plain
// `if (!x) x=` — aio's webpack action bundler rejects ES2021 logical-assignment ("||=").
function pinStageRuntimeEnv() {
  if (
    (process.env.__OW_NAMESPACE || "").startsWith("development-") &&
    !process.env.AIO_DB_ENVIRONMENT
  ) {
    process.env.AIO_DB_ENVIRONMENT = "stage";
  }
}

const DB_STATUS = {
  PROVISIONED: "PROVISIONED",
  REQUESTED: "REQUESTED",
  PROCESSING: "PROCESSING",
  FAILED: "FAILED",
  REJECTED: "REJECTED",
};

const PROVISION_POLL_INTERVAL_MS = 3000;
const PROVISION_TIMEOUT_MS = 120_000; // 2 minutes

// Collection -> index definitions, so both the create and the log lines below
// share a single source of truth.
const INDEXES = {
  approval_requests: [
    { key: { id: 1 }, options: { unique: true } },
    { key: { status: 1, createdAt: -1 }, options: {} },
  ],
  execution_logs: [
    { key: { timestamp: -1 }, options: {} },
    { key: { source: 1 }, options: {} },
    { key: { status: 1 }, options: {} },
    { key: { orderId: 1 }, options: {} },
  ],
};

const INDEX_EXISTS_MESSAGE = /already exists|duplicate/i;

/** aio-lib-db surfaces conflicts as a DbError with a message from the backend, not a Mongo error code. */
function isIndexExistsError(error) {
  return INDEX_EXISTS_MESSAGE.test(error?.message ?? "");
}

async function getDbBase(params) {
  pinStageRuntimeEnv();
  const token = await Core.AuthClient.generateAccessToken(params);
  return libDb.init({ token: token.access_token });
}

/**
 * Ensures the workspace database is provisioned, requesting it if necessary and
 * polling until the service reports PROVISIONED.
 *
 * @param {import("@adobe/aio-lib-db").DbBase} dbBase
 * @param {object} logger
 */
async function ensureProvisioned(dbBase, logger) {
  let status;
  try {
    const result = await dbBase.provisionStatus();
    status = result?.status?.toUpperCase();
  } catch {
    status = "NOT_PROVISIONED";
  }

  if (status === DB_STATUS.PROVISIONED) {
    return;
  }

  const inProgress = new Set([DB_STATUS.REQUESTED, DB_STATUS.PROCESSING]);
  const terminal = new Set([DB_STATUS.FAILED, DB_STATUS.REJECTED]);

  if (!inProgress.has(status)) {
    logger.info("Requesting database provisioning");
    const result = await dbBase.provisionRequest();
    status = result?.status?.toUpperCase();
    if (status === DB_STATUS.PROVISIONED) {
      return;
    }
    if (terminal.has(status)) {
      throw new Error(`Database provisioning failed with status: ${status}`);
    }
  }

  logger.info("Waiting for database provisioning to complete");
  const deadline = Date.now() + PROVISION_TIMEOUT_MS;
  while (Date.now() < deadline) {
    // biome-ignore lint/performance/noAwaitInLoops: intentional sequential poll — each iteration must wait before re-checking provisioning status, Promise.all doesn't apply
    await new Promise((resolve) =>
      setTimeout(resolve, PROVISION_POLL_INTERVAL_MS),
    );
    const result = await dbBase.provisionStatus();
    status = result?.status?.toUpperCase();
    if (status === DB_STATUS.PROVISIONED) {
      return;
    }
    if (terminal.has(status)) {
      throw new Error(`Database provisioning failed with status: ${status}`);
    }
  }

  throw new Error(
    `Database provisioning timed out after ${PROVISION_TIMEOUT_MS / 1000}s (last status: ${status})`,
  );
}

/**
 * Creates and tears down database collections and indexes for the Purchase Approval app.
 *
 * Idempotent: re-creating an existing index is caught and skipped, so repeated
 * installs never fail.
 */
export default defineCustomInstallationStep({
  install: async (_config, context) => {
    const { logger, params } = context;

    const dbBase = await getDbBase(params);

    logger.info("Ensuring database is provisioned");
    await ensureProvisioned(dbBase, logger);

    logger.info("Setting up database collections and indexes");

    const client = await dbBase.connect();

    try {
      for (const [collectionName, defs] of Object.entries(INDEXES)) {
        const collection = client.collection(collectionName);
        for (const def of defs) {
          try {
            // biome-ignore lint/performance/noAwaitInLoops: index creation must run serially so the per-index try/catch can catch and skip an "already exists" error individually — Promise.all would abort the whole batch on the first rejection
            await collection.createIndex(def.key, def.options);
          } catch (error) {
            if (!isIndexExistsError(error)) {
              throw error;
            }
          }
        }
      }
    } catch (error) {
      logger.error("Failed to create database indexes", error);
      throw error;
    } finally {
      await client.close();
    }

    logger.info("Database indexes created successfully");
    return { status: "success" };
  },

  uninstall: async (_config, context) => {
    const { logger, params } = context;

    logger.info("Dropping database collections");

    const dbBase = await getDbBase(params);
    const client = await dbBase.connect();

    try {
      await client.collection("approval_requests").drop();
      await client.collection("execution_logs").drop();
    } catch (error) {
      logger.error("Failed to drop database collections", error);
      throw error;
    } finally {
      await client.close();
    }

    logger.info("Database collections dropped successfully");
  },
});
