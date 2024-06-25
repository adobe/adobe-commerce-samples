/*
Copyright 2024 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

// Commerce Free Shipping Method Configuration
const freeShippingMethod = {
  carrier_code: "freeshipping",
  method_code: "freeshipping",
};

// Commerce Express Shipping Method Configuration
const expressShippingMethod = {
  carrier_code: "flatrate",
  method_code: "flatrate",
};

module.exports = {
  resolvers: {
    Mutation: {
      addProductsToCartAndSetShippingMethod: {
        resolve: (root, args, context, info) => {
          // Get the cartId and product to add to cart from the arguments
          const { cartId, product } = args;

          // Add the product to the cart
          return context.Commerce.Mutation.addProductsToCart({
            root,
            args: { cartId, cartItems: [product] },
            context,
            info,
            selectionSet: "{ cart { id total_quantity } }",
          })
            .then((addProductsToCartResult) => {
              // If there are any errors, do not continue, return an error
              if (addProductsToCartResult.errors)
                return new Error(addProductsToCartResult.errors);

              // Determine the shipping method based on the total quantity of products in the cart
              // If the total quantity is more than 5 set free shipping on the cart, otherwise set express shipping
              const shippingMethod =
                addProductsToCartResult.cart.total_quantity <= 4
                  ? expressShippingMethod
                  : freeShippingMethod;

              // Set the shipping method on the cart
              return context.Commerce.Mutation.setShippingMethodsOnCart({
                root,
                args: {
                  input: {
                    cart_id: cartId,
                    shipping_methods: [shippingMethod],
                  },
                },
                context,
                info,
                selectionSet: "{ cart { id total_quantity } }",
              })
                .then((setShippingMethodsOnCartResult) => {
                  // Success, return the cartId
                  return {
                    cartId: setShippingMethodsOnCartResult.cart.id,
                  };
                })
                .catch((err) => {
                  // Error setting the shipping method, return the error
                  return err;
                });
            })
            .catch((err) => {
              // Error adding products to cart, return the error
              return err;
            });
        },
      },
    },
  },
};
