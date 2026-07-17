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
 * This is a sample action showcasing how to access an external API
 */


const fetch = require('node-fetch')
const { Core } = require('@adobe/aio-sdk')
const { ok, buildErrorResponse, internalServerError } = require('@adobe/aio-commerce-sdk/core/responses')

// main function that will be executed by Adobe I/O Runtime
const main = async params => {
    // create a Logger
   const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

   try {
     // 'info' is the default level if not set
     logger.info('Calling the main action of customer-login')

     // log parameters, only if params.LOG_LEVEL === 'debug'
     // hide authorization token without overriding params
     let headers = params.__ow_headers || {}
     if (headers.authorization) {
       headers = { ...headers, authorization: '<hidden>' }
     }
     logger.debug(JSON.stringify({ ...params, __ow_headers: headers }))

     // post the message to external api endpoint
     var slackText = "Customer Login - " + JSON.stringify(params)

     const payload = {
       "text": slackText
     }

     const res = await fetch(params.SLACK_WEBHOOK, {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json'
       },
       body: JSON.stringify(payload)
     })
     if (!res.ok) {
       logger.info(`${res.status}: Something is wrong with your Slack webhook URL.`)
       return buildErrorResponse(res.status, { body: { message: 'Something is wrong with your Slack webhook URL.' } })
     }

     logger.info('200: successful request')
     return ok({ body: { message: "Commerce event information sent successfully." } })
   } catch (error) {
     // log any server errors
     logger.error(error)
     return internalServerError('server error')
   }
};

exports.main = main
