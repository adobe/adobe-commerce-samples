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

export async function main(params) {

    const selectedIds = params.ids ? params.ids.split(',') : [];

    const productGridColumns = {
        "productGridColumns": {
            "Test Product 1": {
                "first_column": "value_1"
            },
            "Test Product 2": {
                "first_column": 1
            },
            "Test Product": {
                "first_column": "Test value"
            },
            "test-product-26": {
                "first_column": "Test product value 26"
            },
            "test-product-30": {
                "first_column": "Test product value 30"
            },
            "test-product-82": {
                "first_column": "Test product value 82"
            },
            "LUCKY-CAT-BLUE": {
                "first_column": "Lucky Cat"
            },
            "APOLLO-CSM-KIT": {
                "first_column": "Apollo"
            },
            "*": {
                "first_column": "Default value first column"
            }
        }
    }

    if (selectedIds.length === 0) {
        return {
            statusCode: 200,
            body: productGridColumns,
        }
    }

    const filteredColumns = {
        "productGridColumns": {}
    }
    selectedIds.forEach(id => {
        if (productGridColumns.productGridColumns[id]) {
            filteredColumns.productGridColumns[id] = productGridColumns.productGridColumns[id]
        }
    })
    filteredColumns.productGridColumns['*'] = productGridColumns.productGridColumns['*']

    return {
        statusCode: 200,
        body: filteredColumns
    }
}
