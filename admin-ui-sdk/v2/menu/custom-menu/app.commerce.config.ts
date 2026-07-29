/*
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

/** biome-ignore-all assist/source/useSortedKeys: Makes config more difficult to read */

import { defineConfig } from "@adobe/aio-commerce-lib-app/config";

export default defineConfig({
  metadata: {
    description: "Adobe Commerce custom menu example in admin panel",
    displayName: "Adobe Commerce Custom Menu",
    id: "custommenu",
    version: "1.0.0",
  },
  adminUi: {
    menu: {
      description: "First App on App Builder",
      id: "CustomMenu::first",
      label: "First App on App Builder",
      pageTitle: "Adobe Commerce First App on App Builder",
    },
  },
});
