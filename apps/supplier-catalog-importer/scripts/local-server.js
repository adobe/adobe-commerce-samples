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
const http = require("node:http");
const path = require("node:path");
const fs = require("node:fs/promises");
const { configuredDatabase } = require("./setup-database");
const { run } = require("../src/dx-excshell-1/actions/lib/workbench");
const {
  InputError,
  validate,
} = require("../src/dx-excshell-1/actions/lib/validation");

const WEB_ROOT = path.resolve(__dirname, "../dist/dx-excshell-1/web-prod");
const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".map": "application/json",
};

function json(res, code, body) {
  res.writeHead(code, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(body));
}

function createLocalServer() {
  return http.createServer(async (req, res) => {
    let client;
    try {
      const authority = `127.0.0.1:${res.socket.localPort}`;
      const origin = `http://${authority}`;
      // Exact Host prevents DNS rebinding; Origin + a non-simple header prevent browser CSRF.
      if (
        req.headers.host !== authority ||
        (req.headers.origin && req.headers.origin !== origin)
      ) {
        return json(res, 403, {
          error: "Local bridge accepts same-origin loopback requests only.",
        });
      }
      const pathname = new URL(req.url, origin).pathname;
      if (pathname.startsWith("/api/")) {
        if (req.headers["x-catalog-client"] !== "workbench") {
          return json(res, 403, {
            error: "Missing local workbench request header.",
          });
        }
        if (pathname === "/api/local-context" && req.method === "GET") {
          return json(res, 200, { local: true });
        }
        if (pathname !== "/api/catalog" || req.method !== "POST") {
          return json(res, 405, { error: "Use POST /api/catalog." });
        }
        if (!req.headers["content-type"]?.startsWith("application/json")) {
          return json(res, 415, { error: "Use application/json." });
        }
        let bytes = 0;
        const chunks = [];
        for await (const chunk of req.iterator({ destroyOnReturn: false })) {
          bytes += chunk.length;
          if (bytes > 1024 * 1024) {
            req.resume();
            throw new InputError("Request exceeds 1 MiB.", 413);
          }
          chunks.push(chunk);
        }
        let params;
        try {
          params = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        } catch {
          throw new InputError("Request must be valid JSON.");
        }
        if (!params || typeof params !== "object" || Array.isArray(params))
          throw new InputError("Request must be an object.");
        const request = validate(params);
        const db = await configuredDatabase();
        client = await db.connect();
        return json(res, 200, await run(client, request));
      }
      if (!["GET", "HEAD"].includes(req.method))
        return json(res, 405, { error: "Method not allowed." });
      const filename = path.resolve(
        WEB_ROOT,
        `.${decodeURIComponent(pathname === "/" ? "/index.html" : pathname)}`,
      );
      if (!filename.startsWith(`${WEB_ROOT}${path.sep}`))
        return json(res, 403, { error: "Invalid asset path." });
      const contents = await fs.readFile(filename);
      res.writeHead(200, {
        "Content-Type":
          MIME[path.extname(filename)] || "application/octet-stream",
        "Cache-Control": "no-store",
      });
      res.end(req.method === "HEAD" ? undefined : contents);
    } catch (error) {
      if (error.code === "ENOENT")
        return json(res, 404, {
          error: "Asset not found. Run npm run build first.",
        });
      const code =
        error instanceof InputError
          ? error.statusCode
          : [401, 403, 429, 503].includes(error.httpStatusCode)
            ? error.httpStatusCode
            : 500;
      json(res, code, {
        error:
          error instanceof InputError || error.progress
            ? error.message
            : "Workspace database request failed. Check .env credentials, provisioning and region.",
        ...(error.progress ? { progress: error.progress } : {}),
      });
    } finally {
      if (client) {
        try {
          await client.close();
        } catch {
          console.warn("Local database client cleanup failed.");
        }
      }
    }
  });
}

if (require.main === module) {
  require("dotenv").config({ quiet: true });
  const port = Number(process.env.CATALOG_PORT || 8787);
  if (!Number.isInteger(port) || port < 1024 || port > 65535)
    throw new Error("CATALOG_PORT must be 1024-65535.");
  const server = createLocalServer();
  server.on("error", () => {
    console.error(
      "Could not start the loopback workbench. Check whether its port is in use.",
    );
    process.exitCode = 1;
  });
  server.listen(port, "127.0.0.1", () =>
    console.log(
      `Supplier Catalog Importer: http://127.0.0.1:${port}. Uses the workspace database configured in .env.`,
    ),
  );
}

module.exports = { createLocalServer };
