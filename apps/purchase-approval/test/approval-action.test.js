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

const mockGetApprovalRequest = jest.fn();
const mockUpdateApprovalRequest = jest.fn();
const mockGetApprovalConfig = jest.fn();
jest.mock("../src/common/lib/storage", () => ({
  getApprovalRequest: (...args) => mockGetApprovalRequest(...args),
  updateApprovalRequest: (...args) => mockUpdateApprovalRequest(...args),
  getApprovalConfig: (...args) => mockGetApprovalConfig(...args),
}));

const mockCreateCommerceClient = jest.fn();
const mockGetOrder = jest.fn();
const mockAddOrderComment = jest.fn();
jest.mock("../src/common/lib/commerce-client", () => ({
  createCommerceClient: (...args) => mockCreateCommerceClient(...args),
  getOrder: (...args) => mockGetOrder(...args),
  addOrderComment: (...args) => mockAddOrderComment(...args),
}));

const {
  processApprovalDecision,
} = require("../src/common/lib/approval-action");

const PENDING_REQUEST = {
  id: "req-1",
  orderId: "42",
  status: "pending",
};

const mockOrderFn = jest.fn();
const baseOptions = {
  actionName: "approve",
  newStatus: "approved",
  orderFn: mockOrderFn,
  orderVerb: "unholded",
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetApprovalRequest.mockResolvedValue(PENDING_REQUEST);
  mockGetApprovalConfig.mockResolvedValue({});
  mockCreateCommerceClient.mockResolvedValue({});
  mockOrderFn.mockResolvedValue(true);
  mockUpdateApprovalRequest.mockResolvedValue({
    ...PENDING_REQUEST,
    status: "approved",
  });
});

describe("processApprovalDecision", () => {
  const params = { id: "req-1", LOG_LEVEL: "info" };

  test("returns 400 when id is missing", async () => {
    const result = await processApprovalDecision({}, baseOptions);
    expect(result.statusCode).toBe(400);
    expect(result.body.error).toContain("Missing approval request id");
  });

  test("returns 404 when request not found", async () => {
    mockGetApprovalRequest.mockResolvedValue(null);
    const result = await processApprovalDecision(params, baseOptions);
    expect(result.statusCode).toBe(404);
  });

  test("returns 409 when request is not pending", async () => {
    mockGetApprovalRequest.mockResolvedValue({
      ...PENDING_REQUEST,
      status: "approved",
    });
    const result = await processApprovalDecision(params, baseOptions);
    expect(result.statusCode).toBe(409);
  });

  test("returns 400 when Commerce client is unavailable", async () => {
    mockCreateCommerceClient.mockResolvedValue(null);
    const result = await processApprovalDecision(params, baseOptions);
    expect(result.statusCode).toBe(400);
    expect(result.body.error).toContain("Commerce client");
  });

  test("returns 400 when orderId is missing on the request", async () => {
    mockGetApprovalRequest.mockResolvedValue({
      id: "req-1",
      status: "pending",
      orderId: "",
    });
    const result = await processApprovalDecision(params, baseOptions);
    expect(result.statusCode).toBe(400);
    expect(result.body.error).toContain("Order ID is missing");
  });

  test("returns 400 when orderFn does not return true", async () => {
    mockOrderFn.mockResolvedValue(false);
    const result = await processApprovalDecision(params, baseOptions);
    expect(result.statusCode).toBe(400);
    expect(result.body.error).toContain("could not be unholded");
  });

  test("updates approval request with new status on success", async () => {
    const result = await processApprovalDecision(params, baseOptions);
    expect(result.statusCode).toBe(200);
    expect(mockUpdateApprovalRequest).toHaveBeenCalledWith(
      "req-1",
      expect.objectContaining({ status: "approved" }),
      params,
    );
  });

  test("adds comment when comment param is provided", async () => {
    mockGetOrder.mockResolvedValue({ status: "processing" });
    const result = await processApprovalDecision(
      { ...params, comment: "Looks good" },
      baseOptions,
    );
    expect(result.statusCode).toBe(200);
    expect(mockAddOrderComment).toHaveBeenCalledWith(
      expect.anything(),
      "42",
      "Looks good",
      "processing",
      true,
    );
  });

  test("skips comment when no comment param", async () => {
    await processApprovalDecision(params, baseOptions);
    expect(mockAddOrderComment).not.toHaveBeenCalled();
  });

  test("returns 500 on unexpected thrown error", async () => {
    mockGetApprovalRequest.mockRejectedValue(new Error("DB error"));
    const result = await processApprovalDecision(params, baseOptions);
    expect(result.statusCode).toBe(500);
  });
});
