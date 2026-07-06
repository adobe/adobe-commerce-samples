import { createExtensionApp } from "@adobe/aio-commerce-lib-admin-ui/web";
import "@react-spectrum/s2/page.css";

import config from "#app.commerce.config";
import { CustomerMassAction } from "#web/pages/customer-mass-action.tsx";
import { MainPage } from "#web/pages/main-page.tsx";
import { MassActionWithRedirect } from "#web/pages/mass-action-with-redirect.tsx";

createExtensionApp({
  metadata: {
    extensionId: config.metadata.id,
  },

  routes: [
    { index: true, element: <MainPage /> },
    { path: "#/customer-mass-action", element: <CustomerMassAction /> },
    { path: "#/mass-action-with-redirect", element: <MassActionWithRedirect /> },
  ],
});
