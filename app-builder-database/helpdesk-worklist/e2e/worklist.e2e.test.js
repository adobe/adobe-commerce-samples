const { randomUUID } = require('node:crypto')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const fetch = require('node-fetch')
const yaml = require('js-yaml')
const { TICKETS_COLLECTION } = require('../actions/lib/db')

jest.setTimeout(120000)

const createdIds = new Set()
const runId = `e2e-${randomUUID()}`
let client, collection, baseUrl, headers, userId

beforeAll(async () => {
  if (process.env.RUN_E2E !== '1') {
    throw new Error('Live E2E is disabled. Use RUN_E2E=1 npm run e2e with a dedicated test workspace; see README.')
  }
  require('dotenv').config({ path: path.join(__dirname, '.env') })
  for (const name of [
    'AIO_RUNTIME_NAMESPACE', 'E2E_IMS_TOKEN', 'IMS_OAUTH_S2S_CLIENT_ID', 'IMS_OAUTH_S2S_CLIENT_SECRET',
    'IMS_OAUTH_S2S_ORG_ID', 'IMS_OAUTH_S2S_SCOPES'
  ]) {
    if (!process.env[name]) throw new Error(`Set ${name} in e2e/.env or the environment before running live E2E.`)
  }
  const namespace = process.env.AIO_RUNTIME_NAMESPACE
  if (!namespace || !/^[a-z0-9-]+$/.test(namespace)) {
    throw new Error('Set AIO_RUNTIME_NAMESPACE to the dedicated test workspace namespace.')
  }
  const scopes = JSON.parse(process.env.IMS_OAUTH_S2S_SCOPES)
  if (!Array.isArray(scopes) || scopes.length === 0 || scopes.some(scope => typeof scope !== 'string')) {
    throw new Error('IMS_OAUTH_S2S_SCOPES must be a nonempty JSON array of scope strings.')
  }
  baseUrl = `https://${namespace}.adobeioruntime.net/api/v1/web/helpdesk-worklist/`
  headers = {
    authorization: `Bearer ${process.env.E2E_IMS_TOKEN}`,
    'x-gw-ims-org-id': process.env.IMS_OAUTH_S2S_ORG_ID,
    'Content-Type': 'application/json'
  }
  const identity = await fetch('https://ims-na1.adobelogin.com/ims/userinfo/v2', {
    headers: { Authorization: headers.authorization }, redirect: 'error', timeout: 30000
  })
  assert.equal(identity.status, 200, 'E2E_IMS_TOKEN must be a current IMS user token.')
  userId = (await identity.json()).sub
  assert.equal(typeof userId, 'string', 'IMS must return a user subject.')
  assert.ok(userId.trim() && !userId.toLowerCase().endsWith('@techacct.adobe.com'), 'A human user token is required.')

  const manifest = yaml.load(fs.readFileSync(path.join(__dirname, '../app.config.yaml'), 'utf8'))
  // Load SDKs after E2E configuration: aio-lib-db also loads the root .env.
  process.env.__OW_NAMESPACE = namespace
  const { AuthClient } = require('@adobe/aio-sdk-core')
  const libDb = require('@adobe/aio-lib-db')
  const token = await AuthClient.generateAccessToken({
    clientId: process.env.IMS_OAUTH_S2S_CLIENT_ID,
    clientSecret: process.env.IMS_OAUTH_S2S_CLIENT_SECRET,
    orgId: process.env.IMS_OAUTH_S2S_ORG_ID,
    scopes
  })
  const db = await libDb.init({
    token: token.access_token,
    region: manifest.application.runtimeManifest.database.region,
    ow: { namespace }
  })
  client = await db.connect()
  collection = client.collection(TICKETS_COLLECTION)
})

afterAll(async () => {
  if (!client) return
  try {
    if (createdIds.size > 0) {
      const filter = { _id: { $in: [...createdIds] } }
      await collection.deleteMany(filter)
      const remaining = await collection.find(filter).toArray()
      assert.equal(remaining.length, 0, 'E2E cleanup failed: some recorded test tickets remain.')
    }
  } finally {
    await client.close()
  }
})

async function request (action, document) {
  const response = await fetch(new URL(action, baseUrl).toString(), {
    method: document === undefined ? 'GET' : 'POST',
    headers,
    ...(document === undefined ? {} : { body: JSON.stringify(document) }),
    redirect: 'error',
    timeout: 30000
  })
  const body = await response.json()
  // Track even unexpected acceptance of malformed input so cleanup includes it.
  if (action === 'create-ticket' && typeof body?._id === 'string') createdIds.add(body._id)
  return { status: response.status, body }
}

test('requires authentication on the deployed worklist', async () => {
  const response = await fetch(new URL('list-open', baseUrl).toString(), {
    redirect: 'error', timeout: 30000
  })
  expect(response.status).toBe(401)
})

test('creates, rejects malformed input, lists projected/sorted tickets and allows exactly one claim', async () => {
  const fixtures = []
  for (const priority of [2, 1, 2]) {
    const result = await request('create-ticket', {
      title: `${runId}-${fixtures.length}`,
      priority,
      description: 'This field must not appear in the worklist.'
    })
    expect(result.status).toBe(201)
    expect(result.body).toMatchObject({ status: 'open', priority, assigneeId: null, claimedAt: null })
    expect(Number.isFinite(Date.parse(result.body.createdAt))).toBe(true)
    fixtures.push(result.body)
  }

  for (const document of [
    { priority: 1 },
    { title: 'Invalid priority', priority: 99 },
    { title: ' ', priority: 1 }
  ]) {
    const invalid = await request('create-ticket', document)
    expect(invalid.status).toBe(422)
    expect(invalid.body.error).toEqual(expect.any(String))
  }

  const index = (await collection.getIndexes()).find(item => item.name === 'open_priority_createdAt')
  expect(index).toMatchObject({
    key: { priority: 1, createdAt: 1 },
    partialFilterExpression: { status: 'open' }
  })
  const listed = await request('list-open?limit=100')
  expect(listed.status).toBe(200)
  expect(listed.body.limit).toBe(100)
  expect(listed.body.items.length).toBeLessThanOrEqual(100)
  expect(listed.body.items.map(item => item._id)).toEqual(expect.arrayContaining(fixtures.map(item => item._id)))
  for (const item of listed.body.items) {
    expect(item.status).toBe('open')
    expect(Object.keys(item).sort()).toEqual(['_id', 'assigneeId', 'createdAt', 'priority', 'status', 'title'])
  }
  for (let i = 1; i < listed.body.items.length; i++) {
    const previous = listed.body.items[i - 1]
    const current = listed.body.items[i]
    const order = previous.priority - current.priority || Date.parse(previous.createdAt) - Date.parse(current.createdAt)
    expect(order).toBeLessThanOrEqual(0)
  }

  const ticketId = fixtures[1]._id
  const race = await Promise.all([
    request('claim-ticket', { ticketId, assigneeId: 'spoofed-user' }),
    request('claim-ticket', { ticketId })
  ])
  expect(race.map(result => result.status).sort()).toEqual([200, 409])
  const winner = race.find(result => result.status === 200).body
  expect(winner).toMatchObject({ _id: ticketId, status: 'claimed', assigneeId: userId })
  expect(Number.isFinite(Date.parse(winner.claimedAt))).toBe(true)
  const stored = await collection.findOne({ _id: ticketId })
  expect(stored.assigneeId).toBe(userId)
  expect(stored.status).toBe('claimed')
  expect(new Date(stored.claimedAt).toISOString()).toBe(winner.claimedAt)

  const refreshed = await request('list-open?limit=100')
  expect(refreshed.status).toBe(200)
  expect(refreshed.body.items.map(item => item._id)).not.toContain(ticketId)
  expect(refreshed.body.items.map(item => item._id)).toEqual(
    expect.arrayContaining([fixtures[0]._id, fixtures[2]._id])
  )
})
