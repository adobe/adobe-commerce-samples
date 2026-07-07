import { createExtensionApp } from "@adobe/aio-commerce-lib-admin-ui/web";
import "@react-spectrum/s2/page.css";

import config from "#app.commerce.config";
import { MainPage } from "#web/pages/main-page.tsx";
import { MassActionWithRedirect } from "#web/pages/mass-action-with-redirect.tsx";
import { ProductMassAction } from "#web/pages/product-mass-action.tsx";

createExtensionApp({
  metadata: {
    extensionId: config.metadata.id,
  },

  routes: [
    { index: true, element: <MainPage /> },
    { path: "#/product-mass-action", element: <ProductMassAction /> },
    { path: "#/mass-action-with-redirect", element: <MassActionWithRedirect /> },
  ],
});
