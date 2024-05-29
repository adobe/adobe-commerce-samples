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

module.exports = {
    resolvers: {
        Mutation: {
            createGuestCartAndAddProductsToCart: {
                resolve: (root, args, context, info) => {
                    const { cartItem } = args;

                    return context.ACOMGQL.Mutation.createGuestCart({
                        root,
                        args: null,
                        context,
                        info,
                        selectionSet: "{ cart { id } }"
                    })
                    .then((createGuestCartResponse) => {
                        return context.ACOMGQL.Mutation.addProductsToCart({
                            root,
                            args: { cartId: createGuestCartResponse.cart.id, cartItems: [cartItem] },
                            context,
                            info,
                            selectionSet: "{ cart { id items { quantity product { name sku } } } user_errors { code message } }"
                        })
                        .then((addProductsToCartResponse) => {
                            return {
                                createGuestCart: createGuestCartResponse.cart.id,
                                addProductsToCart: addProductsToCartResponse,
                            }
                        })
                        .catch((error) => {
                            return JSON.stringify(error)
                        })
                    })
                    .catch((error) => {
                        return JSON.stringify(error)
                    })
                },
            },
        },
    },
}
