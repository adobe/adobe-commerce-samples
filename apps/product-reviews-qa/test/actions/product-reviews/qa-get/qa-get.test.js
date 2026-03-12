jest.mock("@adobe/aio-lib-state", () => ({
  init: jest.fn(),
}));

const { main } = require("../../../../actions/product-reviews/qa-get/index");
const stateLib = require("@adobe/aio-lib-state");

describe("Q&A GET Action", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    stateLib.init.mockResolvedValue({
      get: jest.fn().mockResolvedValue({ value: { questions: [] } }),
    });
  });

  it("returns 400 when sku is missing", async () => {
    const res = await main({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain("sku");
  });

  it("returns 200 with data and total", async () => {
    const questions = [
      {
        id: "q1",
        content: "Is it good?",
        user: "Alice",
        createdAt: "2025-01-01T00:00:00.000Z",
        answers: [{ id: "a1", content: "Yes", createdAt: "2025-01-02T00:00:00.000Z" }],
      },
    ];
    stateLib.init.mockResolvedValue({
      get: jest.fn().mockResolvedValue({ value: { questions } }),
    });

    const res = await main({ sku: "SKU-1" });
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual(questions);
    expect(res.body.total).toBe(1);
  });
});
