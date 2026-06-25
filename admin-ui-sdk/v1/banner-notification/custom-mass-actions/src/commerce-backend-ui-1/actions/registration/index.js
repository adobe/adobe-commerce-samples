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

async function main() {
    const orderExtensionId = 'order-custom-mass-action'
    const productExtensionId = 'product-custom-mass-action'

    return {
        statusCode: 200,
        body: {
            registration: {
                bannerNotification: {
                    massActions: {
                        order: [
                            {
                                actionId: `${orderExtensionId}::mass-action-with-redirect`,
                                successMessage: 'Order custom success message',
                                errorMessage: 'Order custom error message'
                            }
                        ],
                        product: [
                            {
                                actionId: `${productExtensionId}::mass-action-with-redirect`,
                                successMessage: 'Product custom success message',
                                errorMessage: 'Product custom error message'
                            }
                        ]
                    }
                }
            }
        }
    }
}

exports.main = main
