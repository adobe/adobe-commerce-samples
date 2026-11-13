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
import actions from "./config.json";

export async function callCatalog(ims, params, signal) {
  const local = ims.local && window.location.hostname === "127.0.0.1";
  const url = local ? "/api/catalog" : actions["supplier-catalog/catalog"];
  if (!url || (!local && !ims.token)) {
    throw new Error(
      "Connect through Experience Cloud Shell, or run npm run dev with your workspace credentials and open http://127.0.0.1:8787.",
    );
  }
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(local
        ? { "X-Catalog-Client": "workbench" }
        : { Authorization: `Bearer ${ims.token}`, "x-gw-ims-org-id": ims.org }),
    },
    body: JSON.stringify(params),
    signal,
  });
  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error(
      `Catalog endpoint returned a non-JSON response (${response.status}). Check the action deployment or local bridge.`,
    );
  }
  if (!response.ok) {
    const error = new Error(
      body.error || `Catalog request failed (${response.status}).`,
    );
    error.progress = body.progress;
    throw error;
  }
  return body;
}
