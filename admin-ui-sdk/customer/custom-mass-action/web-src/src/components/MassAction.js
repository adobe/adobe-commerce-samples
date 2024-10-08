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
import {
    Flex,
    Heading, Item, ListView, ProgressCircle, View
} from '@adobe/react-spectrum'
import { attach } from '@adobe/uix-guest'
import { useState } from 'react'

export const MassAction = () => {
    const [items] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    const getGuestConnection = async () => {
        return await attach({
            id: 'customer-custom-mass-action'
        })
    }

    getGuestConnection().then((guestConnection) => {
        guestConnection.sharedContext.get('selectedIds').forEach((id) => {
            items.push({id: id})
        })
        setIsLoading(false)
    })

    return (
        <View>
            {isLoading ? (
                <Flex alignItems="center" justifyContent="center" height="100vh">
                    <ProgressCircle size="L" aria-label="Loading…" isIndeterminate />
                </Flex>
            ) : (
                <View margin={10}>
                    <Heading level={1}>Selected Ids</Heading>
                    <ListView
                        items={items}
                    >
                        {(item) => <Item key={item.id}>{item.id}</Item>}
                    </ListView>
                </View>
            )}
        </View>
    )
}
