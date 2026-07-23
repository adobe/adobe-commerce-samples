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
    order: {
      massActions: [
        {
          confirm: {
            message:
              "Are you sure you want to proceed with Mass Action on selected orders?",
            title: "Mass Action",
          },
          id: "order-mass-action",
          label: "Order Mass Action",
          path: "#/order-mass-action",
          selectionLimit: 1,
          type: "view",
        },
        {
          id: "order-mass-action-with-redirect",
          label: "Mass Action With Redirect",
          notifications: {
            error: "Order custom error message",
            success: "Order custom success message",
          },
          path: "#/mass-action-with-redirect",
          title: "Order Mass Action With Redirect",
          type: "view",
        },
        {
          id: "order-mass-action-no-iFrame",
          label: "Mass Action No iFrame",
          runtimeAction: "mass-actions/mass-action",
          type: "worker",
        },
      ],
    },
  },
  metadata: {
    description: "Adobe Commerce order grid custom mass action in admin panel",
    displayName: "Adobe Commerce order grid custom mass action",
    id: "order-custom-mass-action",
    version: "1.0.0",
  },
});
