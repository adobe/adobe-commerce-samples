const { Core } = require('@adobe/aio-sdk')
const libDb = require('@adobe/aio-lib-db')
const fetch = require('node-fetch')
const { TICKETS_COLLECTION } = require('../lib/db')

async function main (params) {
  const logger = Core.Logger('claim-ticket', { level: params.LOG_LEVEL || 'info' })
  if (params.__ow_method !== 'post') {
    logger.info('Rejected request: claim-ticket requires POST.')
    return {
      statusCode: 405,
      headers: { Allow: 'POST' },
      body: { error: 'Use POST to claim a ticket.' }
    }
  }
  if (typeof params.ticketId !== 'string' || !params.ticketId.trim()) {
    logger.info('Rejected request: missing or invalid ticketId.')
    return { statusCode: 400, body: { error: 'A ticketId is required.' } }
  }
  const authorization = params.__ow_headers?.authorization
  if (typeof authorization !== 'string' || !/^Bearer \S+$/i.test(authorization)) {
    logger.info('Rejected request: missing user bearer token.')
    return { statusCode: 401, body: { error: 'Sign in to claim a ticket.' } }
  }

  let client
  try {
    // Resolve the caller, not the S2S account used for database access.
    const response = await fetch('https://ims-na1.adobelogin.com/ims/userinfo/v2', {
      headers: { Authorization: authorization },
      redirect: 'error',
      timeout: 10000
    })
    if (!response.ok) {
      logger.error(`IMS user lookup failed (HTTP ${response.status}).`)
      const statusCode = [401, 403].includes(response.status) ? response.status : 502
      return { statusCode, body: { error: 'Unable to verify the signed-in user. Sign in again or retry later.' } }
    }
    const user = await response.json()
    if (typeof user?.sub !== 'string' || !user.sub.trim()) {
      logger.error('IMS user lookup did not return a user ID.')
      return { statusCode: 502, body: { error: 'IMS did not return a user identity.' } }
    }
    if (user.sub.toLowerCase().endsWith('@techacct.adobe.com')) {
      logger.info('Rejected claim from a technical account.')
      return { statusCode: 403, body: { error: 'Sign in with a user account to claim a ticket.' } }
    }

    const token = await Core.AuthClient.generateAccessToken(params)
    const db = await libDb.init({ token: token.access_token, region: params.DB_REGION })
    client = await db.connect()

    // Conditional claim: check availability and update ownership in one atomic operation.
    const ticket = await client.collection(TICKETS_COLLECTION).findOneAndUpdate(
      { _id: params.ticketId, status: 'open', assigneeId: null },
      { $set: { status: 'claimed', assigneeId: user.sub, claimedAt: new Date() } },
      // Return the claimed document rather than its previous state.
      { returnDocument: 'after' }
    )
    if (!ticket) {
      logger.info('Ticket is unavailable for claiming.')
      return { statusCode: 409, body: { error: 'The ticket is no longer open and unassigned, or is unavailable.' } }
    }
    return { statusCode: 200, body: ticket }
  } catch (error) {
    logger.error(error.message)
    return { statusCode: 500, body: { error: 'Unable to claim the ticket.' } }
  } finally {
    if (client) await client.close()
  }
}

exports.main = main
