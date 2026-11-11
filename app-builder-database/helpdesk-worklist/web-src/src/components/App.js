import React, { useEffect, useRef, useState } from 'react'
import { Provider, defaultTheme } from '@adobe/react-spectrum'
import ErrorBoundary from 'react-error-boundary'
import Worklist from './Worklist'

export function updateSession (current, configuration) {
  const next = { ...current }
  if ('imsOrg' in configuration) next.org = configuration.imsOrg
  if ('imsToken' in configuration) next.token = configuration.imsToken
  else if (next.org !== current.org) next.token = ''
  if ('imsProfile' in configuration) next.profile = configuration.imsProfile
  else if (next.org !== current.org) next.profile = null
  return next
}

function Unavailable () {
  return (
    <main className='app-shell'>
      <h1>Helpdesk Worklist</h1>
      <p role='alert'>The worklist could not be displayed. Reload the page to try again.</p>
    </main>
  )
}

const EMPTY_IMS = {}

export default function App ({ runtime, ims = EMPTY_IMS }) {
  const [session, setSession] = useState({ ims, revision: 0 })
  const previousIms = useRef(ims)

  useEffect(() => {
    if (previousIms.current === ims) return
    previousIms.current = ims
    setSession(current => ({ ims, revision: current.revision + 1 }))
  }, [ims])

  useEffect(() => {
    if (!runtime) return
    const onConfiguration = configuration => {
      setSession(current => ({
        ims: updateSession(current.ims, configuration),
        revision: current.revision + 1
      }))
    }
    runtime.on('configuration', onConfiguration)
    return () => runtime.off('configuration', onConfiguration)
  }, [runtime])

  return (
    <Provider theme={defaultTheme} colorScheme='light'>
      <ErrorBoundary
        onError={error => console.error('Worklist rendering failed:', error)}
        FallbackComponent={Unavailable}
      >
        <Worklist key={session.revision} ims={session.ims} />
      </ErrorBoundary>
    </Provider>
  )
}
