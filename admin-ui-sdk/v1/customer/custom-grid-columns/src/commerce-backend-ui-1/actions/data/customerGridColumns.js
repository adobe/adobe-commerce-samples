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

    const customerGridColumns = {
        "customerGridColumns": {
            "1": {
                "first_column": "value_1",
                "second_column": 1,
                "third_column": "2030-12-01T23:25:42+11:00"
            },
            "2": {
                "first_column": 1,
                "second_column": "test",
                "third_column": "2011-10-02T23:25:42+00:00"
            },
            "*": {
                "first_column": "Default value first column",
                "second_column": 0
            }
        }
    }

    if (selectedIds.length === 0) {
        return {
            statusCode: 200,
            body: customerGridColumns,
        }
    }

    const filteredColumns = {
        "customerGridColumns": {}
    }
    selectedIds.forEach(id => {
        if (customerGridColumns.customerGridColumns[id]) {
            filteredColumns.customerGridColumns[id] = customerGridColumns.customerGridColumns[id]
        }
    })
    filteredColumns.customerGridColumns['*'] = customerGridColumns.customerGridColumns['*']

    return {
        statusCode: 200,
        body: filteredColumns
    }
}
