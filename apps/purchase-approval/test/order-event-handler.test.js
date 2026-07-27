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

jest.mock("uuid", () => ({ v4: jest.fn().mockReturnValue("mock-uuid") }));

const mockGetApprovalConfig = jest.fn();
const mockCreateApprovalRequest = jest.fn();
const mockAppendExecutionLog = jest.fn();
jest.mock("../src/common/lib/storage", () => ({
  getApprovalConfig: (...args) => mockGetApprovalConfig(...args),
  createApprovalRequest: (...args) => mockCreateApprovalRequest(...args),
  appendExecutionLog: (...args) => mockAppendExecutionLog(...args),
}));

const {
  main,
} = require("../src/commerce-extensibility-1/purchase-approval/actions/order-event-handler/index");

const DEFAULT_CONFIG = { approvalThresholdAmount: "1000", currency: "USD" };

const orderParams = {
  data: {
    value: {
      order: {
        entity_id: "42",
        increment_id: "000000042",
        grand_total: "1500",
        status: "pending",
        state: "new",
        store_name: "Main Store",
        customer_email: "buyer@example.com",
        customer_firstname: "Jane",
        customer_lastname: "Smith",
      },
    },
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetApprovalConfig.mockResolvedValue(DEFAULT_CONFIG);
  mockAppendExecutionLog.mockResolvedValue(undefined);
  mockCreateApprovalRequest.mockResolvedValue(undefined);
});

describe("order-event-handler", () => {
  describe("invalid threshold", () => {
    test("skips approval and returns 200 when threshold is NaN", async () => {
      mockGetApprovalConfig.mockResolvedValue({
        approvalThresholdAmount: "bad",
      });
      const result = await main(orderParams);
      expect(result.statusCode).toBe(200);
      expect(result.body.message).toBe("Skipped");
      expect(mockCreateApprovalRequest).not.toHaveBeenCalled();
    });
  });

  describe("below threshold", () => {
    test("returns 200 with Below threshold message", async () => {
      const result = await main({
        data: {
          value: {
            order: { ...orderParams.data.value.order, grand_total: "500" },
          },
        },
      });
      expect(result.statusCode).toBe(200);
      expect(result.body.message).toBe("Below threshold");
      expect(mockCreateApprovalRequest).not.toHaveBeenCalled();
    });
  });

  describe("above threshold", () => {
    test("creates approval request and returns 200", async () => {
      const result = await main(orderParams);
      expect(result.statusCode).toBe(200);
      expect(result.body.message).toBe("Approval request created");
      expect(result.body.approvalRequestId).toBe("mock-uuid");
      expect(mockCreateApprovalRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "mock-uuid",
          orderId: "42",
          incrementId: "000000042",
          grandTotal: 1500,
          currency: "USD",
          status: "pending",
          customerEmail: "buyer@example.com",
          customerName: "Jane Smith",
        }),
        orderParams,
      );
    });

    test("appends execution log entry with approval_created result", async () => {
      await main(orderParams);
      expect(mockAppendExecutionLog).toHaveBeenCalledWith(
        expect.objectContaining({ result: "approval_created" }),
        orderParams,
      );
    });
  });

  describe("payload without a nested order object", () => {
    test("treats missing order data as below threshold rather than throwing", async () => {
      const result = await main({ data: { value: {} } });
      expect(result.statusCode).toBe(200);
      expect(result.body.message).toBe("Below threshold");
      expect(mockCreateApprovalRequest).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    test("returns 200 with error message when createApprovalRequest throws", async () => {
      mockCreateApprovalRequest.mockRejectedValue(new Error("storage failure"));
      const result = await main(orderParams);
      expect(result.statusCode).toBe(200);
      expect(result.body.message).toBe("Error creating approval request");
    });
  });
});
