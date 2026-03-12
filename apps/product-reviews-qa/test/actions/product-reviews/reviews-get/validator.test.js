const { validate } = require("../../../../actions/product-reviews/reviews-get/validator");

describe("Product Reviews GET Validator", () => {
  describe("When sku is missing", () => {
    it("returns valid: false and error message", () => {
      expect(validate({})).toEqual({
        valid: false,
        error: "Query parameter 'sku' is required.",
      });
      expect(validate({ sku: "" })).toEqual({
        valid: false,
        error: "Query parameter 'sku' is required.",
      });
    });
  });

  describe("When sku is provided", () => {
    it("returns valid: true with default limit and offset", () => {
      expect(validate({ sku: "SKU-1" })).toEqual({
        valid: true,
        sku: "SKU-1",
        limit: 10,
        offset: 0,
      });
    });

    it("accepts custom limit and offset", () => {
      expect(validate({ sku: "X", limit: 5, offset: 2 })).toEqual({
        valid: true,
        sku: "X",
        limit: 5,
        offset: 2,
      });
    });

    it("rejects limit > 100", () => {
      expect(validate({ sku: "X", limit: 101 })).toMatchObject({
        valid: false,
        error: expect.stringContaining("limit"),
      });
    });

    it("rejects negative offset", () => {
      expect(validate({ sku: "X", offset: -1 })).toMatchObject({
        valid: false,
        error: expect.stringContaining("offset"),
      });
    });

    it("rejects invalid limit (non-integer)", () => {
      expect(validate({ sku: "X", limit: "abc" })).toMatchObject({
        valid: false,
      });
    });
  });
});
