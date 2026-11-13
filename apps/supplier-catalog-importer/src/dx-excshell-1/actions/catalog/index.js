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
const Logger = require("@adobe/aio-lib-core-logging");
const { run } = require("../lib/workbench");
const { openDatabase } = require("../lib/database");
const { InputError, validate } = require("../lib/validation");

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
    body,
  };
}

async function main(params) {
  const logger = Logger("supplier-catalog");
  let client;
  try {
    if (params.__ow_method && params.__ow_method !== "post") {
      return response(405, { error: "Use POST for catalog operations." });
    }
    const request = validate(params);
    const database = await openDatabase(params);
    client = await database.connect();
    return response(200, await run(client, request));
  } catch (error) {
    if (error instanceof InputError) {
      return response(error.statusCode, { error: error.message });
    }
    // SDK errors can contain request headers and credentials; never log the raw error.
    logger.error("Catalog operation failed", {
      code: error.httpStatusCode || error.cause?.httpStatusCode || 500,
    });
    const upstreamCode = error.httpStatusCode || error.cause?.httpStatusCode;
    const statusCode = [401, 403, 429, 503].includes(upstreamCode)
      ? upstreamCode
      : 500;
    return response(statusCode, {
      error: error.progress
        ? error.message
        : "Database operation failed. Check workspace access, provisioning and action logs.",
      ...(error.progress ? { progress: error.progress } : {}),
    });
  } finally {
    if (client) {
      try {
        await client.close();
      } catch {
        logger.warn("Database client cleanup failed.");
      }
    }
  }
}

exports.main = main;
