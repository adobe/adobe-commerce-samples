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

/** A second section, standing in for app-specific settings or configuration. */
export function SettingsView() {
  return (
    <>
      <h1>Settings</h1>
      <p>
        A V2 app can register only a single Admin menu entry, so app-specific
        settings live here as another view in the navigation pane instead of a
        separate menu item.
      </p>
    </>
  );
}
