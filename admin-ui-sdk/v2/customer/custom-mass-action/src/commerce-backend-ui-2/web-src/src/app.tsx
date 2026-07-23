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

import { createExtensionApp } from "@adobe/aio-commerce-lib-admin-ui/web";
import "@react-spectrum/s2/page.css";

import config from "#app.commerce.config";
import { CustomerMassAction } from "#web/pages/customer-mass-action.tsx";
import { MainPage } from "#web/pages/main-page.tsx";
import { MassActionWithRedirect } from "#web/pages/mass-action-with-redirect.tsx";

createExtensionApp({
  menu: <MainPage />,
  metadata: {
    extensionId: config.metadata.id,
  },
  routes: [
    { element: <CustomerMassAction />, path: "#/customer-mass-action" },
    {
      element: <MassActionWithRedirect />,
      path: "#/mass-action-with-redirect",
    },
  ],
});
