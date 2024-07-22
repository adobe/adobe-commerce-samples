/*
Copyright 2022 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

const { Core, Events } = require('@adobe/aio-sdk')
const { stringParameters } = require('../../../actions/utils')
const { CloudEvent } = require('cloudevents')
const uuid = require('uuid')
const { HTTP_OK, HTTP_INTERNAL_ERROR, BACKOFFICE_PROVIDER_KEY} = require('../../../actions/constants')
const { getAdobeAccessToken } = require('../../../utils/adobe-auth')
const { getProviderByKey } = require('../../../utils/adobe-events-api')
const { errorResponse, successResponse } = require('../../responses')
const eventMappings = require("./event-mapping.json");
const {transformData} = require("./payload-transform");

/**
 * This web action allow external back-office application publish event to IO event using custom authentication mechanism.
 *
 * @param {object} params - method params includes environment and request data
 * @returns {object} - response with success status and result
 */
async function main (params) {
    const logger = Core.Logger('ingestion-scheduler', { level: params.LOG_LEVEL || 'info' })
    try {
        logger.info('Start processing request')
        logger.debug(`Scheduler main params: ${stringParameters(params)}`)

        // Faking the reading the events from STFP, S3, etc
        const externalEventPayload = {
            data: {
                uid: `${uuid.v4()}`,
                event: 'external_provider.customer_created.v1.0',
                value: {
                    PersonFirstName: 'Test',
                    PersonLastName: 'Customer',
                    PersonMiddleName: 'AC',
                    PrimaryContactEmail: `${uuid.v4()}@sample.com.au`,
                    CustomerGroupId: '30',
                    SalesCurrencyCode: 'USD',
                    PrimaryContactPhone: '555-555-1234',
                    PartyType: 'Person',
                    AddressStreet: '1 Test Street',
                    AddressCountryRegionISOCode: 'US',
                    AddressZipCode: '00210',
                    AddressCity: 'Portsmouth',
                    AddressState: 'NH',
                    AddressLocationRoles: 'Invoice',
                    AddressDescription: 'Test Billing',
                    DeliveryAddressStreet: '2 Test Avenue',
                    DeliveryAddressCountryRegionISOCode: 'US',
                    DeliveryAddressZipCode: '00210',
                    DeliveryAddressCity: 'Portsmouth',
                    DeliveryAddressState: 'NH',
                    DeliveryAddressDescription: 'Test Deliver'
                }
            }
        }

        // validate data

        // map event name
        const eventType = eventMappings[externalEventPayload.data?.event]

        // trim event payload
        const transformedEventData = transformData(externalEventPayload)

        // send event
        logger.debug('Generate Adobe access token')
        const accessToken = await getAdobeAccessToken(params)

        logger.debug('Get existing registrations')
        const provider = await getProviderByKey(params, accessToken, BACKOFFICE_PROVIDER_KEY)

        if (!provider) {
            const errorMessage = 'Could not find any external backoffice provider'
            logger.error(`${errorMessage}`)
            return errorResponse(HTTP_INTERNAL_ERROR, errorMessage)
        }

        logger.debug('Initiate events client')
        const eventsClient = await Events.init(
            params.OAUTH_ORG_ID,
            params.OAUTH_CLIENT_ID,
            accessToken)

        logger.info('Process event data')
        logger.debug(
            `Process event ${eventType}`)

        const cloudEvent = new CloudEvent({
            source: 'urn:uuid:' + provider.id,
            type: eventType,
            datacontenttype: 'application/json',
            data: transformedEventData,
            id: uuid.v4()
        })

        logger.debug(`Publish event ${eventType} to provider ${provider.label}`)
        await eventsClient.publishEvent(cloudEvent)

        logger.info(`Successful request: ${HTTP_OK}`)

        return successResponse(eventType, {
            success: true,
            message: 'Event published successfully'
        })
    } catch (error) {
        logger.error(`Server error: ${error.message}`)
        return errorResponse(HTTP_INTERNAL_ERROR, error.message)
    }
}

exports.main = main
