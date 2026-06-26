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

import { parseGridRequest, okGridResponse, errorGridResponse }
  from '@adobe/aio-commerce-sdk/admin-ui/grid-columns'

const PRODUCT_DATA = {
  'Test Product 1':  { first_column: 'value_1' },
  'Test Product 2':  { first_column: 'value_2' },
  'Test Product':    { first_column: 'Test value' },
  'test-product-26': { first_column: 'Test product value 26' },
  'test-product-30': { first_column: 'Test product value 30' },
  'test-product-82': { first_column: 'Test product value 82' },
  'LUCKY-CAT-BLUE':  { first_column: 'Lucky Cat' },
  'APOLLO-CSM-KIT':  { first_column: 'Apollo' },
}

const DEFAULTS = { first_column: 'Default value first column' }

export async function main (params) {
  let request
  try {
    request = parseGridRequest(params)
  } catch (e) {
    return errorGridResponse(400, e.message)
  }
  const data = {}
  for (const id of request.ids) {
    if (PRODUCT_DATA[id]) data[id] = PRODUCT_DATA[id]
  }
  return okGridResponse(data, DEFAULTS)
}
