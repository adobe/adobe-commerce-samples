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

/**
 * Replaces or creates an environment variable in a .env file
 * @param {string} filePath - The path to the .env file
 * @param {string} key - The environment variable key to replace or create
 * @param {string} value - The new value for the environment variable
 */
export function replaceEnvVar(filePath, key, value) {
  const envPath = path.resolve(filePath);
  const envFile = fs.readFileSync(envPath, "utf8");
  const envLines = envFile.split("\n");

  const formattedValue = value.includes(" ") ? `"${value}"` : value;
  let keyExists = false;

  const updatedLines = envLines.map((line) => {
    if (line.trim().startsWith("#") || !line.includes("=")) {
      return line;
    }
    const [currentKey] = line.split("=");
    if (currentKey === key) {
      keyExists = true;
      return `${key}=${formattedValue}`;
    }
    return line;
  });

  if (!keyExists) {
    updatedLines.push(`${key}=${formattedValue}`);
  }

  fs.writeFileSync(envPath, updatedLines.join("\n"), "utf8");
}

/**
 * @returns {string} The path to the .env file.
 */
export function resolveEnvPath() {
  const envPath = process.env.INIT_CWD
    ? `${process.env.INIT_CWD}/.env`
    : ".env";
  return path.resolve(envPath);
}
