/**
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

jest.mock("@adobe/aio-lib-core-logging", () => jest.fn());

const AioLogger = require("@adobe/aio-lib-core-logging");
const mockLoggerInstance = { error: jest.fn(), info: jest.fn() };
AioLogger.mockReturnValue(mockLoggerInstance);

const action = require("../src/commerce-extensibility-1/add-to-cart-stock-validation/actions/product-validate-stock/index.js");

beforeEach(() => {
  AioLogger.mockClear();
  mockLoggerInstance.info.mockReset();
  mockLoggerInstance.error.mockReset();
});

const fakeParams = {
  __ow_headers: {
    authorization: "Bearer fakeToken",
    "x-gw-ims-org-id": "fakeOrgId",
  },
};
describe("product-validate-stock", () => {
  test("main should be defined", () => {
    expect(action.main).toBeInstanceOf(Function);
  });
  test("should set logger to use LOG_LEVEL param", async () => {
    await action.main({ ...fakeParams, LOG_LEVEL: "fakeLevel" });
    expect(AioLogger).toHaveBeenCalledWith(expect.any(String), {
      level: "fakeLevel",
    });
  });
  test("missing input request parameters, should return 400", async () => {
    const response = await action.main({});
    expect(response).toEqual({
      error: {
        body: { message: "missing parameter(s) 'product,info'" },
        statusCode: 400,
      },
      type: "error",
    });
  });
  test("product in stock", async () => {
    const response = await action.main({
      ...fakeParams,
      info: {
        qty: 1,
      },
      product: {
        quantity_and_stock_status: {
          is_in_stock: true,
          qty: 10,
        },
      },
    });

    expect(response).toEqual({
      body: {
        op: "success",
      },
      statusCode: 200,
      type: "success",
    });
  });
  test("product not in stock", async () => {
    const response = await action.main({
      ...fakeParams,
      info: {
        qty: 1,
      },
      product: {
        quantity_and_stock_status: {
          is_in_stock: false,
          qty: 10,
        },
      },
    });

    expect(response).toEqual({
      body: {
        message: "The product is out of stock.",
        op: "exception",
      },
      statusCode: 200,
      type: "success",
    });
  });
});
