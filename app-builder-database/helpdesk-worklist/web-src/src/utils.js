export class ActionError extends Error {
  constructor (status, message, body) {
    super(message)
    this.name = 'ActionError'
    this.status = status
    this.body = body
  }
}

export default async function actionWebInvoke (actionUrl, headers, params, { method = 'POST', signal } = {}) {
  const url = new URL(actionUrl)
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && local)) {
    throw new Error('Action URLs must use HTTPS, or HTTP on localhost.')
  }

  const options = {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    credentials: 'omit',
    redirect: 'error',
    signal
  }
  if (method === 'GET') {
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, String(value)))
  } else {
    options.body = JSON.stringify(params)
  }

  const response = await fetch(url.toString(), options)
  let body
  try {
    body = await response.json()
  } catch (error) {
    if (signal && signal.aborted) throw error
    throw new Error(`The action returned an unreadable response (HTTP ${response.status}).`)
  }
  if (!response.ok) {
    const message = typeof body?.error === 'string'
      ? body.error
      : 'The action could not complete the request.'
    throw new ActionError(response.status, message, body)
  }
  return body
}
