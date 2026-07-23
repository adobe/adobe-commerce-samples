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
      gridColumns: {
        columns: [
          {
            align: "left",
            id: "first_column",
            label: "First App Column",
            type: "string",
          },
          {
            align: "left",
            id: "second_column",
            label: "Second App Column",
            type: "integer",
          },
          {
            align: "left",
            id: "third_column",
            label: "Third App Column",
            type: "date",
          },
        ],
        description: "Adds custom columns to the customer grid",
        label: "Customer grid columns",
        runtimeAction: "customer-custom-grid-columns/get-customer-grid-columns",
      },
    },
  },
  metadata: {
    description: "Adobe Commerce customer grid custom columns in admin panel",
    displayName: "Adobe Commerce customer grid custom columns",
    id: "customer-custom-grid-columns",
    version: "1.0.0",
  },
});
