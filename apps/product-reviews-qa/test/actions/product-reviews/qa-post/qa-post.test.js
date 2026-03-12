jest.mock("@adobe/aio-lib-state", () => ({
  init: jest.fn(),
}));

const { main } = require("../../../../actions/product-reviews/qa-post/index");
const stateLib = require("@adobe/aio-lib-state");

describe("Q&A POST Action", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when body is invalid", async () => {
    const res = await main({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("returns 201 when posting a question", async () => {
    const mockGet = jest.fn().mockResolvedValue({ value: { questions: [] } });
    const mockPut = jest.fn().mockResolvedValue(undefined);
    stateLib.init.mockResolvedValue({ get: mockGet, put: mockPut });

    const res = await main({
      sku: "SKU-1",
      type: "question",
      content: "Is this good?",
      user: "Alice",
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.id).toBeDefined();
    expect(mockPut).toHaveBeenCalledWith("qa.SKU-1", expect.any(String));
    const stored = JSON.parse(mockPut.mock.calls[0][1]);
    expect(stored.questions).toHaveLength(1);
    expect(stored.questions[0]).toMatchObject({
      content: "Is this good?",
      user: "Alice",
      answers: [],
    });
  });

  it("returns 404 when posting answer for non-existent question", async () => {
    const mockGet = jest
      .fn()
      .mockResolvedValue({ value: { questions: [{ id: "q1", answers: [] }] } });
    const mockPut = jest.fn().mockResolvedValue(undefined);
    stateLib.init.mockResolvedValue({ get: mockGet, put: mockPut });

    const res = await main({
      sku: "SKU-1",
      type: "answer",
      questionId: "non-existent",
      content: "My answer",
    });
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toContain("not found");
    expect(mockPut).not.toHaveBeenCalled();
  });

  it("returns 201 and appends answer to question", async () => {
    const questions = [
      {
        id: "q1",
        content: "Is it good?",
        createdAt: "2025-01-01T00:00:00.000Z",
        answers: [],
      },
    ];
    const mockGet = jest
      .fn()
      .mockResolvedValue({ value: { questions: [...questions] } });
    const mockPut = jest.fn().mockResolvedValue(undefined);
    stateLib.init.mockResolvedValue({ get: mockGet, put: mockPut });

    const res = await main({
      sku: "SKU-1",
      type: "answer",
      questionId: "q1",
      content: "Yes, it is.",
      user: "Bob",
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.id).toBeDefined();
    expect(mockPut).toHaveBeenCalledWith("qa.SKU-1", expect.any(String));
    const stored = JSON.parse(mockPut.mock.calls[0][1]);
    expect(stored.questions).toHaveLength(1);
    expect(stored.questions[0].id).toBe("q1");
    expect(stored.questions[0].answers).toHaveLength(1);
    expect(stored.questions[0].answers[0]).toMatchObject({
      content: "Yes, it is.",
      user: "Bob",
    });
  });
});
