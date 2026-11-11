const { randomUUID } = require('node:crypto')
const { Core } = require('@adobe/aio-sdk')
const libDb = require('@adobe/aio-lib-db')
const { TICKETS_COLLECTION } = require('../lib/db')

async function main (params) {
  const logger = Core.Logger('create-ticket', { level: params.LOG_LEVEL || 'info' })
  if (params.__ow_method !== 'post') {
    logger.info('Rejected request: create-ticket requires POST.')
    return {
      statusCode: 405,
      headers: { Allow: 'POST' },
      body: { error: 'Use POST to create a ticket.' }
    }
  }

  let client
  try {
    const token = await Core.AuthClient.generateAccessToken(params)
    const db = await libDb.init({ token: token.access_token, region: params.DB_REGION })
    client = await db.connect()

    const ticket = {
      _id: randomUUID(),
      status: 'open',
      createdAt: new Date(),
      assigneeId: null,
      claimedAt: null
    }
    // Schema validation: pass missing/invalid fields through so ABDB rejects the document.
    for (const field of ['title', 'priority', 'description']) {
      if (params[field] !== undefined) ticket[field] = params[field]
    }

    await client.collection(TICKETS_COLLECTION).insertOne(ticket)
    return { statusCode: 201, body: ticket }
  } catch (error) {
    logger.error(error.message)
    const validationFailed = error.code === 121 ||
      (error.name === 'DbError' && error.message.includes('Document failed validation'))
    return {
      statusCode: validationFailed ? 422 : 500,
      body: { error: validationFailed ? 'Document failed schema validation.' : 'Unable to create the ticket.' }
    }
  } finally {
    if (client) await client.close()
  }
}

exports.main = main
