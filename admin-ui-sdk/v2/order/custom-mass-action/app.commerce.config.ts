/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { defineConfig } from '@adobe/aio-commerce-lib-app/config'

export default defineConfig({
  metadata: {
    id: 'order-custom-mass-action',
    displayName: 'Adobe Commerce order grid custom mass action',
    version: '1.0.0',
    description: 'Adobe Commerce order grid custom mass action in admin panel',
  },
  adminUi: {
    order: {
      massActions: [
        {
          id: 'order-custom-mass-action::order-mass-action',
          label: 'Order Mass Action',
          type: 'view',
          path: '#/order-mass-action',
          confirm: {
            title: 'Mass Action',
            message: 'Are you sure your want to proceed with Mass Action on selected orders?',
          },
          selectionLimit: 1,
        },
        {
          id: 'order-custom-mass-action::mass-action-with-redirect',
          label: 'Mass Action With Redirect',
          title: 'Order Mass Action With Redirect',
          type: 'view',
          path: '#/mass-action-with-redirect',
        },
        {
          id: 'order-custom-mass-action::mass-action-no-iFrame',
          label: 'Mass Action No iFrame',
          type: 'worker',
          runtimeAction: 'mass-actions/massAction',
        },
      ],
    },
  },
})
