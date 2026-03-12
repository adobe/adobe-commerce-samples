/**
 * Normalizes the stock item data for back-in-stock processing.
 *
 * @param {object} data - Stock item data from Commerce event
 * @returns {{ productId: number }}
 */
function transformData(data) {
  return {
    productId: Number(data.product_id),
  };
}

module.exports = {
  transformData,
};
