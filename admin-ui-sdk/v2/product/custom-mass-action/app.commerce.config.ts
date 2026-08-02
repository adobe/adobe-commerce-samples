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
    description:
      "Adobe Commerce product grid custom mass action in admin panel",
    displayName: "Adobe Commerce Product Grid Custom Mass Action",
    id: "product-custom-mass-action",
    version: "1.0.0",
  },
  adminUi: {
    product: {
      massActions: [
        {
          confirm: {
            message:
              "Are you sure you want to proceed with Mass Action on selected products?",
            title: "Mass Action",
          },
          id: "product-mass-action",
          label: "Product Mass Action",
          path: "#/product-mass-action",
          selectionLimit: 1,
          type: "view",
        },
        {
          id: "product-mass-action-with-redirect",
          label: "Mass Action With Redirect",
          notifications: {
            error: "Product custom error message",
            success: "Product custom success message",
          },
          path: "#/product-mass-action-with-redirect",
          type: "view",
        },
        {
          id: "product-mass-action-no-iFrame",
          label: "Mass Action No iFrame",
          runtimeAction: "mass-actions/mass-action",
          type: "worker",
        },
      ],
    },
  },
});
