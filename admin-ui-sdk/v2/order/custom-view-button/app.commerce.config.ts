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
      viewButtons: [
        {
          confirm: {
            message: "Are you sure you want to proceed to delete order?",
          },
          id: "order-custom-view-button::delete-order",
          label: "Delete",
          level: 0,
          notifications: {
            error: "Failed to delete order",
            success: "Order deleted successfully",
          },
          path: "#/delete-order",
          sortOrder: 80,
          type: "view",
        },
        {
          id: "order-custom-view-button::create-return",
          label: "Create Return",
          level: 0,
          notifications: {
            error: "Failed to create return request",
            success: "Return request created successfully",
          },
          path: "#/create-return",
          sortOrder: 80,
          type: "view",
        },
      ],
    },
  },
  metadata: {
    description: "Adobe Commerce order grid custom view button in admin panel",
    displayName: "Adobe Commerce order grid custom view button",
    id: "order-custom-view-button",
    version: "1.0.0",
  },
});
