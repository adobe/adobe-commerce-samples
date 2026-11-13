#!/usr/bin/env node

/*
Copyright 2025 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import { Core } from "@adobe/aio-sdk";

import { main as syncOAuthCredentials } from "../scripts/sync-oauth-credentials.js";

const logger = Core.Logger("hooks/pre-app-build", {
  level: process.env.LOG_LEVEL || "info",
});

const hook = async () => {
  await syncOAuthCredentials();
  logger.info("Done");
};

// Run if executed directly (as a script)
if (import.meta.url === `file://${process.argv[1]}`) {
  hook();
}

export default hook;
