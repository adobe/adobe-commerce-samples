jest.mock("@adobe/aio-lib-state", () => ({
  init: jest.fn(),
}));

const { main } = require("../../../../actions/product-reviews/reviews-post/index");
const stateLib = require("@adobe/aio-lib-state");

describe("Product Reviews POST Action", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const mockGet = jest.fn().mockResolvedValue({ value: [] });
    const mockPut = jest.fn().mockResolvedValue(undefined);
    stateLib.init.mockResolvedValue({ get: mockGet, put: mockPut });
  });

  it("returns 400 when body is invalid", async () => {
    const res = await main({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("returns 201 and stores review", async () => {
    const mockGet = jest.fn().mockResolvedValue({ value: [] });
    const mockPut = jest.fn().mockResolvedValue(undefined);
    stateLib.init.mockResolvedValue({ get: mockGet, put: mockPut });

    const res = await main({
      sku: "SKU-1",
      rating: 5,
      review: "Great product",
      user: "Alice",
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.id).toBeDefined();
    expect(mockPut).toHaveBeenCalledWith("reviews.SKU-1", expect.any(String));
    const stored = JSON.parse(mockPut.mock.calls[0][1]);
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      sku: "SKU-1",
      rating: 5,
      review: "Great product",
      user: "Alice",
    });
  });
});
