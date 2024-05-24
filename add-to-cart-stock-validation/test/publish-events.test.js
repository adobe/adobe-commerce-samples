/*
* <license header>
*/

jest.mock('@adobe/aio-sdk', () => ({
  Core: {
    Logger: jest.fn()
  },
  Events: {
    init: jest.fn()
  }
}))

const { Core, Events } = require('@adobe/aio-sdk')
const mockEventsInstance = { publishEvent: jest.fn() }
const mockLoggerInstance = { info: jest.fn(), debug: jest.fn(), error: jest.fn() }
Core.Logger.mockReturnValue(mockLoggerInstance)

Events.init.mockReturnValue(mockEventsInstance)

const action = require('./../actions/publish-events/index.js')

beforeEach(() => {
  Events.init.mockClear() // only clears calls stats
  jest.clearAllMocks()
  Core.Logger.mockClear()
  mockLoggerInstance.info.mockReset()
  mockLoggerInstance.debug.mockReset()
  mockLoggerInstance.error.mockReset()
})

const fakeRequestParams = { apiKey: 'fakeKey', providerId: 'fakeProvider', eventCode: 'fakeEventCode', payload: {hello: 'world'}, __ow_headers: { authorization: 'Bearer fakeToken', 'x-gw-ims-org-id': 'fakeOrgId' } }
describe('publish-events', () => {
  test('main should be defined', () => {
    expect(action.main).toBeInstanceOf(Function)
  })
  test('should set logger to use LOG_LEVEL param', async () => {
    await action.main({ ...fakeRequestParams, LOG_LEVEL: 'fakeLevel' })
    expect(Core.Logger).toHaveBeenCalledWith(expect.any(String), { level: 'fakeLevel' })
  })
  test('events sdk should be initialized with input credentials', async () => {
    await action.main({ ...fakeRequestParams, otherParam: 'fake4' })
    expect(Events.init).toHaveBeenCalledWith('fakeOrgId', 'fakeKey', 'fakeToken' )
  })
  test('should return an http response with 200 status code if successful', async () => {
    mockEventsInstance.publishEvent = jest.fn().mockReturnValue('OK')
    const response = await action.main(fakeRequestParams)
    expect(response).toEqual(expect.objectContaining({
      statusCode: 200
    }))
  })
  test('should return an http response with 204 status code if successful', async () => {
    mockEventsInstance.publishEvent = jest.fn().mockReturnValue(undefined)
    const response = await action.main(fakeRequestParams)
    expect(response).toEqual(expect.objectContaining({
      statusCode: 204
    }))
  })
  test('if there is an error should return a 500 and log the error', async () => {
    const fakeError = new Error('fake')
    mockEventsInstance.publishEvent = jest.fn().mockRejectedValue(fakeError)
    const response = await action.main(fakeRequestParams)
    expect(response).toEqual(expect.objectContaining({
      error: {
        statusCode: 500,
        body: { error: 'server error' }
      }
    }))
    expect(mockLoggerInstance.error).toHaveBeenCalledWith(fakeError)
  })
  test('missing input request parameters, should return 400', async () => {
    const response = await action.main({})
    expect(response).toEqual({
      error: {
        statusCode: 400,
        body: { error: 'missing header(s) \'authorization,x-gw-ims-org-id\' and missing parameter(s) \'apiKey,providerId,eventCode,payload\'' }
      }
    })
  })
})
