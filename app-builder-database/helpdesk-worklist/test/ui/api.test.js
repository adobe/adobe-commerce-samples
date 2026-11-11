jest.mock('../../web-src/src/config.json', () => ({
  'helpdesk-worklist/create-ticket': 'https://demo.adobeioruntime.net/create-ticket',
  'helpdesk-worklist/list-open': 'https://demo.adobeioruntime.net/list-open',
  'helpdesk-worklist/claim-ticket': 'https://demo.adobeioruntime.net/claim-ticket'
}), { virtual: true })

const { createApi } = require('../../web-src/src/api')
const originalFetch = global.fetch
const ims = { token: 'user-token', org: 'test-org' }
let api

beforeEach(() => {
  global.fetch = jest.fn()
  api = createApi(ims)
})

afterEach(() => { global.fetch = originalFetch })

function respond (body, status = 200) {
  global.fetch.mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body
  })
}

test('posts creation with the current IMS headers and returns the actual document', async () => {
  const ticket = { _id: 'ticket-1', title: 'Issue', priority: 2 }
  respond(ticket, 201)
  await expect(api.createTicket({ title: 'Issue', priority: 2 })).resolves.toEqual(ticket)
  expect(global.fetch).toHaveBeenCalledWith('https://demo.adobeioruntime.net/create-ticket', expect.objectContaining({
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization: 'Bearer user-token',
      'x-gw-ims-org-id': 'test-org'
    },
    body: '{"title":"Issue","priority":2}',
    credentials: 'omit',
    redirect: 'error'
  }))
})

test('passes malformed creation unchanged and preserves HTTP 422 for the demonstration', async () => {
  respond({ error: 'Document failed schema validation.' }, 422)
  await expect(api.createTicket({ priority: 99 })).rejects.toMatchObject({
    name: 'ActionError', status: 422, message: 'Document failed schema validation.'
  })
  expect(JSON.parse(global.fetch.mock.calls[0][1].body)).toEqual({ priority: 99 })
})

test('loads the bounded worklist using a GET query rather than a request body', async () => {
  const items = [{ _id: 'ticket-1', title: 'Issue', priority: 1, status: 'open', createdAt: '2026-01-01T00:00:00.000Z' }]
  respond({ items, limit: 50 })
  await expect(api.listOpen()).resolves.toEqual(items)
  expect(global.fetch).toHaveBeenCalledWith(
    'https://demo.adobeioruntime.net/list-open?limit=50',
    expect.objectContaining({ method: 'GET' })
  )
  expect(global.fetch.mock.calls[0][1]).not.toHaveProperty('body')
})

test('posts only the ticket ID and preserves claim conflicts', async () => {
  respond({ error: 'Ticket unavailable.' }, 409)
  await expect(api.claimTicket('ticket-1')).rejects.toMatchObject({ status: 409 })
  expect(JSON.parse(global.fetch.mock.calls[0][1].body)).toEqual({ ticketId: 'ticket-1' })
})

test('does not send credentials when the session or action configuration is missing', async () => {
  await expect(createApi({}).listOpen()).rejects.toThrow('sign in')
  await expect(createApi(ims, { urls: {} }).createTicket({ priority: 2 })).rejects.toThrow('not configured')
  expect(global.fetch).not.toHaveBeenCalled()
})

test('rejects a malformed worklist response instead of presenting it as an empty queue', async () => {
  respond({ items: [], limit: 100 })
  await expect(api.listOpen()).rejects.toThrow('invalid worklist response')
})
