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
import "core-js/stable";
import "regenerator-runtime/runtime";

import { createRoot } from "react-dom/client";

import App from "./components/App";
import "./index.css";

window.React = require("react");

/**
 * Renders the main application into the DOM.
 * Commerce Admin UI SDK menu extensions run in iframes within Commerce Admin,
 * not in Experience Cloud Shell. Authentication is handled via @adobe/uix-guest
 * sharedContext in the component.
 */
function renderApp() {
  const client = createRoot(document.getElementById("root"));

  // Create a minimal runtime object for compatibility
  const mockRuntime = {
    on: () => {
      // NOOP
    },
  };

  // IMS context will be retrieved via @adobe/uix-guest sharedContext in the component
  client.render(<App ims={{}} runtime={mockRuntime} />);
}

// Bootstrap the app immediately
renderApp();
