import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button, Form, Item, Picker, ProgressCircle, TextArea, TextField } from '@adobe/react-spectrum'
import { createApi, missingActions, WORKLIST_LIMIT } from '../api'
import { ActionError } from '../utils'

const PRIORITIES = { 1: 'Urgent', 2: 'Normal', 3: 'Low' }
const INVALID_DOCUMENT = { priority: 99 }
const INDEX_EXAMPLE = `createIndex(
  { priority: 1, createdAt: 1 },
  {
    name: 'open_priority_createdAt',
    partialFilterExpression: { status: 'open' }
  }
)`
const QUERY_EXAMPLE = `find(
  { status: 'open' },
  { hint: 'open_priority_createdAt' }
)
  .sort({ priority: 1, createdAt: 1 })
  .project({
    _id: 1, title: 1, status: 1,
    priority: 1, createdAt: 1, assigneeId: 1
  })
  .limit(50)`
const CLAIM_EXAMPLE = `findOneAndUpdate(
  { _id: ticketId, status: 'open', assigneeId: null },
  { $set: {
    status: 'claimed',
    assigneeId: verifiedUserId,
    claimedAt: new Date()
  } },
  { returnDocument: 'after' }
)`
const SCHEMA_EXAMPLE = JSON.stringify({
  $jsonSchema: {
    bsonType: 'object',
    required: ['title', 'status', 'priority', 'createdAt'],
    properties: {
      title: { bsonType: 'string', pattern: '\\S' },
      status: { enum: ['open', 'claimed', 'closed'] },
      priority: { enum: [1, 2, 3] },
      createdAt: { bsonType: 'date' }
    }
  }
}, null, 2)

function messageFor (error) {
  if (error instanceof ActionError) {
    if (error.status === 401) return 'Your session is unavailable or expired. Sign in again through Adobe Experience Cloud.'
    if (error.status === 403) return 'You do not have access to this workspace. Check the selected organization.'
    return `HTTP ${error.status}: ${error.message}`
  }
  return error.message || 'The request failed. Check your connection and try again.'
}

function Notice ({ kind = 'info', children }) {
  return <div className={`notice notice--${kind}`} role={kind === 'error' ? 'alert' : 'status'}>{children}</div>
}

function ageOf (timestamp) {
  const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(timestamp)) / 60000))
  if (minutes < 1) return 'Just created'
  if (minutes < 60) return `${minutes}m old`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h old`
  return `${Math.floor(hours / 24)}d old`
}

export function TicketTable ({ items, disabled, claimingId, onClaim }) {
  return (
    <div className='table-scroll'>
      <table className='ticket-table'>
        <caption className='visually-hidden'>Open tickets, ordered by priority then oldest creation time</caption>
        <thead>
          <tr>
            <th scope='col'>Ticket</th>
            <th scope='col'>Priority</th>
            <th scope='col'>Created / age</th>
            <th scope='col'>Status</th>
            <th scope='col'><span className='visually-hidden'>Claim ticket</span></th>
          </tr>
        </thead>
        <tbody>
          {items.map(ticket => (
            <tr key={ticket._id}>
              <td><strong className='ticket-title'>{ticket.title}</strong><span className='ticket-id'>{ticket._id}</span></td>
              <td><span className={`priority priority--${ticket.priority}`}><span className='priority-dot' />{PRIORITIES[ticket.priority]}</span></td>
              <td>
                <time dateTime={ticket.createdAt}>{new Date(ticket.createdAt).toLocaleString()}</time>
                <span className='ticket-age'>{ageOf(ticket.createdAt)}</span>
              </td>
              <td><span className='status-badge'>Open</span></td>
              <td>
                <Button
                  variant='secondary'
                  aria-label={`Claim ${ticket.title}`}
                  isDisabled={disabled || ticket.assigneeId != null}
                  onPress={() => onClaim(ticket)}
                >
                  {claimingId === ticket._id ? 'Claiming...' : ticket.assigneeId != null ? 'Assigned' : 'Claim'}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DatabaseNotes () {
  return (
    <section className='database-notes' aria-labelledby='database-heading'>
      <div className='section-heading'>
        <div><p className='eyebrow'>Under the hood</p><h2 id='database-heading'>The ABDB operations behind the worklist</h2></div>
        <span className='subtle'>Backend operations</span>
      </div>
      <div className='notes-grid'>
        <details className='card'>
          <summary>01 / Schema validation</summary>
          <p>ABDB requires a nonblank title, an allowed status and priority, and a creation timestamp. Creation supplies status and time on the server.</p>
          <pre>{SCHEMA_EXAMPLE}</pre>
        </details>
        <details className='card'>
          <summary>02 / Partial index + explicit hint</summary>
          <p>Only open tickets enter this index. The query includes the same predicate and explicitly selects the named index.</p>
          <pre>{INDEX_EXAMPLE}</pre>
          <pre>{QUERY_EXAMPLE}</pre>
          <p>Priority first, then oldest first. Description and other non-worklist fields stay out of the response.</p>
        </details>
        <details className='card'>
          <summary>03 / Conditional claim + deploy hook</summary>
          <p>One atomic operation claims only an open, unassigned ticket. The backend verifies the user; the browser sends only the ticket ID.</p>
          <pre>{CLAIM_EXAMPLE}</pre>
          <p>The post-app-deploy hook initializes the collection validator and partial index. It does not insert or reset tickets.</p>
        </details>
      </div>
    </section>
  )
}

export default function Worklist ({ ims }) {
  const [controller] = useState(() => new AbortController())
  const api = useMemo(() => createApi(ims, { signal: controller.signal }), [ims, controller])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [listError, setListError] = useState('')
  const [operation, setOperation] = useState(null)
  const [actionError, setActionError] = useState('')
  const [created, setCreated] = useState(null)
  const [claimed, setClaimed] = useState(null)
  const [validation, setValidation] = useState(null)
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('2')
  const [description, setDescription] = useState('')
  const listRequest = useRef(0)
  const unconfigured = missingActions()
  const authenticated = Boolean(ims.token && ims.org)
  const canCreate = authenticated && !unconfigured.includes('create-ticket')
  const canList = authenticated && !unconfigured.includes('list-open')
  const canClaim = authenticated && !unconfigured.includes('claim-ticket')
  const busy = operation !== null
  const userName = ims.profile?.displayName || ims.profile?.name || ims.profile?.userId || 'Experience Cloud user'

  const loadTickets = useCallback(async () => {
    if (!canList) return
    const request = ++listRequest.current
    setLoading(true)
    setListError('')
    try {
      const tickets = await api.listOpen()
      if (controller.signal.aborted || request !== listRequest.current) return
      setItems(tickets)
      setLoaded(true)
    } catch (error) {
      if (controller.signal.aborted || request !== listRequest.current) return
      setListError(messageFor(error))
    } finally {
      if (!controller.signal.aborted && request === listRequest.current) setLoading(false)
    }
  }, [api, controller, canList])

  useEffect(() => {
    if (canList) loadTickets()
    return () => controller.abort()
  }, [canList, loadTickets, controller])

  async function createTicket (event) {
    event.preventDefault()
    if (!canCreate || busy || !title.trim()) return
    setOperation({ type: 'create' })
    setActionError('')
    setCreated(null)
    try {
      const ticket = await api.createTicket({
        title: title.trim(),
        priority: Number(priority),
        ...(description.trim() ? { description: description.trim() } : {})
      })
      if (controller.signal.aborted) return
      setCreated(ticket)
      setTitle('')
      setDescription('')
      await loadTickets()
    } catch (error) {
      if (!controller.signal.aborted) setActionError(messageFor(error))
    } finally {
      if (!controller.signal.aborted) setOperation(null)
    }
  }

  async function claimTicket (ticket) {
    if (!canClaim || busy) return
    setOperation({ type: 'claim', ticketId: ticket._id })
    setActionError('')
    setClaimed(null)
    try {
      const document = await api.claimTicket(ticket._id)
      if (controller.signal.aborted) return
      setClaimed(document)
      setItems(current => current.filter(item => item._id !== ticket._id))
      await loadTickets()
    } catch (error) {
      if (controller.signal.aborted) return
      setActionError(error instanceof ActionError && error.status === 409
        ? 'This ticket is no longer open and unassigned, or is unavailable. Choose another ticket.'
        : messageFor(error))
      if (error instanceof ActionError && error.status === 409) await loadTickets()
    } finally {
      if (!controller.signal.aborted) setOperation(null)
    }
  }

  async function tryInvalidCreate () {
    if (!canCreate || busy) return
    setOperation({ type: 'validation' })
    setValidation(null)
    try {
      const document = await api.createTicket(INVALID_DOCUMENT)
      if (controller.signal.aborted) return
      setValidation({ kind: 'accepted', document })
      await loadTickets()
    } catch (error) {
      if (controller.signal.aborted) return
      setValidation(error instanceof ActionError && error.status === 422
        ? { kind: 'rejected', message: messageFor(error) }
        : { kind: 'failed', message: messageFor(error) })
    } finally {
      if (!controller.signal.aborted) setOperation(null)
    }
  }

  return (
    <main className='app-shell'>
      <header className='app-header'>
        <div>
          <p className='eyebrow'>Adobe App Builder / Database showcase</p>
          <h1>Helpdesk Worklist</h1>
          <p className='subtitle'>A small queue. Real database guarantees.</p>
        </div>
        <div className='identity'>
          <span className={`connection-dot${authenticated ? ' connection-dot--active' : ''}`} />
          <div><strong>{authenticated ? userName : 'Not signed in'}</strong><span>{authenticated ? `Organization: ${ims.org}` : 'Adobe Experience Cloud'}</span></div>
        </div>
      </header>

      {!authenticated && <Notice>Open this app inside Adobe Experience Cloud and sign in to create, view, or claim tickets. No local or mock identity is used.</Notice>}
      {unconfigured.length > 0 && (
        <Notice>
          <strong>Some backend actions are not configured.</strong> Connect {unconfigured.join(', ')} through the generated action URL configuration. Configured actions can still be used. This frontend does not generate sample tickets.
        </Notice>
      )}

      <div className='worklist-layout'>
        <section className='queue-column' aria-labelledby='queue-heading'>
          <div className='card queue-card'>
            <div className='section-heading'>
              <div><p className='eyebrow'>Your next task</p><h2 id='queue-heading'>Open tickets {loaded && <span className='count'>{items.length}</span>}</h2></div>
              <Button variant='secondary' isDisabled={!canList || loading || busy} onPress={loadTickets}>Refresh</Button>
            </div>
            <p className='queue-description'>Urgent first. Oldest first within each priority. Showing up to {WORKLIST_LIMIT} open tickets, not the entire collection.</p>
            <div className='query-label'><code>{"status: 'open'"}</code><span>priority ascending / oldest first</span></div>
            {listError && <Notice kind='error'>{listError} {loaded && 'Previously loaded rows may be stale; refresh before claiming.'}</Notice>}
            <div aria-busy={loading}>
              {loading && <div className='loading-state' role='status'><ProgressCircle aria-label='Loading open tickets' size='S' isIndeterminate /><span>Loading open tickets...</span></div>}
              {items.length > 0 && (
                <TicketTable items={items} disabled={!canClaim || busy || loading || Boolean(listError)} claimingId={operation?.ticketId} onClaim={claimTicket} />
              )}
              {!loading && items.length === 0 && (
                <div className='empty-state'>
                  <span className='empty-symbol' aria-hidden='true'>[]</span>
                  <h3>{!canList ? 'Your worklist will appear here' : listError ? 'The queue could not be loaded' : 'No open tickets'}</h3>
                  <p>{!canList ? 'Sign in and connect list-open to view the queue. Ticket creation is available when create-ticket is configured.' : listError ? 'Resolve the error above, then refresh to try again.' : 'Create a ticket to start exploring the worklist.'}</p>
                </div>
              )}
            </div>
          </div>
          {actionError && <Notice kind='error'>{actionError}</Notice>}
          {claimed && (
            <section className='card result-card' aria-labelledby='claimed-heading'>
              <p className='eyebrow'>Conditional findOneAndUpdate</p>
              <h2 id='claimed-heading'>Ticket claimed</h2>
              <p role='status'>Saved for the user verified by the backend. The document below is the actual response from <code>{"returnDocument: 'after'"}</code>.</p>
              <pre>{JSON.stringify(claimed, null, 2)}</pre>
            </section>
          )}
        </section>

        <aside className='tools-column' aria-label='Ticket tools'>
          <section className='card' aria-labelledby='create-heading'>
            <p className='eyebrow'>Add to the queue</p>
            <h2 id='create-heading'>Create a ticket</h2>
            <p className='subtle'>Status, creation time, and ownership are set by the server.</p>
            <Form onSubmit={createTicket} necessityIndicator='label' isDisabled={!canCreate || busy}>
              <TextField label='Title' value={title} onChange={setTitle} isRequired width='100%' />
              <Picker label='Priority' selectedKey={priority} onSelectionChange={key => setPriority(String(key))} isRequired width='100%'>
                {Object.entries(PRIORITIES).map(([key, label]) => <Item key={key}>{`${key} / ${label}`}</Item>)}
              </Picker>
              <TextArea label='Description' value={description} onChange={setDescription} width='100%' />
              <Button variant='cta' type='submit' isDisabled={!canCreate || busy || !title.trim()}>
                {operation?.type === 'create' ? 'Creating...' : 'Create ticket'}
              </Button>
            </Form>
            {created && <Notice kind='success'>Ticket created: {created._id}</Notice>}
          </section>
          <section className='card validation-card' aria-labelledby='validation-heading'>
            <p className='eyebrow'>Test the guardrail</p>
            <h2 id='validation-heading'>Try an invalid create</h2>
            <p>Same <code>create-ticket</code> endpoint. Missing title, invalid priority. The expected result is an ABDB schema rejection, surfaced as HTTP 422.</p>
            <pre aria-label='Invalid create payload'>{JSON.stringify(INVALID_DOCUMENT, null, 2)}</pre>
            <Button variant='secondary' isDisabled={!canCreate || busy} onPress={tryInvalidCreate}>
              {operation?.type === 'validation' ? 'Submitting...' : 'Try invalid create'}
            </Button>
            {validation?.kind === 'rejected' && <Notice kind='success'><strong>Rejected as expected.</strong> {validation.message}</Notice>}
            {validation?.kind === 'failed' && <Notice kind='error'><strong>Could not verify schema rejection.</strong> {validation.message}</Notice>}
            {validation?.kind === 'accepted' && (
              <Notice kind='error'>
                <strong>Unexpected acceptance: validation demonstration failed.</strong> The backend accepted the malformed document. Check the collection validator; the inserted document has not been deleted.
                <pre>{JSON.stringify(validation.document, null, 2)}</pre>
              </Notice>
            )}
          </section>
        </aside>
      </div>
      <DatabaseNotes />
      <footer className='app-footer'>Built to demonstrate App Builder Database. No automatic seeding, resets, or client-supplied claim identity.</footer>
    </main>
  )
}
