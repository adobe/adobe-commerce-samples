/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/** A third section explaining the pattern this sample demonstrates. */
export function AboutView() {
  return (
    <>
      <h1>About this sample</h1>
      <p>
        This entire page is rendered by the single menu entry declared in{" "}
        <code>app.commerce.config.ts</code>. The navigation pane on the left
        switches between views client-side, inside the same iframe — no
        additional Admin menu entries required.
      </p>
    </>
  );
}
