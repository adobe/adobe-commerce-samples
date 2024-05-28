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
import { Heading, View, Content, Link } from '@adobe/react-spectrum'
export const About = () => (
  <View width="size-6000">
    <Heading level={1}>Useful documentation for your app</Heading>
    <Content>
      <ul style={{ listStyle: 'none' }}>
        <li>
          <Link>
            <a href='https://github.com/AdobeDocs/project-firefly/blob/master/README.md#project-firefly-developer-guide' target='_blank'>
              Adobe Developer App Builder
            </a>
          </Link>
        </li>
        <li>
          <Link>
            <a href='https://github.com/adobe/aio-sdk#adobeaio-sdk' target='_blank'>
              Adobe I/O SDK
            </a>
          </Link>
        </li>
        <li>
          <Link>
            <a href='https://adobedocs.github.io/adobeio-runtime/' target='_blank'>
              Adobe I/O Runtime
            </a>
          </Link>
        </li>
        <li>
          <Link>
            <a href='https://react-spectrum.adobe.com/react-spectrum/index.html' target='_blank'>
              React Spectrum
            </a>
          </Link>
        </li>
      </ul>
    </Content>
  </View>
)
