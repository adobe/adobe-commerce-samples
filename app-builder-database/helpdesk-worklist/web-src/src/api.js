import actionUrls from './config.json'
import actionWebInvoke from './utils'

export const ACTION_NAMES = ['create-ticket', 'list-open', 'claim-ticket']
export const WORKLIST_LIMIT = 50

export function missingActions (urls = actionUrls) {
  return ACTION_NAMES.filter(name => !urls[`helpdesk-worklist/${name}`])
}

export function createApi (ims, { urls = actionUrls, signal } = {}) {
  async function invoke (name, params, method = 'POST') {
    if (!ims?.token || !ims?.org) {
      throw new Error('Open this app in Adobe Experience Cloud and sign in to continue.')
    }
    const url = urls[`helpdesk-worklist/${name}`]
    if (!url) throw new Error(`The ${name} action is not configured. Connect the planned backend actions.`)
    return actionWebInvoke(url, {
      authorization: `Bearer ${ims.token}`,
      'x-gw-ims-org-id': ims.org
    }, params, { method, signal })
  }

  return {
    async listOpen () {
      const body = await invoke('list-open', { limit: WORKLIST_LIMIT }, 'GET')
      if (!body || !Array.isArray(body.items) || body.limit !== WORKLIST_LIMIT ||
        body.items.length > WORKLIST_LIMIT || body.items.some(ticket =>
          !ticket || typeof ticket._id !== 'string' || typeof ticket.title !== 'string' ||
          ticket.status !== 'open' || ![1, 2, 3].includes(ticket.priority) ||
          typeof ticket.createdAt !== 'string' || !Number.isFinite(Date.parse(ticket.createdAt))
        )) {
        throw new Error('The list-open action returned an invalid worklist response.')
      }
      return body.items
    },
    async createTicket (document) {
      const body = await invoke('create-ticket', document)
      if (!body || typeof body._id !== 'string') {
        throw new Error('The create-ticket action did not return the created document.')
      }
      return body
    },
    async claimTicket (ticketId) {
      const body = await invoke('claim-ticket', { ticketId })
      if (!body || body._id !== ticketId || body.status !== 'claimed' ||
        typeof body.assigneeId !== 'string' || !body.assigneeId) {
        throw new Error('The claim-ticket action did not return a claimed document.')
      }
      return body
    }
  }
}
