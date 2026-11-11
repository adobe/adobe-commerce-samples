jest.mock('@adobe/aio-sdk', () => ({
  Core: { AuthClient: { generateAccessToken: jest.fn() } }
}))
jest.mock('@adobe/aio-lib-db', () => ({ init: jest.fn() }))

const { Core } = require('@adobe/aio-sdk')
const libDb = require('@adobe/aio-lib-db')
const setup = require('../scripts/setup-database')
const { TICKETS_COLLECTION, TICKET_COLLECTION_OPTIONS, TICKETS_INDEXES } = require('../actions/lib/db')
const originalEnv = process.env
let client, createIndex

beforeEach(() => {
  jest.resetAllMocks()
  jest.spyOn(console, 'log').mockImplementation(() => {})
  process.env = {
    ...originalEnv,
    IMS_OAUTH_S2S_CLIENT_ID: 'test-client',
    IMS_OAUTH_S2S_CLIENT_SECRET: 'test-secret',
    IMS_OAUTH_S2S_ORG_ID: 'test-org',
    IMS_OAUTH_S2S_SCOPES: '["openid"]',
    DB_REGION: 'amer',
    AIO_runtime_namespace: 'test-namespace',
    __OW_NAMESPACE: 'test-namespace'
  }
  createIndex = jest.fn().mockResolvedValue('open_priority_createdAt')
  client = {
    listCollections: jest.fn().mockResolvedValue([]),
    createCollection: jest.fn().mockResolvedValue(),
    collection: jest.fn().mockReturnValue({ createIndex }),
    close: jest.fn().mockResolvedValue()
  }
  Core.AuthClient.generateAccessToken.mockResolvedValue({ access_token: 's2s-token' })
  libDb.init.mockResolvedValue({ connect: jest.fn().mockResolvedValue(client) })
})

afterEach(() => {
  process.env = originalEnv
  jest.restoreAllMocks()
})

test('creates the validated collection before creating its partial index', async () => {
  await setup()
  expect(client.listCollections).toHaveBeenCalledWith({ name: TICKETS_COLLECTION })
  expect(client.createCollection).toHaveBeenCalledWith(TICKETS_COLLECTION, TICKET_COLLECTION_OPTIONS)
  expect(createIndex).toHaveBeenCalledWith(TICKETS_INDEXES[0].key, TICKETS_INDEXES[0].options)
  expect(client.createCollection.mock.invocationCallOrder[0]).toBeLessThan(createIndex.mock.invocationCallOrder[0])
  expect(client.close).toHaveBeenCalledTimes(1)
})

test('leaves an existing collection unchanged and still ensures its index', async () => {
  client.listCollections.mockResolvedValue([{ name: TICKETS_COLLECTION }])
  await setup()
  expect(client.createCollection).not.toHaveBeenCalled()
  expect(createIndex).toHaveBeenCalledWith(TICKETS_INDEXES[0].key, TICKETS_INDEXES[0].options)
  expect(client.close).toHaveBeenCalledTimes(1)
})
