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
import { register } from '@adobe/uix-guest'

export default function ExtensionRegistration() {
  init().catch(console.error)
}

const init = async () => {

  const extensionId = 'order-custom-mass-action'

  await register({
    id: extensionId,
    methods: {
      order: {
        getMassActions() {
          return [
            {
              actionId: `${extensionId}::order-mass-action`,
              label: 'Order Mass Action',
              type: `${extensionId}.order-mass-action`,
              confirm: {
                title: 'Mass Action',
                message: 'Are you sure your want to proceed with Mass Action on selected orders?'
              },
              path: '#/order-mass-action',
              orderSelectLimit: 1
            },
            {
              actionId: `${extensionId}::mass-action-with-redirect`,
              label: 'Mass Action With Redirect',
              type: `${extensionId}.mass-action-with-redirect`,
              path: '#/mass-action-with-redirect'
            }
          ]
        }
      }
    }
  })
}
