import { createExtensionApp } from "@adobe/aio-commerce-lib-admin-ui/web";
import "@react-spectrum/s2/page.css";

import config from "#app.commerce.config";
import { ApprovalDashboardPage } from "#web/pages/approval-dashboard-page.tsx";

createExtensionApp({
  menu: <ApprovalDashboardPage />,
  metadata: {
    extensionId: config.metadata.id,
  },
});
