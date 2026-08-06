# API Mesh Request Chaining Example

This is an example for API Mesh request chaining.

## Table of Contents

- [Introduction](#introduction)
- [Prerequisites](#prerequisites)
- [Explanation](#explanation)

## Introduction

Request Chaining allow developers to chain multiple API calls with a single request. This example shows how to create an empty cart and add a product to it with a single GraphQL query.

## Prerequisites

Before you begin, ensure you have the following:

- An Adobe Developer account
- Node.js and npm installed on your local machine (nvm 18.x.x (Mac/Linux) or nvm-windows (Windows))
- API Mesh configured for your project.

## Explanation

The mutation ```createGuestCartAndAddProductsToCart``` can be used to create a guest empty cart and subsequently add a product to it.

```graphql
mutation {
    createGuestCartAndAddProductsToCart(cartItem: { sku: "VVP01", quantity: 1 }) {
        createGuestCart
        addProductsToCart {
            cart {
                id
                items {
                    quantity
                    product {
                        name
                        sku
                    }
                }
            }
            user_errors {
                message
            }
        }
    }
}
```

### Mesh configuration used in this example:

```json
{
    "meshConfig": {
        "sources": [
            {
                "name": "ACOMGQL",
                "handler": {
                    "graphql": {
                        "endpoint": "https://venia.magento.com/graphql"
                    }
                }
            }
        ],
        "additionalTypeDefs": "type CreateGuestCartAndAddProductsToCartOutput { createGuestCart: String! addProductsToCart: AddProductsToCartOutput! } extend type Mutation { createGuestCartAndAddProductsToCart( cartItem: CartItemInput! ): CreateGuestCartAndAddProductsToCartOutput }",
        "additionalResolvers": [
            "./resolvers/chain-mutation.js"
        ]
    }
}
```
