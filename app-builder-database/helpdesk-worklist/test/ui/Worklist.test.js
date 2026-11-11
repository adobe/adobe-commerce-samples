/** @jest-environment jsdom */
import React from 'react'
import ReactDOM from 'react-dom'
import { act, Simulate } from 'react-dom/test-utils'
import Worklist from '../../web-src/src/components/Worklist'
import { createApi, missingActions } from '../../web-src/src/api'
import { ActionError } from '../../web-src/src/utils'

jest.mock('../../web-src/src/api', () => ({
  createApi: jest.fn(),
  missingActions: jest.fn(),
  WORKLIST_LIMIT: 50
}))

jest.mock('@adobe/react-spectrum', () => {
  const React = require('react')
  return {
    Button: ({ children, onPress, isDisabled, type = 'button', ...props }) => (
      <button type={type} onClick={onPress} disabled={isDisabled} aria-label={props['aria-label']}>{children}</button>
    ),
    Form: ({ children, onSubmit, isDisabled }) => <form onSubmit={onSubmit}><fieldset disabled={isDisabled}>{children}</fieldset></form>,
    TextField: ({ label, value, onChange }) => <label>{label}<input value={value} onChange={event => onChange(event.target.value)} /></label>,
    TextArea: ({ label, value, onChange }) => <label>{label}<textarea value={value} onChange={event => onChange(event.target.value)} /></label>,
    Picker: ({ label, children, selectedKey, onSelectionChange }) => (
      <label>{label}<select value={selectedKey} onChange={event => onSelectionChange(event.target.value)}>
        {React.Children.map(children, child => <option value={child.key}>{child.props.children}</option>)}
      </select></label>
    ),
    Item: () => null,
    ProgressCircle: () => <span>Loading</span>
  }
})

const ims = { token: 'user-token', org: 'test-org', profile: { displayName: 'Demo user' } }
const ticket = {
  _id: 'ticket-1', title: 'Checkout issue', priority: 1,
  status: 'open', createdAt: '2026-01-01T00:00:00.000Z', assigneeId: null
}
let container, api

beforeEach(() => {
  jest.resetAllMocks()
  container = document.createElement('div')
  document.body.appendChild(container)
  api = {
    listOpen: jest.fn().mockResolvedValue([ticket]),
    createTicket: jest.fn().mockResolvedValue(ticket),
    claimTicket: jest.fn().mockResolvedValue({ ...ticket, status: 'claimed', assigneeId: 'verified-user' })
  }
  createApi.mockReturnValue(api)
  missingActions.mockReturnValue([])
})

afterEach(() => {
  act(() => { ReactDOM.unmountComponentAtNode(container) })
  container.remove()
})

function button (text) {
  return [...container.querySelectorAll('button')].find(item => item.textContent === text)
}

async function render () {
  await act(async () => { ReactDOM.render(<Worklist ims={ims} />, container) })
}

async function submitTicket () {
  act(() => { Simulate.change(container.querySelector('input'), { target: { value: 'New issue' } }) })
  await act(async () => { Simulate.submit(container.querySelector('form')) })
}

test('both create controls work without the pending list/claim actions', async () => {
  missingActions.mockReturnValue(['list-open', 'claim-ticket'])
  await render()
  expect(button('Refresh').disabled).toBe(true)
  await submitTicket()
  expect(api.createTicket).toHaveBeenCalledWith({ title: 'New issue', priority: 2 })
  expect(container.textContent).toContain('Ticket created: ticket-1')
  api.createTicket.mockRejectedValueOnce(new ActionError(422, 'Document failed schema validation.'))
  await act(async () => { Simulate.click(button('Try invalid create')) })
  expect(api.createTicket).toHaveBeenLastCalledWith({ priority: 99 })
  expect(container.textContent).toContain('Rejected as expected.')
  expect(api.listOpen).not.toHaveBeenCalled()
})

test('refreshes the queue after creating a ticket', async () => {
  api.listOpen.mockResolvedValueOnce([]).mockResolvedValueOnce([ticket])
  await render()
  await submitTicket()
  expect(api.listOpen).toHaveBeenCalledTimes(2)
  expect(container.querySelector('tbody tr').textContent).toContain(ticket.title)
})

test('displays the actual claimed document and refreshes the queue', async () => {
  api.listOpen.mockResolvedValueOnce([ticket]).mockResolvedValueOnce([])
  await render()
  await act(async () => { Simulate.click(button('Claim')) })
  expect(api.claimTicket).toHaveBeenCalledWith('ticket-1')
  expect(api.listOpen).toHaveBeenCalledTimes(2)
  expect(container.querySelector('tbody tr')).toBeNull()
  expect(JSON.parse(container.querySelector('.result-card pre').textContent)).toEqual({
    ...ticket, status: 'claimed', assigneeId: 'verified-user'
  })
})

test('refreshes after a claim conflict without showing a successful claim', async () => {
  api.listOpen.mockResolvedValueOnce([ticket]).mockResolvedValueOnce([])
  api.claimTicket.mockRejectedValue(new ActionError(409, 'Ticket unavailable.'))
  await render()
  await act(async () => { Simulate.click(button('Claim')) })
  expect(api.listOpen).toHaveBeenCalledTimes(2)
  expect(container.textContent).toContain('no longer open and unassigned')
  expect(container.querySelector('.result-card')).toBeNull()
})

test('does not present an operational failure as successful schema rejection', async () => {
  api.createTicket.mockRejectedValue(new ActionError(500, 'Database unavailable.'))
  await render()
  await act(async () => { Simulate.click(button('Try invalid create')) })
  expect(container.textContent).toContain('Could not verify schema rejection.')
  expect(container.textContent).not.toContain('Rejected as expected.')
})
