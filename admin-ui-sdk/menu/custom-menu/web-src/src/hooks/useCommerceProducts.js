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
import { useEffect, useState } from 'react'
import { callAction } from '../utils'

export const useCommerceProducts = props => {
    const [isLoadingCommerceProducts, setIsLoadingCommerceProducts] = useState(true)
    const [commerceProducts, setCommerceProducts] = useState([])

    const fetchCommerceProducts = async () => {
        const commerceProductsResponse = await callAction(
            props,
            'CustomMenu/commerce-rest-get',
            `products?searchCriteria[pageSize]=${props.pageSize}&searchCriteria[currentPage]=${props.currentPage}`
        )
        console.log(commerceProductsResponse)
        setCommerceProducts(commerceProductsResponse.error ? [] : commerceProductsResponse.items)
    }

    useEffect(() => {
        fetchCommerceProducts().then(() => setIsLoadingCommerceProducts(false))
    }, [])

    return { isLoadingCommerceProducts, commerceProducts }
}
