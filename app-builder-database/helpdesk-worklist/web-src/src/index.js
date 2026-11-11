/* 
* <license header>
*/

import 'core-js/stable'
import 'regenerator-runtime/runtime'
import React from 'react'
import ReactDOM from 'react-dom'

import Runtime, { init } from '@adobe/exc-app'

import App from './components/App'
import './index.css'

let inShell = false
try {
  require('./exc-runtime')
  inShell = true
} catch (e) {
  console.info('Experience Cloud Shell is unavailable:', e.message)
}

if (inShell) {
  init(bootstrapInExcShell)
} else {
  ReactDOM.render(<App ims={{}} />, document.getElementById('root'))
}

function bootstrapInExcShell () {
  const runtime = Runtime()

  runtime.on('ready', ({ imsOrg, imsToken, imsProfile }) => {
    runtime.done()
    ReactDOM.render(
      <App runtime={runtime} ims={{ profile: imsProfile, org: imsOrg, token: imsToken }} />,
      document.getElementById('root')
    )
  })

  runtime.solution = {
    icon: 'AdobeExperienceCloud',
    title: 'Helpdesk Worklist',
    shortTitle: 'Helpdesk'
  }
  runtime.title = 'Helpdesk Worklist'
}
