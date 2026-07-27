/**
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

function field(name: string, source?: string) {
  if (source) {
    return { name, source };
  }
  return { name };
}

export default defineConfig({
  metadata: {
    id: "purchase-approval",
    displayName: "Purchase Approval",
    description:
      "B2B approval workflows for Adobe Commerce: configure approval rules, evaluate orders at checkout via webhooks, and manage pending approvals from a dashboard.",
    version: "1.0.6",
  },

  businessConfig: {
    schema: [
      {
        name: "approvalThresholdAmount",
        type: "text",
        label: "Approval threshold amount",
        default: "1000",
      },
      {
        name: "currency",
        type: "text",
        label: "Currency code",
        default: "USD",
      },
      {
        name: "approverEmails",
        type: "text",
        label: "Approver emails (comma-separated)",
        default: "",
      },
      {
        name: "requireApprovalMessage",
        type: "text",
        label: "Message when order requires approval",
        default: "This order requires manager approval before fulfillment.",
      },
      {
        name: "alertWebhookUrl",
        type: "url",
        label:
          "Optional alert webhook URL (e.g. Slack) for evaluation failures",
        default: "",
      },
    ],
  },

  eventing: {
    commerce: [
      {
        provider: {
          label: "Purchase Approval Commerce Events",
          description: "Order events for approval workflow",
          key: "purchase-approval-provider",
        },
        events: [
          {
            name: "observer.checkout_submit_all_after",
            label: "Order Placed",
            description:
              "Fires when checkout completes and the order is placed",
            fields: [
              field("order.increment_id"),
              field("order.entity_id"),
              field("order.grand_total"),
              field("order.status"),
              field("order.state"),
              field("order.store_name"),
              field("order.customer_email"),
              field("order.customer_firstname"),
              field("order.customer_lastname"),
            ],
            runtimeActions: ["PurchaseApproval/order-event-handler"],
            priority: true,
          },
        ],
      },
    ],
  },

  webhooks: [
    {
      label: "Checkout approval check",
      description:
        "Evaluates approval rules at checkout; orders above the threshold require approval before fulfillment.",
      category: "validation",
      runtimeAction: "PurchaseApproval/checkout-approval-check",
      requireAdobeAuth: true,
      webhook: {
        webhook_method: "observer.sales_order_place_before",
        webhook_type: "after",
        batch_name: "purchase_approval_check",
        hook_name: "checkout_approval_validation",
        method: "POST",
        fields: [
          field("order.grand_total"),
          field("order.increment_id"),
          field("order.entity_id"),
          field("order.customer_email"),
          field("order.customer_firstname"),
          field("order.customer_lastname"),
          field("order.order_currency_code"),
          field("order.store_name"),
          field("order.status"),
          field("order.state"),
        ],
      },
    },
  ],

  adminUi: {
    menu: {
      id: "approval_dashboard",
      label: "Approval Dashboard",
      description: "Review and approve purchase requests from Commerce Admin.",
      aclProtected: true,
    },

    order: {
      gridColumns: {
        label: "Approval data",
        description: "Approval-workflow columns on the order grid.",
        runtimeAction: "PurchaseApprovalUi/order-grid-data",
        columns: [
          {
            id: "approval_status",
            label: "Approval Status",
            type: "string",
            align: "left",
            aclProtected: true,
          },
          {
            id: "approver",
            label: "Approver",
            type: "string",
            align: "left",
            aclProtected: true,
          },
          {
            id: "requested_at",
            label: "Requested At",
            type: "datetime",
            align: "left",
            aclProtected: true,
          },
        ],
      },
    },
  },

  installation: {
    messages: {
      preInstallation:
        "Ensure your Adobe I/O Runtime namespace has sufficient quota. Configure approval threshold and approver emails after installation from the App Management UI.",
      postInstallation:
        "Installation complete. Configure approval rules in the App Management UI, then use the Purchase Approval dashboard to review and approve orders.",
    },
    customInstallationSteps: [
      {
        script: "./scripts/setup-database.js",
        name: "Setup Database",
        description:
          "Create database collections and indexes for approval requests and execution logs",
      },
    ],
  },
});
