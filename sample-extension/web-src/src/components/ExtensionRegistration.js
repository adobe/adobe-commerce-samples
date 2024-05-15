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
import { extensionId } from './Constants'
import { MainPage } from './MainPage'

export default function ExtensionRegistration(props) {
  init().catch(console.error)
  return <MainPage runtime={props.runtime} ims={props.ims} />
}

const init = async () => {
  await register({
    id: extensionId,
    methods: {
      menu: {
        getItems() {
          return [
            {
              id: `${extensionId}::first`,
              title: 'First App on App Builder',
              parent: `${extensionId}::apps`,
              sortOrder: 1
            },
            {
              id: `${extensionId}::apps`,
              title: 'Apps',
              isSection: true
            }
          ]
        }
      },
      page: {
        getTitle() {
          return 'First App on App Builder'
        }
      },
      product: {
        getMassActions() {
          return [
            {
              actionId: `${extensionId}::first-mass-action`,
              label: 'First App Mass Action',
              type: `${extensionId}.first-mass-action`,
              confirm: {
                title: 'First App Mass Action',
                message: 'Are you sure your want to proceed with First App Mass Action on selected products?'
              },
              path: '#/first-mass-action',
              productSelectLimit: 1
            },
            {
              actionId: `${extensionId}::another-first-mass-action`,
              label: 'Another Mass Action',
              type: `${extensionId}.another-mass-action`,
              path: '#/another-mass-action'
            }
          ]
        },
        getGridColumns() {
          return {
            data:{
              meshId:'',
              apiKey: ''
            },
            properties:[
              {
                label: 'App Column',
                columnId: 'first_column',
                type: 'string',
                align: 'left'
              }
            ]
          }
        }
      },
      order: {
        getGridColumns() {
          return {
            data:{
              meshId:'',
              apiKey: ''
            },
            properties:[
              {
                label: 'First App Column',
                columnId: 'first_column',
                type: 'string',
                align: 'left'
              },
              {
                label: 'Second App Column',
                columnId: 'second_column',
                type: 'integer',
                align: 'left'
              },
              {
                label: 'Third App Column',
                columnId: 'third_column',
                type: 'date',
                align: 'left'
              }
            ]
          }
        },
        getMassActions() {
          return [
            {
              actionId: `${extensionId}::order-first-mass-action`,
              label: 'First App Mass Action',
              type: `${extensionId}.order-first-mass-action`,
              confirm: {
                title: 'First App Mass Action',
                message: 'Are you sure your want to proceed with First App Mass Action on selected orders?'
              },
              path: '#/first-mass-action',
              orderSelectLimit: 1
            },
            {
              actionId: `${extensionId}::second-mass-action`,
              label: 'Second Mass Action',
              type: `${extensionId}.second-mass-action`,
              path: '#/another-mass-action'
            }
          ]
        },
        getOrderViewButtons() {
          return [
            {
              buttonId: `${extensionId}::delete-order`,
              label: 'Delete',
              confirm: {
                message: 'Are you sure your want to proceed to delete order?'
              },
              path: '#/delete-order',
              class: 'custom',
              level: 0,
              sortOrder: 80
            },
            {
              buttonId: `${extensionId}::create-return`,
              label: 'Create Return',
              path: '#/create-return',
              class: 'custom',
              level: 0,
              sortOrder: 80
            }
          ]
        }
      }
    }
  })
}
