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
    Item,
    Flex,
    ProgressCircle,
    TabList,
    TabPanels,
    Tabs,
    View
} from '@adobe/react-spectrum'
import { attach } from '@adobe/uix-guest'
import { Orders } from './Orders'
import { Products } from './Products'
import { useState } from 'react'

export const MainPage = () => {

    const [isLoading, setIsLoading] = useState(true)
    const [selectedTab, setSelectedTab] = useState(1)
    const [imsToken, setImsToken] = useState(null)
    const [imsOrgId, setImsOrgId] = useState(null)

    const onSelectionTabChange = selectedTabKey => {
        setSelectedTab(selectedTabKey)
    }

    const getGuestConnection = async () => {
        return await attach({
            id: 'CustomMenu'
        })
    }

    getGuestConnection().then((guestConnection) => {
        setImsToken(guestConnection?.sharedContext?.get('imsToken'))
        setImsOrgId(guestConnection?.sharedContext?.get('imsOrgId'))
        setIsLoading(false)
    })

    const tabs = [
        {
            id: 1,
            name: 'Orders',
            children: <Orders imsToken={imsToken} imsOrgId={imsOrgId} />
        },
        {
            id: 2,
            name: 'Products',
            children: <Products imsToken={imsToken} imsOrgId={imsOrgId} />
        }
    ]

    return (
        <View>
            {isLoading ? (
                <Flex alignItems="center" justifyContent="center" height="100vh">
                    <ProgressCircle size="L" aria-label="Loading…" isIndeterminate />
                </Flex>
            ) : (
                <Tabs
                    aria-label="Commerce data"
                    items={tabs}
                    orientation="horizontal"
                    isEmphasized={true}
                    selectedKey={selectedTab}
                    onSelectionChange={onSelectionTabChange}
                    margin={10}
                >
                    <TabList>{item => <Item key={item.id}>{item.name}</Item>}</TabList>
                    <TabPanels>{item => <Item key={item.id}>{item.children}</Item>}</TabPanels>
                </Tabs>
            )}
        </View>
    )
}
