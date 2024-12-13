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

export async function main() {

    const orderGridColumns = {
        "orderGridColumns": {
            "000000001": {
                "first_column": "value_1",
                "second_column": 1,
                "third_column": "2030-12-01T23:25:42+1100"
            },
            "000000002": {
                "first_column": 1,
                "second_column": "test",
                "third_column": "2011-10-02T23:25:42+0000"
            },
            "000000003": {
                "first_column": "value_3",
                "second_column": 3,
                "third_column": "2030-14-01T23:25:42+1100"
            },
            "000000004": {
                "first_column": "value_1",
                "second_column": 1,
                "third_column": "2011-10-02T23:25:42+0000"
            }
        }
    }

    return {
        statusCode: 200,
        body: orderGridColumns,
    }
}
