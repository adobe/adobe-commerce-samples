const { defineConfig } = require("@adobe/aio-commerce-lib-app/config");

module.exports = defineConfig({
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
