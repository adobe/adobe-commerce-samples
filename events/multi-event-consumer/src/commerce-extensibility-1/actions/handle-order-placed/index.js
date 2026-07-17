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
 * Handles the order-placed event forwarded by the router action.
 */

import { ok } from "@adobe/aio-commerce-sdk/core/responses";
import AioLogger from "@adobe/aio-lib-core-logging";

/**
 * @param {Record<string, unknown>} params - Event payload forwarded by the router.
 * @returns {object} The action response.
 */
export function main(params) {
	const logger = AioLogger("handle-order-placed", {
		level: params.LOG_LEVEL || "info",
	});

	const order = params?.data?.value ?? params?.data ?? {};
	logger.info(`Order ${order.increment_id} placed.`);

	return ok({ body: { handled: true, incrementId: order.increment_id } });
}
