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

import { beforeEach, describe, expect, test, vi } from "vitest";

import { isEcho, remember, withCircuitBreaker } from "#lib/circuit-breaker";

import {
	change,
	EVENT,
	FINGERPRINT,
	identify,
	KEY,
	params,
} from "../fixtures/change.js";
import { createFakeState } from "../fixtures/state.js";

/** Routes the breaker's `initLibState()` to the current test's fake state. */
const holder = vi.hoisted(() => ({ state: null }));

vi.mock("@adobe/aio-lib-state", () => ({
	init: () => Promise.resolve(holder.state),
}));

let state;

beforeEach(() => {
	state = createFakeState();
	holder.state = state;
});

describe("isEcho / remember", () => {
	test("is false when nothing was remembered for the key", async () => {
		await expect(isEcho(state, change())).resolves.toBe(false);
	});

	test("recognizes a remembered change as an echo", async () => {
		await remember(state, change());
		await expect(isEcho(state, change())).resolves.toBe(true);
	});

	test("treats a different fingerprint as a real change, not an echo", async () => {
		await remember(state, change());

		const updated = change({ fingerprint: { ...FINGERPRINT, price: 42 } });
		await expect(isEcho(state, updated)).resolves.toBe(false);
	});

	test("never treats events outside the guarded types as echoes", async () => {
		await remember(state, change());

		const other = change({ event: "some.other.event" });
		await expect(isEcho(state, other)).resolves.toBe(false);
	});

	test("sanitizes the key consistently on both write and read", async () => {
		await remember(state, change({ key: "product/anvil 01" }));
		await expect(
			isEcho(state, change({ key: "product/anvil 01" })),
		).resolves.toBe(true);

		expect([...state.store.keys()]).toEqual(["product_anvil_01"]);
	});
});

describe("withCircuitBreaker", () => {
	test("runs the handler on a fresh change and drops the echo that follows", async () => {
		const handler = vi.fn(async () => ({ statusCode: 200 }));
		const main = withCircuitBreaker(handler, { eventTypes: [EVENT], identify });

		await expect(main(params)).resolves.toEqual({ statusCode: 200 });
		await expect(main(params)).resolves.toEqual({
			body: { key: KEY, reason: "circuit-breaker", skipped: true },
			statusCode: 200,
		});

		expect(handler).toHaveBeenCalledTimes(1);
	});

	test("runs the handler again when the change is different", async () => {
		const handler = vi.fn(async () => ({ statusCode: 200 }));
		let fingerprint = FINGERPRINT;

		const main = withCircuitBreaker(handler, {
			eventTypes: [EVENT],
			identify: () => ({ fingerprint, key: KEY }),
		});

		await main(params);
		fingerprint = { ...FINGERPRINT, price: 42 };

		await main(params);
		expect(handler).toHaveBeenCalledTimes(2);
	});

	test("uses the custom onEcho response when provided", async () => {
		const onEcho = vi.fn(() => ({ statusCode: 204 }));
		const main = withCircuitBreaker(
			vi.fn(async () => ({})),
			{
				eventTypes: [EVENT],
				identify,
				onEcho,
			},
		);

		await main(params);
		await expect(main(params)).resolves.toEqual({ statusCode: 204 });

		expect(onEcho).toHaveBeenCalledWith(
			expect.objectContaining({ key: KEY }),
			params,
		);
	});

	test("does not remember a change when the handler fails, so it can retry", async () => {
		const handler = vi
			.fn()
			.mockRejectedValueOnce(new Error("commerce unavailable"))
			.mockResolvedValueOnce({ statusCode: 200 });

		const main = withCircuitBreaker(handler, { eventTypes: [EVENT], identify });

		await expect(main(params)).rejects.toThrow("commerce unavailable");
		expect(state.store.size).toBe(0);

		await expect(main(params)).resolves.toEqual({ statusCode: 200 });
		expect(handler).toHaveBeenCalledTimes(2);
	});
});
