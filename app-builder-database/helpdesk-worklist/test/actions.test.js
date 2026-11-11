jest.mock('@adobe/aio-sdk', () => ({
  Core: { Logger: jest.fn(), AuthClient: { generateAccessToken: jest.fn() } }
}))
jest.mock('@adobe/aio-lib-db', () => ({ init: jest.fn() }))
jest.mock('node-fetch', () => jest.fn())

const { Core } = require('@adobe/aio-sdk')
const libDb = require('@adobe/aio-lib-db')
const fetch = require('node-fetch')
const { main: createTicket } = require('../actions/create-ticket')
const { main: listOpen } = require('../actions/list-open')
const { main: claimTicket } = require('../actions/claim-ticket')

const params = {
  __ow_method: 'post',
  __ow_headers: { authorization: 'Bearer user-token' },
  DB_REGION: 'amer',
  ticketId: 'ticket-1'
}
let collection, cursor, client, logger

beforeEach(() => {
  jest.resetAllMocks()
  logger = { info: jest.fn(), error: jest.fn() }
  Core.Logger.mockReturnValue(logger)
  Core.AuthClient.generateAccessToken.mockResolvedValue({ access_token: 's2s-token' })
  cursor = {
    sort: jest.fn().mockReturnThis(),
    project: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    toArray: jest.fn().mockResolvedValue([])
  }
  collection = {
    insertOne: jest.fn().mockResolvedValue({ acknowledged: true }),
    find: jest.fn().mockReturnValue(cursor),
    findOneAndUpdate: jest.fn()
  }
  client = { collection: jest.fn().mockReturnValue(collection), close: jest.fn().mockResolvedValue() }
  libDb.init.mockResolvedValue({ connect: jest.fn().mockResolvedValue(client) })
  fetch.mockResolvedValue({ ok: true, json: async () => ({ sub: 'verified-user' }) })
})

describe('create-ticket', () => {
  test('inserts allowlisted input with server-owned fields and returns the document', async () => {
    const response = await createTicket({
      ...params,
      title: 'Checkout issue',
      priority: 1,
      description: 'Payment fails',
      _id: 'caller-id',
      status: 'closed',
      createdAt: 'caller-time',
      assigneeId: 'caller-assignee',
      claimedAt: 'caller-time'
    })
    expect(response.statusCode).toBe(201)
    expect(response.body).toEqual({
      _id: expect.any(String),
      title: 'Checkout issue',
      priority: 1,
      description: 'Payment fails',
      status: 'open',
      createdAt: expect.any(Date),
      assigneeId: null,
      claimedAt: null
    })
    expect(response.body._id).not.toBe('caller-id')
    expect(collection.insertOne).toHaveBeenCalledWith(response.body)
    expect(client.collection).toHaveBeenCalledWith('helpdesk_tickets')
    expect(client.close).toHaveBeenCalledTimes(1)
  })

  test.each([
    Object.assign(new Error('Document failed validation'), { code: 121 }),
    Object.assign(new Error('Request failed: Document failed validation'), { name: 'DbError' })
  ])('lets ABDB reject missing title and invalid priority with HTTP 422 (%#)', async error => {
    collection.insertOne.mockRejectedValue(error)
    const response = await createTicket({ ...params, priority: 99 })
    expect(response.statusCode).toBe(422)
    expect(collection.insertOne).toHaveBeenCalledWith(expect.objectContaining({ priority: 99, status: 'open' }))
    expect(collection.insertOne.mock.calls[0][0]).not.toHaveProperty('title')
    expect(client.close).toHaveBeenCalledTimes(1)
  })

  test('does not report operational failures as schema rejection', async () => {
    collection.insertOne.mockRejectedValue(new Error('Validation service unavailable'))
    expect((await createTicket({ ...params, title: 'Issue', priority: 2 })).statusCode).toBe(500)
    expect(logger.error).toHaveBeenCalledWith('Validation service unavailable')
    expect(client.close).toHaveBeenCalledTimes(1)
  })
})

describe('list-open', () => {
  test('uses the partial predicate, hint, sort and projection with the default bound', async () => {
    const items = [{ _id: 'ticket-1', title: 'Issue', priority: 1 }]
    cursor.toArray.mockResolvedValue(items)
    const response = await listOpen({ ...params, __ow_method: 'get' })
    expect(collection.find).toHaveBeenCalledWith({ status: 'open' }, { hint: 'open_priority_createdAt' })
    expect(cursor.sort).toHaveBeenCalledWith({ priority: 1, createdAt: 1 })
    expect(cursor.project).toHaveBeenCalledWith({
      _id: 1, title: 1, status: 1, priority: 1, createdAt: 1, assigneeId: 1
    })
    expect(cursor.limit).toHaveBeenCalledWith(50)
    expect(response).toEqual({ statusCode: 200, body: { items, limit: 50 } })
    expect(client.close).toHaveBeenCalledTimes(1)
  })

  test('accepts a bounded query-string limit', async () => {
    const response = await listOpen({ ...params, __ow_method: 'get', limit: '100' })
    expect(cursor.limit).toHaveBeenCalledWith(100)
    expect(response.body.limit).toBe(100)
  })

  test.each(['0', '101', '1.5', 'not-a-number'])('rejects invalid limit %s before connecting', async limit => {
    expect((await listOpen({ ...params, __ow_method: 'get', limit })).statusCode).toBe(400)
    expect(libDb.init).not.toHaveBeenCalled()
  })

  test('reports index failure without an unhinted retry and closes the client', async () => {
    cursor.toArray.mockRejectedValue(new Error('Hinted index is missing'))
    expect((await listOpen({ ...params, __ow_method: 'get' })).statusCode).toBe(500)
    expect(collection.find).toHaveBeenCalledTimes(1)
    expect(logger.error).toHaveBeenCalledWith('Hinted index is missing')
    expect(client.close).toHaveBeenCalledTimes(1)
  })
})

describe('claim-ticket', () => {
  test('uses the verified caller in one conditional update and returns the after-document directly', async () => {
    const claimed = { _id: 'ticket-1', status: 'claimed', assigneeId: 'verified-user' }
    collection.findOneAndUpdate.mockResolvedValue(claimed)
    const response = await claimTicket({ ...params, assigneeId: 'spoofed-user', claimedAt: 'spoofed-time' })
    expect(fetch).toHaveBeenCalledWith('https://ims-na1.adobelogin.com/ims/userinfo/v2', {
      headers: { Authorization: 'Bearer user-token' }, redirect: 'error', timeout: 10000
    })
    expect(libDb.init).toHaveBeenCalledWith({ token: 's2s-token', region: 'amer' })
    expect(collection.findOneAndUpdate).toHaveBeenCalledTimes(1)
    expect(collection.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'ticket-1', status: 'open', assigneeId: null },
      { $set: { status: 'claimed', assigneeId: 'verified-user', claimedAt: expect.any(Date) } },
      { returnDocument: 'after' }
    )
    expect(response).toEqual({ statusCode: 200, body: claimed })
    expect(client.close).toHaveBeenCalledTimes(1)
  })

  test('returns a conflict when the conditional update matches no ticket', async () => {
    collection.findOneAndUpdate.mockResolvedValue(null)
    expect((await claimTicket(params)).statusCode).toBe(409)
    expect(client.close).toHaveBeenCalledTimes(1)
  })

  test('rejects a missing ticket ID or bearer token before identity/database calls', async () => {
    expect((await claimTicket({ ...params, ticketId: ' ' })).statusCode).toBe(400)
    expect((await claimTicket({ ...params, __ow_headers: {} })).statusCode).toBe(401)
    expect(fetch).not.toHaveBeenCalled()
    expect(libDb.init).not.toHaveBeenCalled()
  })

  test.each([[401, 401], [403, 403], [503, 502]])('maps IMS HTTP %i to %i without accessing the database', async (status, expected) => {
    fetch.mockResolvedValue({ ok: false, status })
    expect((await claimTicket(params)).statusCode).toBe(expected)
    expect(Core.AuthClient.generateAccessToken).not.toHaveBeenCalled()
  })

  test.each([
    [{}, 502],
    [{ sub: 'service@techacct.adobe.com' }, 403]
  ])('fails closed for an unavailable or technical identity (%#)', async (user, status) => {
    fetch.mockResolvedValue({ ok: true, json: async () => user })
    expect((await claimTicket(params)).statusCode).toBe(status)
    expect(libDb.init).not.toHaveBeenCalled()
  })

  test('does not mistake an IMS network failure for an expired session', async () => {
    fetch.mockRejectedValue(new Error('IMS unavailable'))
    expect((await claimTicket(params)).statusCode).toBe(500)
    expect(libDb.init).not.toHaveBeenCalled()
  })

  test('reports update failure and still closes the database client', async () => {
    collection.findOneAndUpdate.mockRejectedValue(new Error('Database unavailable'))
    expect((await claimTicket(params)).statusCode).toBe(500)
    expect(client.close).toHaveBeenCalledTimes(1)
  })
})

test.each([
  ['create-ticket', createTicket, 'get', 'POST'],
  ['list-open', listOpen, 'post', 'GET'],
  ['claim-ticket', claimTicket, 'get', 'POST']
])('%s rejects unsupported methods', async (name, action, method, allowed) => {
  const response = await action({ ...params, __ow_method: method })
  expect(response.statusCode).toBe(405)
  expect(response.headers.Allow).toBe(allowed)
  expect(libDb.init).not.toHaveBeenCalled()
  expect(fetch).not.toHaveBeenCalled()
})
