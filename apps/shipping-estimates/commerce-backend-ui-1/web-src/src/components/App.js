/*
Copyright 2025 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import { lightTheme, Provider } from "@adobe/react-spectrum";
import React from "react";
import { ErrorBoundary } from "react-error-boundary";
import { HashRouter, Route, Routes } from "react-router-dom";

import ExtensionRegistration from "./ExtensionRegistration";

/**
 * Main application component
 *
 * @param {object} props The component props
 * @param {object} props.runtime Adobe I/O runtime object
 * @param {object} props.ims IMS context object
 * @returns {React.ReactElement} The rendered app component
 */
function App(props) {
  // use exc runtime event handlers
  // respond to configuration change events (e.g. user switches org)
  props.runtime.on("configuration", ({ imsOrg, imsToken }) => {
    console.log("configuration change", { imsOrg, imsToken });
  });
  // respond to history change events
  props.runtime.on("history", ({ type, path }) => {
    console.log("history change", { type, path });
  });

  return (
    <ErrorBoundary FallbackComponent={fallbackComponent} onError={onError}>
      <HashRouter>
        <Provider colorScheme={"light"} theme={lightTheme}>
          <Routes>
            <Route
              element={
                <ExtensionRegistration
                  ims={props.ims}
                  runtime={props.runtime}
                />
              }
              index
            />
          </Routes>
        </Provider>
      </HashRouter>
    </ErrorBoundary>
  );

  // Methods

  /**
   * Error handler on UI rendering failure
   *
   * @param {Error} e The error thrown during rendering
   * @param {string} componentStack Stack trace of where the error occurred
   * @returns {void}
   */
  function onError(e, componentStack) {
    console.error("Error rendering UI", e, componentStack);
  }

  /**
   * Component to show if UI fails rendering
   *
   * @param {object} root0 Props passed to the fallback component
   * @param {string} root0.componentStack Stack trace of the component
   * @param {Error} root0.error The error thrown
   * @returns {React.ReactElement} The fallback UI
   */
  function fallbackComponent({ componentStack, error }) {
    return (
      <>
        <h1 style={{ textAlign: "center", marginTop: "20px" }}>
          Something went wrong :(
        </h1>
        <pre>{`${componentStack}\n${error.message}`}</pre>
      </>
    );
  }
}

export default App;
