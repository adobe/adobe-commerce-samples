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

const {
  jsonResponse,
  parseBody,
  parseNumber,
  makeLogEntry,
} = require("../src/common/lib/action-utils");

describe("jsonResponse", () => {
  test("sets statusCode and body", () => {
    const res = jsonResponse(200, { ok: true });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  test("sets Content-Type header", () => {
    const res = jsonResponse(404, { error: "not found" });
    expect(res.headers["Content-Type"]).toBe("application/json");
  });
});

describe("parseBody", () => {
  test("returns body object when already an object", () => {
    expect(parseBody({ body: { foo: 1 } })).toEqual({ foo: 1 });
  });

  test("parses JSON string body", () => {
    expect(parseBody({ body: '{"foo":1}' })).toEqual({ foo: 1 });
  });

  test("returns empty object for missing body", () => {
    expect(parseBody({})).toEqual({});
  });

  test("returns empty object for invalid JSON string", () => {
    expect(parseBody({ body: "not json" })).toEqual({});
  });
});

describe("parseNumber", () => {
  test("parses numeric string", () => {
    expect(parseNumber("42.5")).toBe(42.5);
  });

  test("passes through a number", () => {
    expect(parseNumber(10)).toBe(10);
  });

  test("returns NaN for undefined", () => {
    expect(Number.isNaN(parseNumber(undefined))).toBe(true);
  });

  test("returns NaN for null", () => {
    expect(Number.isNaN(parseNumber(null))).toBe(true);
  });

  test("returns NaN for non-numeric string", () => {
    expect(Number.isNaN(parseNumber("abc"))).toBe(true);
  });

  test("returns NaN for Infinity", () => {
    expect(Number.isNaN(parseNumber(Number.POSITIVE_INFINITY))).toBe(true);
  });
});

describe("makeLogEntry", () => {
  test("creates entry with expected shape", () => {
    const entry = makeLogEntry("req-1", "webhook");
    expect(entry.id).toBe("req-1");
    expect(entry.source).toBe("webhook");
    expect(entry.status).toBe("success");
    expect(entry.result).toBeNull();
    expect(entry.message).toBeNull();
    expect(entry.orderId).toBeNull();
    expect(typeof entry.timestamp).toBe("string");
  });
});
