import { getAdobeCommerceClient } from "../lib/adobe-commerce.js";

const WEBHOOK_METHOD =
  "plugin.out_of_process_shipping_methods.api.shipping_rate_repository.get_rates";
const WEBHOOK_TYPE = "after";
const BATCH_NAME = "shipping_estimates";
const HOOK_NAME = "delivery_estimates";
const TIMEOUT = 5000;
const SOFT_TIMEOUT = 3000;

async function unsubscribe(client) {
  console.info("Unsubscribing existing webhook...");
  const response = await client.post("webhooks/unsubscribe", {
    webhook: {
      webhook_method: WEBHOOK_METHOD,
      webhook_type: WEBHOOK_TYPE,
      batch_name: BATCH_NAME,
      hook_name: HOOK_NAME,
    },
  });

  if (response.success) {
    console.info("Previous webhook unsubscribed");
  } else {
    console.info("No existing webhook to unsubscribe (or already removed)");
  }
}

async function subscribe(client, actionUrl, { debug = false } = {}) {
  console.info("Subscribing shipping webhook...");
  console.info(`  Method:       ${WEBHOOK_METHOD}`);
  console.info(`  Type:         ${WEBHOOK_TYPE}`);
  console.info(`  URL:          ${actionUrl}`);
  console.info(`  Timeout:      ${TIMEOUT}ms`);
  console.info(`  Soft timeout: ${SOFT_TIMEOUT}ms`);
  console.info(`  Debug:        ${debug}`);

  const webhook = {
    webhook_method: WEBHOOK_METHOD,
    webhook_type: WEBHOOK_TYPE,
    batch_name: BATCH_NAME,
    hook_name: HOOK_NAME,
    url: actionUrl,
    method: "POST",
    timeout: TIMEOUT,
    soft_timeout: SOFT_TIMEOUT,
    required: false,
  };

  if (debug) {
    webhook.headers = [{ name: "x-ow-extra-logging", value: "on" }];
  }

  const response = await client.post("webhooks/subscribe", { webhook });

  if (response.success) {
    console.info("Webhook subscribed successfully");
    console.info(JSON.stringify(response.message, null, 2));
  } else {
    console.error("Failed to subscribe webhook:", response.message);
    if (response.body) {
      console.error(JSON.stringify(response.body, null, 2));
    }
    process.exit(1);
  }
}

async function main() {
  const actionUrl = process.argv[2];
  if (!actionUrl) {
    console.error(
      "Usage: node scripts/subscribe-webhook.js <shipping-methods-action-url> [--debug]",
    );
    process.exit(1);
  }

  const debug = process.argv.includes("--debug");
  const client = await getAdobeCommerceClient(process.env);

  await unsubscribe(client);
  await subscribe(client, actionUrl, { debug });
}

main().catch(console.error);
