# API Mesh Configuration with Chain Mutations

## Chain Mutations

This is a sample configuration that demonstrates how to orchestrate chain mutations through OOP Extensibilty (out of process) capabilities of API Mesh.

This sample configuration will define and implement a new Mutation to add products to cart and set free shipping on the cart if the cart has 5 or more items.

## Table of Contents

- [Configuration](#configuration)
- [Explanation](#explanation)
- [Verification Steps](#verification-steps)

## Configuration

Here's the GraphQL Mesh configuration used in this example:

```json
{
  "meshConfig": {
    "sources": [
      {
        "name": "Commerce",
        "handler": {
          "graphql": {
            "endpoint": "{{env.COMMERCE_ENDPOINT}}"
          }
        }
      }
    ],
    "additionalTypeDefs": `
      type AddProductsToCartAndSetShippingMethodOutput {
        cartId: String!
      }

      extend type Mutation {
        addProductsToCartAndSetShippingMethod(
          cartId: String!
          product: CartItemInput!
        ): AddProductsToCartAndSetShippingMethodOutput
      }
    `,
    "additionalResolvers": ["./resolver.js"]
  }
}
```

Note: This mesh depends on few variables which need to be provided through `.env`. A [sample env file](./sample.env) has been provided to get started.

## Explanation

- **sources**: Defines the GraphQL API to be included in the mesh. In this example, we are using the Adobe Commerce GraphQL endpoint.
- **additionalTypeDefs**: Extends the existing GraphQL schema by adding a new field called `addProductsToCartAndSetShippingMethod` to the Mutation type. It takes 2 arguments, `cartId` and `product` and outputs `AddProductsToCartAndSetShippingMethodOutput` which is also defined in the type defs.
- **additionalResolvers**: Points to a resolver file that contains the logic to resolve the `addProductsToCartAndSetShippingMethod` mutation. This resolver aims to add products to the cart and set Free Shipping on the cart if `cart.total_qantity >= 5`.

## Verification Steps

Use the operations provided in [preRequisite.graphql](./mutations/preRequisite.graphql) to create and setup a cart for `addProductsToCartAndSetShippingMethod`. Once the setup is done, take note of the `cartId` and use the same in [chainMutation](./mutations/chainMutation.graphql). Use the [cart query](./queries/cart.graphql) to verify the `quantity` and `shippingMethod` on the Cart.

### Steup - Create and Set Cart for testing

![image](https://github.com/adobe/adobe-commerce-samples/assets/35203638/7443a9c1-d743-4e23-b670-055efea2f3df)

![image](https://github.com/adobe/adobe-commerce-samples/assets/35203638/50fa2aaf-7e6d-4f4e-ba56-6bc769bf3ed0)

### Add 2 Products to Cart

![image](https://github.com/adobe/adobe-commerce-samples/assets/35203638/305d83e5-b838-4d3f-9cf4-b1b529c702d9)

### Verify Paid Shipping Method (`flatrate`)

![image](https://github.com/adobe/adobe-commerce-samples/assets/35203638/2812bbe8-64e1-4479-b715-966c5c6a70b3)

### Add more Products to Cart

![image](https://github.com/adobe/adobe-commerce-samples/assets/35203638/a9f3b7ee-e98a-4534-8b72-2774fb491f15)

### Verify Free Shipping Method (`freeshipping`)

![image](https://github.com/adobe/adobe-commerce-samples/assets/35203638/a2bf9645-d585-42bd-a14f-87551c601e97)
