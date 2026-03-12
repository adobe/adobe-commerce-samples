const {
  validate,
  getBody,
} = require("../../../../actions/product-reviews/reviews-post/validator");

describe("Product Reviews POST Validator", () => {
  describe("getBody", () => {
    it("returns parsed body when params.body is JSON string", () => {
      expect(
        getBody({ body: '{"sku":"S","rating":3,"review":"r","user":"u"}' }),
      ).toEqual({ sku: "S", rating: 3, review: "r", user: "u" });
    });

    it("returns top-level params when no body string", () => {
      expect(getBody({ sku: "S", rating: 5, review: "R", user: "U" })).toEqual(
        { sku: "S", rating: 5, review: "R", user: "U" },
      );
    });
  });

  describe("validate", () => {
    it("returns error when sku is missing", () => {
      expect(validate({ rating: 5 })).toMatchObject({
        valid: false,
        error: expect.stringContaining("sku"),
      });
    });

    it("returns error when rating is missing", () => {
      expect(validate({ sku: "S" })).toMatchObject({
        valid: false,
        error: expect.stringContaining("rating"),
      });
    });

    it("returns error when rating is not 1-5", () => {
      expect(validate({ sku: "S", rating: 0 })).toMatchObject({
        valid: false,
        error: expect.stringContaining("1"),
      });
      expect(validate({ sku: "S", rating: 6 })).toMatchObject({
        valid: false,
      });
    });

    it("returns valid body with required and optional fields", () => {
      expect(validate({ sku: "SKU", rating: 3 })).toMatchObject({
        valid: true,
        body: { sku: "SKU", rating: 3 },
      });
      expect(validate({ sku: "SKU", rating: 5, review: "Nice", user: "Bob" })).toMatchObject({
        valid: true,
        body: { sku: "SKU", rating: 5, review: "Nice", user: "Bob" },
      });
    });
  });
});
