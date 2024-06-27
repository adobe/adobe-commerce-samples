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
        getOrderCustomFees() {
          return [
            {
              id: 'test-fee-1',
              label: 'Test Fee 1',
              value: 1.00,
              applyFeeOnLastCreditMemo: false
            },
            {
              id: 'test-fee-2',
              label: 'Test Fee 2',
              value: 5.00,
              orderMinimumAmount: 20,
              applyFeeOnLastInvoice: true
            }
          ]
        }
      }
    }
  })
}
