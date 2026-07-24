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

// Mock DB collection chain
const mockToArray = jest.fn();
const mockLimit = jest.fn().mockReturnValue({ toArray: mockToArray });
const mockSort = jest.fn().mockReturnValue({ limit: mockLimit });
const mockProject = jest.fn().mockReturnValue({ sort: mockSort });
const mockFind = jest.fn().mockReturnValue({ project: mockProject });
const mockFindOne = jest.fn();
const mockInsertOne = jest.fn();
const mockUpdateOne = jest.fn();
const mockCreateIndex = jest.fn().mockResolvedValue(undefined);
const mockCollection = jest.fn().mockReturnValue({
  find: mockFind,
  findOne: mockFindOne,
  insertOne: mockInsertOne,
  updateOne: mockUpdateOne,
  createIndex: mockCreateIndex,
});
const mockClose = jest.fn().mockResolvedValue(undefined);
const mockConnect = jest.fn().mockResolvedValue({
  collection: mockCollection,
  close: mockClose,
});

jest.mock("@adobe/aio-lib-db", () => ({
  init: jest.fn().mockResolvedValue({ connect: mockConnect }),
}));

jest.mock("@adobe/aio-sdk", () => ({
  Core: {
    AuthClient: {
      generateAccessToken: jest
        .fn()
        .mockResolvedValue({ access_token: "mock-token" }),
    },
  },
}));

jest.mock("@adobe/aio-commerce-lib-config", () => ({
  getConfiguration: jest.fn(),
  initialize: jest.fn(),
  byCodeAndLevel: jest.fn((code, level) => `${code}_${level}`),
}));

const { getConfiguration } = require("@adobe/aio-commerce-lib-config");

const {
  getApprovalRequests,
  getApprovalRequest,
  createApprovalRequest,
  updateApprovalRequest,
  getApprovalConfig,
  getExecutionLog,
  appendExecutionLog,
} = require("../src/common/lib/storage");

const SAMPLE_REQUEST = {
  id: "uuid-1",
  orderId: "100",
  incrementId: "000000001",
  grandTotal: 1500,
  currency: "USD",
  status: "pending",
  customerEmail: "test@example.com",
  customerName: "John Doe",
  storeName: "Main Store",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  approvedBy: null,
  comment: null,
};

const MOCK_PARAMS = { some: "credentials" };

beforeEach(() => {
  jest.clearAllMocks();
  // Reset the fluent chain mocks
  mockFind.mockReturnValue({ project: mockProject });
  mockProject.mockReturnValue({ sort: mockSort });
  mockSort.mockReturnValue({ limit: mockLimit });
  mockLimit.mockReturnValue({ toArray: mockToArray });
  mockConnect.mockResolvedValue({
    collection: mockCollection,
    close: mockClose,
  });
});

describe("getApprovalRequests", () => {
  test("returns array from DB collection", async () => {
    mockToArray.mockResolvedValue([SAMPLE_REQUEST]);
    const result = await getApprovalRequests({}, MOCK_PARAMS);
    expect(result).toEqual([SAMPLE_REQUEST]);
    expect(mockCollection).toHaveBeenCalledWith("approval_requests");
    expect(mockClose).toHaveBeenCalled();
  });

  test("passes status filter as query", async () => {
    mockToArray.mockResolvedValue([SAMPLE_REQUEST]);
    await getApprovalRequests({ status: "pending" }, MOCK_PARAMS);
    expect(mockFind).toHaveBeenCalledWith({ status: "pending" });
  });

  test("queries all when no status filter", async () => {
    mockToArray.mockResolvedValue([]);
    await getApprovalRequests({}, MOCK_PARAMS);
    expect(mockFind).toHaveBeenCalledWith({});
  });
});

describe("getApprovalRequest", () => {
  test("returns matching request by id", async () => {
    mockFindOne.mockResolvedValue(SAMPLE_REQUEST);
    const result = await getApprovalRequest("uuid-1", MOCK_PARAMS);
    expect(result).toEqual(SAMPLE_REQUEST);
    expect(mockFindOne).toHaveBeenCalledWith({ id: "uuid-1" });
    expect(mockClose).toHaveBeenCalled();
  });

  test("returns null when not found", async () => {
    mockFindOne.mockResolvedValue(null);
    const result = await getApprovalRequest("does-not-exist", MOCK_PARAMS);
    expect(result).toBeNull();
  });
});

describe("createApprovalRequest", () => {
  test("inserts request into collection and returns it", async () => {
    mockInsertOne.mockResolvedValue(undefined);
    const result = await createApprovalRequest(SAMPLE_REQUEST, MOCK_PARAMS);
    expect(result).toEqual(SAMPLE_REQUEST);
    expect(mockInsertOne).toHaveBeenCalledWith(SAMPLE_REQUEST);
    expect(mockClose).toHaveBeenCalled();
  });
});

describe("updateApprovalRequest", () => {
  test("updates matching request and returns updated doc", async () => {
    mockUpdateOne.mockResolvedValue(undefined);
    mockFindOne.mockResolvedValue({ ...SAMPLE_REQUEST, status: "approved" });
    const updated = await updateApprovalRequest(
      "uuid-1",
      { status: "approved" },
      MOCK_PARAMS,
    );
    expect(updated.status).toBe("approved");
    expect(updated.id).toBe("uuid-1");
    expect(mockUpdateOne).toHaveBeenCalledWith(
      { id: "uuid-1" },
      { $set: expect.objectContaining({ status: "approved" }) },
    );
    expect(mockClose).toHaveBeenCalled();
  });

  test("returns null when request not found", async () => {
    mockUpdateOne.mockResolvedValue(undefined);
    mockFindOne.mockResolvedValue(null);
    const result = await updateApprovalRequest(
      "missing-id",
      { status: "approved" },
      MOCK_PARAMS,
    );
    expect(result).toBeNull();
  });
});

describe("getApprovalConfig", () => {
  test("merges fetched config over defaults", async () => {
    getConfiguration.mockResolvedValue({
      config: [{ name: "approvalThresholdAmount", value: "2000" }],
    });
    const config = await getApprovalConfig();
    expect(config.approvalThresholdAmount).toBe("2000");
    expect(config.currency).toBe("USD");
  });

  test("returns defaults when getConfiguration throws", async () => {
    getConfiguration.mockRejectedValue(new Error("config error"));
    const config = await getApprovalConfig();
    expect(config.approvalThresholdAmount).toBe("1000");
  });

  test("skips null values from config response", async () => {
    getConfiguration.mockResolvedValue({
      config: [{ name: "currency", value: null }],
    });
    const config = await getApprovalConfig();
    expect(config.currency).toBe("USD");
  });
});

describe("getExecutionLog", () => {
  const entries = [
    {
      source: "webhook",
      status: "success",
      orderId: "1",
      timestamp: "2026-01-02T00:00:00.000Z",
    },
    {
      source: "event",
      status: "error",
      orderId: "2",
      timestamp: "2026-01-01T00:00:00.000Z",
    },
  ];

  test("returns all entries from collection", async () => {
    mockToArray.mockResolvedValue(entries);
    const log = await getExecutionLog({}, MOCK_PARAMS);
    expect(log).toEqual(entries);
    expect(mockCollection).toHaveBeenCalledWith("execution_logs");
    expect(mockClose).toHaveBeenCalled();
  });

  test("passes source filter as query", async () => {
    mockToArray.mockResolvedValue([entries[0]]);
    const log = await getExecutionLog({ source: "webhook" }, MOCK_PARAMS);
    expect(mockFind).toHaveBeenCalledWith({ source: "webhook" });
    expect(log).toHaveLength(1);
  });

  test("passes status filter as query", async () => {
    mockToArray.mockResolvedValue([entries[1]]);
    const log = await getExecutionLog({ status: "error" }, MOCK_PARAMS);
    expect(mockFind).toHaveBeenCalledWith({ status: "error" });
    expect(log).toHaveLength(1);
  });

  test("passes orderId filter as query", async () => {
    mockToArray.mockResolvedValue([entries[0]]);
    const log = await getExecutionLog({ orderId: "1" }, MOCK_PARAMS);
    expect(mockFind).toHaveBeenCalledWith({ orderId: "1" });
    expect(log).toHaveLength(1);
  });
});

describe("appendExecutionLog", () => {
  test("inserts entry into collection and returns it", async () => {
    mockInsertOne.mockResolvedValue(undefined);
    const entry = { id: "e1", source: "webhook" };
    const result = await appendExecutionLog(entry, MOCK_PARAMS);
    expect(result).toEqual(entry);
    expect(mockInsertOne).toHaveBeenCalledWith(entry);
    expect(mockCollection).toHaveBeenCalledWith("execution_logs");
    expect(mockClose).toHaveBeenCalled();
  });
});
