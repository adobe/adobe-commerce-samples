import { createExtensionApp } from "@adobe/aio-commerce-lib-admin-ui/web";
import "@react-spectrum/s2/page.css";

import config from "#app.commerce.config";
import { CreateReturnPage } from "#web/pages/create-return.tsx";
import { DeleteOrderPage } from "#web/pages/delete-order.tsx";
import { MainPage } from "#web/pages/main-page.tsx";

createExtensionApp({
  metadata: {
    extensionId: config.metadata.id,
  },

  routes: [
    { index: true, element: <MainPage /> },
    { path: "#/delete-order", element: <DeleteOrderPage /> },
    { path: "#/create-return", element: <CreateReturnPage /> },
  ],
});
