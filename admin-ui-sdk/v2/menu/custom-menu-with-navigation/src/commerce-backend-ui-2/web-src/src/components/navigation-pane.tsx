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

import { Tab, TabList, TabPanel, Tabs } from "@react-spectrum/s2/Tabs";

import { AboutView } from "#web/components/about-view.tsx";
import { SettingsView } from "#web/components/settings-view.tsx";
import { Welcome } from "#web/components/welcome.tsx";

/**
 * Left-hand navigation pane for the menu page. Vertical tabs switch between
 * sections client-side, inside the same iframe — since a V2 app can register
 * only a single menu entry, this is how a multi-section app surfaces more
 * than one view from it.
 */
export function NavigationPane() {
  return (
    <Tabs aria-label="App sections" orientation="vertical">
      <TabList aria-label="App sections">
        <Tab id="overview" aria-label="Overview">Overview</Tab>
        <Tab id="settings" aria-label="Settings">Settings</Tab>
        <Tab id="about" aria-label="About">About</Tab>
      </TabList>
      <TabPanel id="overview" aria-label="Overview">
        <Welcome />
      </TabPanel>
      <TabPanel id="settings" aria-label="Settings">
        <SettingsView />
      </TabPanel>
      <TabPanel id="about" aria-label="About">
        <AboutView />
      </TabPanel>
    </Tabs>
  );
}
