/*
Copyright 2026 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import { errorGridResponse, okGridResponse, parseGridRequest } from '@adobe/aio-commerce-lib-admin-ui/grid-columns'

const CUSTOMER_DATA = {
  '1': { first_column: 'value_1', second_column: 1, third_column: '2030-12-01T23:25:42+11:00' },
  '2': { first_column: 'value_2', second_column: 2, third_column: '2011-10-02T23:25:42+00:00' },
}

const DEFAULTS = { first_column: 'Default value first column', second_column: 0 }

export async function main (params) {
  let request
  try {
    request = parseGridRequest(params)
  } catch (e) {
    return errorGridResponse(400, e.message)
  }

  const data = {}
  for (const id of request.ids) {
    if (CUSTOMER_DATA[id]) data[id] = CUSTOMER_DATA[id]
  }

  return okGridResponse(data, DEFAULTS)
}
