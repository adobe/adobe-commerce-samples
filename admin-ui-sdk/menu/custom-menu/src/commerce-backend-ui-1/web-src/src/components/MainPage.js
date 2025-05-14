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
    TabList,
    TabPanels,
    Tabs
} from '@adobe/react-spectrum'
import { Orders } from './Orders'
import { Products } from './Products'
import { useState } from 'react'

export const MainPage = props => {

    const [selectedTab, setSelectedTab] = useState(1)

    const onSelectionTabChange = selectedTabKey => {
        setSelectedTab(selectedTabKey)
    }

    const tabs = [
        {
            id: 1,
            name: 'Orders',
            children: <Orders runtime={props.runtime} ims={props.ims} />
        },
        {
            id: 2,
            name: 'Products',
            children: <Products runtime={props.runtime} ims={props.ims} />
        }
    ]

    return (
        <Tabs
            aria-label="Commerce data"
            items={tabs}
            orientation="horizontal"
            isEmphasized={true}
            selectedKey={selectedTab}
            onSelectionChange={onSelectionTabChange}
            margin={10}
        >
            <TabList>{item => <Item>{item.name}</Item>}</TabList>
            <TabPanels>{item => <Item>{item.children}</Item>}</TabPanels>
        </Tabs>
    )
}
