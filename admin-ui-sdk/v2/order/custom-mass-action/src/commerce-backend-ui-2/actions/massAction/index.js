/*
Copyright 2026 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

const {
    parseMassActionRequest,
    okMassActionResponse,
    massActionErrorResponse
} = require('@adobe/aio-commerce-sdk/admin-ui/mass-actions')

async function main (params) {
    try {
        const { gridType, ids } = parseMassActionRequest(params)

        // existing business logic — the v1 handler was a no-op stub;
        // replace this with the mass action's real processing logic.
        void gridType
        void ids

        return okMassActionResponse()
    } catch (error) {
        return massActionErrorResponse(500, error.message)
    }
}

exports.main = main
