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
import { register } from '@adobe/uix-guest'
import { MainPage } from './MainPage'
import { useEffect, useState } from 'react'

export default function ExtensionRegistration(props) {

  const [guestConnection, setGuestConnection] = useState(null)

  useEffect(() => {
    (async () => {
      const extensionId = 'CustomMenu'

      const guestConnection = await register({
        id: extensionId,
        methods: {
        }
      })

      setGuestConnection(guestConnection)

    })()
  }, [])

  if(!guestConnection) {
    return
  }

  return <MainPage runtime={props.runtime} ims={props.ims} guestConnection={guestConnection} />
}
