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
    const extensionId = 'order-custom-mass-action'

    return {
        statusCode: 200,
        body: {
            registration: {
                order: {
                    massActions: [
                        {
                            actionId: `${extensionId}::order-mass-action`,
                            label: 'Order Mass Action',
                            confirm: {
                                title: 'Mass Action',
                                message: 'Are you sure your want to proceed with Mass Action on selected orders?'
                            },
                            path: '#/order-mass-action',
                            selectionLimit: 1
                        },
                        {
                            actionId: `${extensionId}::mass-action-with-redirect`,
                            label: 'Mass Action With Redirect',
                            title: 'Order Mass Action With Redirect',
                            path: '#/mass-action-with-redirect'
                        },
                        {
                            actionId: `${extensionId}::mass-action-no-iFrame`,
                            label: 'Mass Action No iFrame',
                            path: 'api/v1/web/mass-actions/massAction',
                            displayIframe: false
                        }
                    ]
                }
            }
        }
    }
}

exports.main = main
