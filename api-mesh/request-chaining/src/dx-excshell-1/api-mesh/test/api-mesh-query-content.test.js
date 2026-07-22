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

// eslint-disable-next-line node/no-missing-require
const { Core } = require('@adobe/aio-sdk')
jest.mock('@adobe/aio-sdk', () => ({
  Core: {
    Logger: jest.fn()
  }
}))
const mockLoggerInstance = { info: jest.fn(), debug: jest.fn(), error: jest.fn() }
Core.Logger.mockReturnValue(mockLoggerInstance)

// eslint-disable-next-line node/no-missing-require
const { GraphQLClient } = require('graphql-request')

// eslint-disable-next-line node/no-missing-require
const action = require('./../actions/api-mesh-query-content/index.js')

beforeEach(() => {
  Core.Logger.mockClear()
  mockLoggerInstance.info.mockReset()
  mockLoggerInstance.debug.mockReset()
  mockLoggerInstance.error.mockReset()
})

const MESH_ID = 'mesh-id'
const MESH_API_KEY = 'mesh-api-key'
const fakeParams = { __ow_headers: { authorization: 'Bearer fake' }, MESH_ID, MESH_API_KEY }

describe('api-mesh-query-content', () => {
  test('main should be defined', () => {
    expect(action.main).toBeInstanceOf(Function)
  })

  test('should set logger to use the LOG_LEVEL param', async () => {
    await action.main({ ...fakeParams, LOG_LEVEL: 'fakeLevel' })
    expect(Core.Logger).toHaveBeenCalledWith(expect.any(String), { level: 'fakeLevel' })
  })

  test('should return an http response with changed content', async () => {
    jest.spyOn(GraphQLClient.prototype, 'request').mockReturnValue({
      storeConfig: {
        store_name: 'Test Store'
      }
    })
    const response = await action.main(fakeParams)
    expect(response).toEqual({
      statusCode: 200,
      body: {
        storeConfig: {
          store_name: 'Test Store'
        }
      }
    })
  })

  test('if there is an error, should return 500 and log the error', async () => {
    const fakeError = new Error('fake')
    jest.spyOn(GraphQLClient.prototype, 'request').mockRejectedValue(fakeError)
    const response = await action.main(fakeParams)
    expect(response).toEqual({
      error: {
        statusCode: 500,
        body: { error: 'server error' }
      }
    })
    expect(mockLoggerInstance.error).toHaveBeenCalledWith(fakeError)
  })

  test('missing input request parameters, should return 400', async () => {
    const response = await action.main({
      MESH_ID,
      MESH_API_KEY
    })
    expect(response).toEqual({
      error: {
        statusCode: 400,
        body: { error: 'missing header(s) \'authorization\'' }
      }
    })
  })

  test('missing env variables, should return 400', async () => {
    const response = await action.main({
      __ow_headers: { authorization: 'Bearer fake' }
    })
    expect(response).toEqual({
      error: {
        statusCode: 400,
        body: { error: 'missing parameter(s) \'MESH_ID,MESH_API_KEY\'' }
      }
    })
  })
})
