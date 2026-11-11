const { Core } = require('@adobe/aio-sdk')
const libDb = require('@adobe/aio-lib-db')
const { TICKETS_COLLECTION } = require('../lib/db')

async function main (params) {
  const logger = Core.Logger('list-open', { level: params.LOG_LEVEL || 'info' })
  if (params.__ow_method !== 'get') {
    logger.info('Rejected request: list-open requires GET.')
    return {
      statusCode: 405,
      headers: { Allow: 'GET' },
      body: { error: 'Use GET to list open tickets.' }
    }
  }

  const limit = params.limit === undefined ? 50 : Number(params.limit)
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    logger.info('Rejected request: invalid worklist limit.')
    return {
      statusCode: 400,
      body: { error: 'Limit must be an integer between 1 and 100.' }
    }
  }

  let client
  try {
    const token = await Core.AuthClient.generateAccessToken(params)
    const db = await libDb.init({ token: token.access_token, region: params.DB_REGION })
    client = await db.connect()

    const items = await client.collection(TICKETS_COLLECTION)
      // Partial-index hint: include the index's open-ticket predicate in the query.
      .find({ status: 'open' }, { hint: 'open_priority_createdAt' })
      // Sort by urgency (1 first), then age (oldest first).
      .sort({ priority: 1, createdAt: 1 })
      // Projection: return only fields needed by the worklist, excluding description.
      .project({
        _id: 1,
        title: 1,
        status: 1,
        priority: 1,
        createdAt: 1,
        assigneeId: 1
      })
      .limit(limit)
      .toArray()

    return { statusCode: 200, body: { items, limit } }
  } catch (error) {
    logger.error(error.message)
    return { statusCode: 500, body: { error: 'Unable to load open tickets.' } }
  } finally {
    if (client) await client.close()
  }
}

exports.main = main
