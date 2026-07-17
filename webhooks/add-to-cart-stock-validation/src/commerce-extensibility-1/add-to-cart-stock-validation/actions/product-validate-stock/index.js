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

/**
 * This is a sample action showcasing how to handle Adobe Commerce add to cart webhook.
 *
 * Note:
 * Authentication against Adobe Identity Management System is enforced by the require-adobe-auth
 * annotation on this action in actions.config.yaml, so requests without a valid Authorization
 * header never reach this code. Removing that annotation would allow any client knowing the URL
 * to this deployed action to invoke it without any authentication and authorization checks
 * against Adobe Identity Management System. Make sure to validate that change against your
 * security requirements before deploying the action.
 */


const { Core } = require('@adobe/aio-sdk')
const { ok, successOperation, exceptionOperation } = require('@adobe/aio-commerce-sdk/webhooks/responses')
const { badRequest, internalServerError } = require('@adobe/aio-commerce-sdk/core/responses')

// main function that will be executed by Adobe I/O Runtime
async function main(params) {
    // create a Logger
    const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

    try {
        // 'info' is the default level if not set
        logger.info('Calling action product-validate-stock')

        // log parameters, only if params.LOG_LEVEL === 'debug'
        // hide authorization token without overriding params
        let headers = params.__ow_headers || {}
        if (headers.authorization) {
            headers = { ...headers, authorization: '<hidden>' }
        }
        logger.debug(JSON.stringify({ ...params, __ow_headers: headers }))

        // check for missing request input parameters
        const missingParams = ['product', 'info'].filter(p => params[p] === undefined || params[p] === '')
        const errorMessage = missingParams.length > 0 ? `missing parameter(s) '${missingParams}'` : null
        if (errorMessage) {
            // return and log client errors
            logger.info(`400: ${errorMessage}`)
            return badRequest(errorMessage)
        }

        const info = params.info;
        const product = params.product;

        if (!product.quantity_and_stock_status.is_in_stock || product.quantity_and_stock_status.qty < info.qty) {
            logger.info('200: exception - product out of stock')
            return ok(exceptionOperation('The product is out of stock.'))
        }

        logger.info('200: successful request')
        return ok(successOperation())
    } catch (error) {
        // log any server errors
        logger.error(error)
        return internalServerError('server error')
    }
}

exports.main = main
