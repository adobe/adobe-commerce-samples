/*
Copyright 2026 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/
import { createRoot } from "react-dom/client";
import { init } from "@adobe/exc-app";
import App from "./components/App";
import "./index.css";

const root = createRoot(document.getElementById("root"));
root.render(<App ims={{}} />);

try {
  // The generator's domain-validated loader only runs inside Experience Cloud Shell.
  require("./exc-runtime");
  init((runtime) => {
    let context = {};
    const renderContext = ({ imsOrg, imsToken, locale }) => {
      context = {
        org: imsOrg ?? context.org,
        token: imsToken ?? context.token,
        locale: locale ?? context.locale,
      };
      root.render(
        <App
          key={context.org}
          ims={{ org: context.org, token: context.token }}
          locale={context.locale?.replace("_", "-")}
        />,
      );
    };
    runtime.on("ready", (payload) => {
      renderContext(payload);
      runtime.done();
    });
    runtime.on("configuration", renderContext);
    runtime.solution = {
      icon: "AdobeExperienceCloud",
      title: "Supplier Catalog Importer",
      shortTitle: "Catalog",
    };
    runtime.title = "Supplier Catalog Importer";
  });
} catch {
  // A local bridge uses server-held workspace credentials, never a fake browser token.
  if (window.location.hostname === "127.0.0.1") {
    fetch("/api/local-context", {
      headers: { "X-Catalog-Client": "workbench" },
    })
      .then(async (response) => {
        if (response.ok && (await response.json()).local) {
          root.render(<App ims={{ local: true }} />);
        }
      })
      .catch(() => {});
  }
}
