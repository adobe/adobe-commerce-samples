/*
Copyright 2024 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/
import React from 'react'
import { Provider, lightTheme } from '@adobe/react-spectrum'
import { ErrorBoundary } from 'react-error-boundary'
import { Route, Routes, HashRouter } from 'react-router-dom'
import ExtensionRegistration from './ExtensionRegistration'
import { FirstMassAction } from './massActions/FirstMassAction'
import { AnotherMassAction } from './massActions/AnotherMassAction'
import { CreateReturn } from './customButtons/CreateReturn'
import { DeleteOrder } from './customButtons/DeleteOrder'

function App (props) {
  console.log('runtime object:', props.runtime)
  console.log('ims object:', props.ims)

  // use exc runtime event handlers
  // respond to configuration change events (e.g. user switches org)
  props.runtime.on('configuration', ({ imsOrg, imsToken }) => {
    console.log('configuration change', { imsOrg, imsToken })
  })
  // respond to history change events
  props.runtime.on('history', ({ type, path }) => {
    console.log('history change', { type, path })
  })

  return (
      <ErrorBoundary onError={onError} FallbackComponent={fallbackComponent}>
          <HashRouter>
              <Provider theme={lightTheme} colorScheme={'light'}>
                  <Routes>
                      <Route index element={<ExtensionRegistration runtime={props.runtime} ims={props.ims} />} />
                      <Route path={'first-mass-action'} element={<FirstMassAction runtime={props.runtime} ims={props.ims} />} />
                      <Route path={'another-mass-action'} element={<AnotherMassAction runtime={props.runtime} ims={props.ims} />} />
                      <Route path={'create-return'} element={<CreateReturn runtime={props.runtime} ims={props.ims} />} />
                      <Route path={'delete-order'} element={<DeleteOrder runtime={props.runtime} ims={props.ims} />} />
                  </Routes>
              </Provider>
          </HashRouter>
      </ErrorBoundary>
  )

  // Methods

  // error handler on UI rendering failure
    function onError(e, componentStack) {}

    // component to show if UI fails rendering
    function fallbackComponent({ componentStack, error }) {
        return (
            <React.Fragment>
                <h1 style={{ textAlign: 'center', marginTop: '20px' }}>Something went wrong :(</h1>
                <pre>{componentStack + '\n' + error.message}</pre>
            </React.Fragment>
        )
    }
}

export default App
