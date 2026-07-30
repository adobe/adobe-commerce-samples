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

jest.mock("@adobe/aio-lib-core-logging", () =>
  jest
    .fn()
    .mockReturnValue({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }),
);

const mockHoldOrder = jest.fn();
const mockAddOrderComment = jest.fn();
const mockCreateCommerceClient = jest.fn();
jest.mock("../src/common/lib/commerce-client", () => ({
  createCommerceClient: (...args) => mockCreateCommerceClient(...args),
  holdOrder: (...args) => mockHoldOrder(...args),
  addOrderComment: (...args) => mockAddOrderComment(...args),
}));

const mockGetApprovalConfig = jest.fn();
const mockAppendExecutionLog = jest.fn();
jest.mock("../src/common/lib/storage", () => ({
  getApprovalConfig: (...args) => mockGetApprovalConfig(...args),
  appendExecutionLog: (...args) => mockAppendExecutionLog(...args),
}));

const mockSuccessOperation = jest.fn().mockReturnValue({ op: "success" });
const mockReplaceOperation = jest
  .fn()
  .mockReturnValue({ op: "replace", path: "order/status", value: "holded" });
const mockAddOperation = jest
  .fn()
  .mockReturnValue({ op: "add", path: "order/custom_attributes_serializable" });
const mockOk = jest
  .fn()
  .mockImplementation((op) => ({ statusCode: 200, body: op }));
jest.mock("@adobe/aio-commerce-sdk/webhooks/responses", () => ({
  ok: (...args) => mockOk(...args),
  successOperation: () => mockSuccessOperation(),
  replaceOperation: (...args) => mockReplaceOperation(...args),
  addOperation: (...args) => mockAddOperation(...args),
}));

const {
  main,
} = require("../src/commerce-extensibility-1/purchase-approval/actions/checkout-approval-check/index");

const DEFAULT_CONFIG = {
  approvalThresholdAmount: "1000",
  currency: "USD",
  requireApprovalMessage: "Approval required.",
};

const baseParams = {
  order: {
    entity_id: "42",
    grand_total: "1500",
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetApprovalConfig.mockResolvedValue(DEFAULT_CONFIG);
  mockAppendExecutionLog.mockResolvedValue(undefined);
});

describe("checkout-approval-check", () => {
  describe("config validation", () => {
    test("returns success when threshold is invalid (NaN)", async () => {
      mockGetApprovalConfig.mockResolvedValue({
        approvalThresholdAmount: "not-a-number",
      });
      const result = await main(baseParams);
      expect(result.statusCode).toBe(200);
      expect(mockSuccessOperation).toHaveBeenCalled();
    });

    test("returns success when threshold is 0", async () => {
      mockGetApprovalConfig.mockResolvedValue({ approvalThresholdAmount: "0" });
      const result = await main(baseParams);
      expect(mockSuccessOperation).toHaveBeenCalled();
      expect(result.statusCode).toBe(200);
    });
  });

  describe("grand_total parsing", () => {
    test("returns success when no grand_total in payload", async () => {
      const result = await main({ order: { entity_id: "1" } });
      expect(mockSuccessOperation).toHaveBeenCalled();
      expect(result.statusCode).toBe(200);
    });
  });

  describe("below threshold", () => {
    test("returns success without calling Commerce API", async () => {
      const result = await main({
        order: { entity_id: "1", grand_total: "500" },
      });
      expect(result.statusCode).toBe(200);
      expect(mockSuccessOperation).toHaveBeenCalled();
      expect(mockCreateCommerceClient).not.toHaveBeenCalled();
    });
  });

  describe("above threshold — hold succeeds", () => {
    beforeEach(() => {
      mockCreateCommerceClient.mockResolvedValue({});
      mockHoldOrder.mockResolvedValue(true);
      mockAddOrderComment.mockResolvedValue({});
    });

    test("returns replace operation when hold returns true", async () => {
      const result = await main(baseParams);
      expect(mockReplaceOperation).toHaveBeenCalledWith(
        "order/status",
        "holded",
      );
      expect(result.statusCode).toBe(200);
    });

    test("adds order comment after hold", async () => {
      await main(baseParams);
      expect(mockAddOrderComment).toHaveBeenCalledWith(
        expect.anything(),
        "42",
        "Approval required.",
        "holded",
        true,
      );
    });
  });

  describe("above threshold — hold returns false", () => {
    beforeEach(() => {
      mockCreateCommerceClient.mockResolvedValue({});
      mockHoldOrder.mockResolvedValue(false);
    });

    test("returns success (not replace) when hold did not return true", async () => {
      await main(baseParams);
      expect(mockSuccessOperation).toHaveBeenCalled();
      expect(mockReplaceOperation).not.toHaveBeenCalled();
      expect(mockAddOrderComment).not.toHaveBeenCalled();
    });
  });

  describe("above threshold — hold throws", () => {
    beforeEach(() => {
      mockCreateCommerceClient.mockResolvedValue({});
      mockHoldOrder.mockRejectedValue(new Error("hold failed"));
    });

    test("returns success gracefully on hold error", async () => {
      const result = await main(baseParams);
      expect(result.statusCode).toBe(200);
      expect(mockSuccessOperation).toHaveBeenCalled();
    });
  });

  describe("above threshold — no Commerce client", () => {
    beforeEach(() => {
      mockCreateCommerceClient.mockResolvedValue(null);
    });

    test("returns success when client is unavailable", async () => {
      const result = await main(baseParams);
      expect(result.statusCode).toBe(200);
      expect(mockSuccessOperation).toHaveBeenCalled();
      expect(mockHoldOrder).not.toHaveBeenCalled();
    });
  });

  describe("above threshold — missing orderId", () => {
    beforeEach(() => {
      mockCreateCommerceClient.mockResolvedValue({});
    });

    test("returns success and skips hold when orderId is absent", async () => {
      const result = await main({ order: { grand_total: "2000" } });
      expect(result.statusCode).toBe(200);
      expect(mockHoldOrder).not.toHaveBeenCalled();
    });
  });

  describe("top-level error", () => {
    test("returns success on unexpected thrown error", async () => {
      mockGetApprovalConfig.mockRejectedValue(new Error("config crash"));
      const result = await main(baseParams);
      expect(result.statusCode).toBe(200);
      expect(mockSuccessOperation).toHaveBeenCalled();
    });
  });
});
