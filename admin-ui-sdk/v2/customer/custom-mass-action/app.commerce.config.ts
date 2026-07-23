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

import { defineConfig } from "@adobe/aio-commerce-lib-app/config";

export default defineConfig({
  adminUi: {
    customer: {
      massActions: [
        {
          confirm: {
            message:
              "Are you sure you want to proceed with Mass Action on selected customers?",
            title: "Mass Action",
          },
          id: "customer-mass-action",
          label: "Customer Mass Action",
          path: "#/customer-mass-action",
          selectionLimit: 1,
          type: "view",
        },
        {
          id: "customer-mass-action-with-redirect",
          label: "Mass Action With Redirect",
          path: "#/mass-action-with-redirect",
          title: "Customer Mass Action With Redirect",
          type: "view",
        },
        {
          id: "customer-mass-action-no-iFrame",
          label: "Mass Action No iFrame",
          runtimeAction: "mass-actions/mass-action",
          type: "worker",
        },
      ],
    },
  },
  metadata: {
    description:
      "Adobe Commerce customer grid custom mass action in admin panel",
    displayName: "Adobe Commerce customer grid custom mass action",
    id: "customer-custom-mass-action",
    version: "1.0.0",
  },
});
