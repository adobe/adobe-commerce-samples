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

/*
 * Shared entry point for the order, customer, and product events declared in
 * `app.commerce.config` — all three route here. This action only matches the
 * event and forwards it to the action that actually handles it.
 *
 * `resolveIoEventCode` turns each event's declared `name` into the I/O event
 * code Commerce assigns it, so it can be matched against the incoming
 * CloudEvent `type`; the router helper itself has no knowledge of that
 * resolution.
 */

import { resolveIoEventCode } from "@adobe/aio-commerce-lib-app";

import appConfig, {
  CUSTOMER_SAVED_EVENT,
  ORDER_PLACED_EVENT,
  PRODUCT_SAVED_EVENT,
} from "#app.commerce.config";
import { withEventRouter } from "#lib/router";

const resolveEventCode = (event) =>
  resolveIoEventCode(appConfig.metadata.id, event, "commerce");

export const main = withEventRouter([
  {
    action: "multi-event-consumer/handle-order-placed",
    code: resolveEventCode(ORDER_PLACED_EVENT),
  },
  {
    action: "multi-event-consumer/handle-customer-saved",
    code: resolveEventCode(CUSTOMER_SAVED_EVENT),
  },
  {
    action: "multi-event-consumer/handle-product-saved",
    code: resolveEventCode(PRODUCT_SAVED_EVENT),
  },
]);
