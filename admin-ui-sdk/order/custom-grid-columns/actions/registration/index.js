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

async function main() {
    return {
        statusCode: 200,
        body: {
            registration: {
                order: {
                    gridColumns: {
                        data: {
                            meshId: '',
                            apiKey: ''
                        },
                        properties:[
                            {
                                label: 'First App Column',
                                columnId: 'first_column',
                                type: 'string',
                                align: 'left'
                            },
                            {
                                label: 'Second App Column',
                                columnId: 'second_column',
                                type: 'integer',
                                align: 'left'
                            },
                            {
                                label: 'Third App Column',
                                columnId: 'third_column',
                                type: 'date',
                                align: 'left'
                            }
                        ]
                    }
                }
            }
        }
    }
}

exports.main = main
