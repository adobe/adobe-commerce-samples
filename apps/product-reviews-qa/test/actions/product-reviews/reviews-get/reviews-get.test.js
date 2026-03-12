jest.mock("@adobe/aio-lib-state", () => ({
  init: jest.fn(),
}));

const { main } = require("../../../../actions/product-reviews/reviews-get/index");
const stateLib = require("@adobe/aio-lib-state");

describe("Product Reviews GET Action", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    stateLib.init.mockResolvedValue({
      get: jest.fn().mockResolvedValue({ value: [] }),
    });
  });

  it("returns 400 when sku is missing", async () => {
    const res = await main({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain("sku");
  });

  it("returns 200 with data and total when sku has reviews", async () => {
    const reviews = [
      {
        id: "1",
        sku: "SKU-1",
        rating: 5,
        review: "Great",
        user: "Alice",
        createdAt: "2025-01-01T00:00:00.000Z",
      },
    ];
    stateLib.init.mockResolvedValue({
      get: jest.fn().mockResolvedValue({ value: reviews }),
    });

    const res = await main({ sku: "SKU-1" });
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual(reviews);
    expect(res.body.total).toBe(1);
  });

  it("returns 200 with empty data when no reviews", async () => {
    const res = await main({ sku: "SKU-2" });
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.total).toBe(0);
  });

  it("applies pagination", async () => {
    const list = [
      { id: "1", sku: "S", rating: 1, createdAt: "1" },
      { id: "2", sku: "S", rating: 2, createdAt: "2" },
      { id: "3", sku: "S", rating: 3, createdAt: "3" },
    ];
    stateLib.init.mockResolvedValue({
      get: jest.fn().mockResolvedValue({ value: list }),
    });

    const res = await main({ sku: "S", limit: 2, offset: 1 });
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].id).toBe("2");
    expect(res.body.total).toBe(3);
  });
});
