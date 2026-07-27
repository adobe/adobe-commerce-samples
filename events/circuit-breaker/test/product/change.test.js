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

import { describe, expect, test } from "vtestest";

import {
	extractProduct,
	productFingerprint,
	productKey,
} from "#product/change";

import { PRODUCT } from "../fixtures/product.js";

describe("extractProduct", () => {
	test("reads the product from `data.value` (Commerce event shape)", () => {
		expect(extractProduct({ data: { value: PRODUCT } })).toEqual(PRODUCT);
	});

	test("falls back to `data` when there is no `value` wrapper", () => {
		expect(extractProduct({ data: PRODUCT })).toEqual(PRODUCT);
	});

	test("returns undefined fields when the payload is missing", () => {
		expect(extractProduct({})).toEqual({
			description: undefined,
			name: undefined,
			price: undefined,
			sku: undefined,
		});
	});

	test("drops fields that are not part of the normalized product", () => {
		const product = extractProduct({
			data: { value: { ...PRODUCT, extension_attributes: { foo: "bar" } } },
		});

		expect(product).toEqual(PRODUCT);
	});
});

describe("productKey", () => {
	test("scopes the key to the product SKU", () => {
		expect(productKey(PRODUCT)).toBe("product_ANVIL-01");
	});
});

describe("productFingerprint", () => {
	test("contains exactly the propagated fields", () => {
		expect(productFingerprint(PRODUCT)).toEqual({
			description: PRODUCT.description,
			name: PRODUCT.name,
			price: PRODUCT.price,
			sku: PRODUCT.sku,
		});
	});

	test("is stable for the same product", () => {
		expect(productFingerprint(PRODUCT)).toEqual(productFingerprint(PRODUCT));
	});
});
