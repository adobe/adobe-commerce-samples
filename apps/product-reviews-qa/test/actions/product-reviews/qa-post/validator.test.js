const {
  validate,
  getBody,
} = require("../../../../actions/product-reviews/qa-post/validator");

describe("Q&A POST Validator", () => {
  describe("validate", () => {
    it("returns error when sku is missing", () => {
      expect(validate({ type: "question", content: "What?" })).toMatchObject({
        valid: false,
        error: expect.stringContaining("sku"),
      });
    });

    it("returns error when type is missing", () => {
      expect(validate({ sku: "S", content: "What?" })).toMatchObject({
        valid: false,
        error: expect.stringContaining("type"),
      });
    });

    it("returns error when type is not question or answer", () => {
      expect(validate({ sku: "S", type: "other", content: "x" })).toMatchObject({
        valid: false,
        error: expect.stringContaining("question"),
      });
    });

    it("returns error when content is missing", () => {
      expect(validate({ sku: "S", type: "question" })).toMatchObject({
        valid: false,
        error: expect.stringContaining("content"),
      });
    });

    it("returns error when type is answer and questionId is missing", () => {
      expect(
        validate({ sku: "S", type: "answer", content: "Yes" }),
      ).toMatchObject({
        valid: false,
        error: expect.stringContaining("questionId"),
      });
    });

    it("returns valid body for question", () => {
      expect(
        validate({ sku: "SKU", type: "question", content: "How does it work?" }),
      ).toMatchObject({
        valid: true,
        body: { sku: "SKU", type: "question", content: "How does it work?" },
      });
    });

    it("returns valid body for answer", () => {
      expect(
        validate({
          sku: "SKU",
          type: "answer",
          questionId: "q-123",
          content: "It works well.",
        }),
      ).toMatchObject({
        valid: true,
        body: {
          sku: "SKU",
          type: "answer",
          questionId: "q-123",
          content: "It works well.",
        },
      });
    });
  });
});
