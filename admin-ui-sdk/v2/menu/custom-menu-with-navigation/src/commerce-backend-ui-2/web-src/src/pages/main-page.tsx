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

import { AboutView } from "#web/components/about-view.tsx";
import { SettingsView } from "#web/components/settings-view.tsx";
import { Welcome } from "#web/components/welcome.tsx";
import { Tab, TabList, TabPanel, Tabs } from "@react-spectrum/s2";

/** Entrypoint for the main page of the app. */
export function MainPage() {
  return (
    <main>
      <Tabs aria-label="App sections" orientation="vertical">
        <TabList aria-label="App sections">
          <Tab id="overview">Overview</Tab>
          <Tab id="settings">Settings</Tab>
          <Tab id="about">About</Tab>
        </TabList>
        <TabPanel id="overview">
          <Welcome />
        </TabPanel>
        <TabPanel id="settings">
          <SettingsView />
        </TabPanel>
        <TabPanel id="about">
          <AboutView />
        </TabPanel>
      </Tabs>
    </main>
  );
}
