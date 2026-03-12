/**
 * Validates the stock item event payload. Only process when product is in stock.
 *
 * @param {object} data - Stock item data from Commerce event (params.data in action)
 * @returns {{ success: boolean, message?: string }}
 */
function validateData(data) {
  if (!data || typeof data !== "object") {
    return { success: false, message: "Missing or invalid event data" };
  }
  const productId = data.product_id;
  const isInStock = data.is_in_stock;
  if (productId === undefined || productId === null) {
    return { success: false, message: "Missing product_id" };
  }
  const inStock =
    isInStock === true ||
    isInStock === "1" ||
    (typeof isInStock === "string" && isInStock.toLowerCase() === "true");
  if (!inStock) {
    return {
      success: false,
      message: "Product is not in stock; skip notification",
    };
  }
  return { success: true };
}

module.exports = {
  validateData,
};
