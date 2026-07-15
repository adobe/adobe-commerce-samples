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
 * You might want to disable authentication and authorization checks against Adobe Identity Management System for a generic action. In that case:
 *   - Remove the require-adobe-auth annotation for this action in the manifest.yml of your application
 *   - Remove the Authorization header check below
 *   - The two steps above imply that every client knowing the URL to this deployed action will be able to invoke it without any authentication and authorization checks against Adobe Identity Management System
 *   - Make sure to validate these changes against your security requirements before deploying the action
 */


const { Core } = require('@adobe/aio-sdk')

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

        // check for missing request input parameters and headers
        const missingHeaders = ['authorization'].filter(h => !(params.__ow_headers || {})[h])
        const missingParams = ['product', 'info'].filter(p => params[p] === undefined || params[p] === '')
        let errorMessage = null
        if (missingHeaders.length > 0) {
            errorMessage = `missing header(s) '${missingHeaders}'`
        }
        if (missingParams.length > 0) {
            errorMessage = errorMessage ? `${errorMessage} and missing parameter(s) '${missingParams}'` : `missing parameter(s) '${missingParams}'`
        }
        if (errorMessage) {
            // return and log client errors
            logger.info(`400: ${errorMessage}`)
            return { error: { statusCode: 400, body: { error: errorMessage } } }
        }

        const info = params.info;
        const product = params.product;
        const response = {
            statusCode: 200,
            body: JSON.stringify({
                op: 'success'
            })
        };

        if (!product.quantity_and_stock_status.is_in_stock || product.quantity_and_stock_status.qty < info.qty) {
            response.body = JSON.stringify({
                op: 'exception',
                message: 'The product is out of stock.'
            });
        }

        // log the response status code
        logger.info(`${response.statusCode}: successful request`)

        return response
    } catch (error) {
        // log any server errors
        logger.error(error)
        // return with 500
        return { error: { statusCode: 500, body: { error: 'server error' } } }
    }
}

exports.main = main
