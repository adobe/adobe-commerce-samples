/*
Copyright 2024 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import { describe, expect, it } from "vitest";

import { decode, encode } from "../../lib/key-values.js";

describe("key-values", () => {
  describe("encode", () => {
    it("should encode an object into a string with default delimiters", () => {
      const obj = { foo: "bar", baz: "qux" };
      const result = encode(obj);
      expect(result).toBe("foo:bar,baz:qux");
    });

    it("should encode an object into a string with custom delimiters", () => {
      const obj = { foo: "bar", baz: "qux" };
      const result = encode(obj, ";", "=");
      expect(result).toBe("foo=bar;baz=qux");
    });

    it("should return an empty string if the input is not an object", () => {
      const result = encode("not an object");
      expect(result).toBe("");
    });
  });

  describe("decode", () => {
    it("should decode a string into an object with default delimiters", () => {
      const str = "foo:bar,baz:qux";
      const result = decode(str);
      expect(result).toEqual({ foo: "bar", baz: "qux" });
    });

    it("should decode a string into an object with custom delimiters", () => {
      const str = "foo=bar;baz=qux";
      const result = decode(str, ";", "=");
      expect(result).toEqual({ foo: "bar", baz: "qux" });
    });

    it("should return an empty object if the input is not a string", () => {
      const result = decode(12_345);
      expect(result).toEqual({});
    });

    it("should throw an error if the string is not properly formatted", () => {
      const str = "foo:bar,baz";
      expect(() => decode(str)).toThrow("Can't decode the key value 'baz'");
    });
  });
});
