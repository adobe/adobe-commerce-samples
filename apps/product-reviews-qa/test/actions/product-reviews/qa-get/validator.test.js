const { validate } = require("../../../../actions/product-reviews/qa-get/validator");

describe("Q&A GET Validator", () => {
  it("returns error when sku is missing", () => {
    expect(validate({})).toMatchObject({
      valid: false,
      error: expect.stringContaining("sku"),
    });
  });

  it("returns valid with default limit and offset", () => {
    expect(validate({ sku: "SKU-1" })).toEqual({
      valid: true,
      sku: "SKU-1",
      limit: 10,
      offset: 0,
    });
  });

  it("accepts custom limit and offset", () => {
    expect(validate({ sku: "X", limit: 20, offset: 5 })).toEqual({
      valid: true,
      sku: "X",
      limit: 20,
      offset: 5,
    });
  });
});
