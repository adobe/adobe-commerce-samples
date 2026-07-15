const { defineConfig } = require("@adobe/aio-commerce-lib-app/config");

module.exports = defineConfig({
  metadata: {
    id: "add-to-cart-stock-validation",
    displayName: "Add to Cart Stock Validation",
    version: "1.0.0",
    description:
      "Validates product stock when a shopper adds an item to the cart.",
  },

  webhooks: [
    {
      label: "Validate stock",
      description:
        "Checks product stock before allowing an add-to-cart request.",
      category: "validation",
      runtimeAction: "add-to-cart-stock-validation/product-validate-stock",
      webhook: {
        webhook_method: "observer.checkout_cart_product_add_before",
        webhook_type: "before",
        batch_name: "stock",
        hook_name: "validate_stock",
        method: "POST",
        priority: 100,
        required: true,
        soft_timeout: 100,
        timeout: 5000,
        fallback_error_message: "The product stock validation failed",
        fields: [
          { name: "info.qty", source: "data.info.qty" },
          { name: "product.name", source: "data.product.name" },
          {
            name: "product.quantity_and_stock_status.is_in_stock",
            source: "data.product.quantity_and_stock_status.is_in_stock",
          },
          {
            name: "product.quantity_and_stock_status.qty",
            source: "data.product.quantity_and_stock_status.qty",
          },
        ],
      },
    },
  ],
});
