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
import {attach} from "@adobe/uix-guest";
import {extensionId} from "../Constants";
import {useState} from "react";
import {Button, Flex, Heading, ProgressCircle, View} from "@adobe/react-spectrum";

export const CreateReturn = () => {

    const [orderId, setOrderId] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [connection, setConnection] = useState(undefined)

    const getGuestConnection = async () => {
        return await attach({
            id: extensionId,
        })
    }

    getGuestConnection().then((guestConnection) => {
        setConnection(guestConnection)
        const urlString = window.location.href
        const queryString = urlString.split('?')[1]
        const searchParams = new URLSearchParams(queryString)
        setOrderId(searchParams.get('orderId'))
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
                    <Heading level={1}>Request return </Heading>
                    orderId is: {orderId}
                    <Button variant={"primary"} marginStart={10} onPress={async () => { await connection.host.field.close()}}>
                        Done
                    </Button>
                </View>
            )}
        </View>
    )
}
