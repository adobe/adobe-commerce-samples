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

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { replaceEnvVar } from "../../lib/env.js";

vi.mock("fs");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("replaceEnvVar", () => {
  const mockEnvPath = path.resolve(__dirname, "/.env");
  const mockEnvContent =
    "# Comment line\nKEY1=value1\n\nKEY2=value2\nKEY3=value3";

  beforeEach(() => {
    fs.readFileSync.mockReturnValue(mockEnvContent);
    fs.writeFileSync.mockClear();
  });

  it("should replace the value of an existing environment variable", () => {
    replaceEnvVar(mockEnvPath, "KEY2", "newValue2");
    const expectedContent =
      "# Comment line\nKEY1=value1\n\nKEY2=newValue2\nKEY3=value3";
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      mockEnvPath,
      expectedContent,
      "utf8",
    );
  });

  it("should create the environment variable if the key does not exist", () => {
    replaceEnvVar(mockEnvPath, "KEY4", "newValue4");
    const expectedContent =
      "# Comment line\nKEY1=value1\n\nKEY2=value2\nKEY3=value3\nKEY4=newValue4";
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      mockEnvPath,
      expectedContent,
      "utf8",
    );
  });

  it("should preserve comments and empty lines", () => {
    replaceEnvVar(mockEnvPath, "KEY1", "newValue1");
    const expectedContent =
      "# Comment line\nKEY1=newValue1\n\nKEY2=value2\nKEY3=value3";
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      mockEnvPath,
      expectedContent,
      "utf8",
    );
  });

  it("should add quotes around the value if it contains spaces", () => {
    replaceEnvVar(mockEnvPath, "KEY2", "new value with spaces");
    const expectedContent =
      '# Comment line\nKEY1=value1\n\nKEY2="new value with spaces"\nKEY3=value3';
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      mockEnvPath,
      expectedContent,
      "utf8",
    );
  });
});
