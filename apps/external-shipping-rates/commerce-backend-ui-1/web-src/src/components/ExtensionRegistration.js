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

import { register } from "@adobe/uix-guest";
import React, { useEffect } from "react";

import { TAX_EXTENSION_ID } from "../constants/extension";
import { MainPage } from "./MainPage";

/**
 * Extension Registration Component
 * @param {object} props The component props
 * @param {object} props.runtime Adobe I/O runtime object
 * @param {object} props.ims IMS context object
 * @returns {React.ReactElement} The rendered React component
 */
export default function ExtensionRegistration(props) {
  const registerExtension = async () => {
    await register({
      id: TAX_EXTENSION_ID,
      methods: {},
    });
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: only run on mount
  useEffect(() => {
    registerExtension().catch(console.error);
  }, []);

  return <MainPage ims={props.ims} runtime={props.runtime} />;
}
