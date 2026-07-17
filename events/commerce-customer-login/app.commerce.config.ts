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

import { defineConfig } from "@adobe/aio-commerce-lib-app/config";

export default defineConfig({
  metadata: {
    id: "commerce-customer-login",
    displayName: "Commerce Customer Login",
    version: "1.0.0",
    description:
      "Sends a Slack notification whenever a customer logs in to Adobe Commerce.",
  },

  eventing: {
    commerce: [
      {
        provider: {
          label: "Customer Login Events",
          description: "Events emitted when a customer logs in to Adobe Commerce",
        },
        events: [
          {
            name: "observer.customer_login",
            label: "Customer Login",
            description: "Triggered when a customer logs in",
            fields: [{ name: "customer.firstname" }, { name: "customer.lastname" }],
            runtimeActions: ["events/customer-login"],
          },
        ],
      },
    ],
  },
});
