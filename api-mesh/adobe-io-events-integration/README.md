# Adobe IO Events Integration

This project integrates Adobe Commerce with Adobe IO Events using an API mesh configuration. Below is an explanation of the configuration and how to use it.

## Configuration

The configuration is defined in the `mesh.json` file and uses environment variables specified in the `.env` file.

### Environment Variables

- `COMMERCE_ENDPOINT`: The endpoint for the Adobe Commerce GraphQL API.
- `BEARER_TOKEN`: oauth_s2s_token is an OAuth Server-to-Server token generated using the set up from the same workspace
- `API_KEY`: The api-key associated with your Adobe Developer Console workspace
- `IS_PHI_DATA`: s a boolean value indicating if the event contains PHI data, and is required for HIPAA compliance (defaults to false if not provided)

### mesh.json

The `mesh.json` file defines the API mesh configuration. It includes two sources: `AdobeCommerceAPI` and `EventsAPI`.

#### AdobeCommerceAPI

This source connects to the Adobe Commerce GraphQL API using the endpoint specified in the `COMMERCE_ENDPOINT` environment variable.

```json
{
    "name": "AdobeCommerceAPI",
    "handler": {
        "graphql": {
            "endpoint": "{{env.COMMERCE_ENDPOINT}}"
        }
    }
}
```

#### EventsAPI

This source connects to the Adobe IO Events Provider API using the base URL specified in the mesh config. It includes operation headers for authentication and content type, and defines a mutation operation for sending events.

```json
{
    "name": "EventsAPI",
    "handler": {
        "JsonSchema": {
            "baseUrl": "{{env.EVENTS_ENDPOINT}}",
            "operationHeaders": {
                "x-api-key": "{{env.API_KEY}}",
                "Authorization": "Bearer {{env.BEARER_TOKEN}}",
                "Content-Type": "application/cloudevents+json",
                "x-event-phidata": "{{env.IS_PHI_DATA}}"	
            },
            "operations": [
                {
                    "type": "Mutation",
                    "field": "sendEvent",
                    "method": "POST",
                    "path": "/",
                    "requestSchema": "./request-schema.json",
                    "responseTypeName": "GetDataResponse"
                }
            ]
        }
    }
}
```
### Usage

1. Clone the repository.
2. Create a .env file in the api-mesh/adobe-io-events-integration directory with the required environment variables.
3. Update the mesh.json file if necessary.

Create a mesh with the above config and resolver. Run the following command to verify:

```graphql
mutation {
  sendEvent(input: {
    id: "1009",
    type:"your.apimesh.test.event_code",
    data: "{\"id\":12345,\"name\":\"John Doe\",\"email\":\"johndoe@example.com\",\"active\":true}",
    source: "urn:uuid:{provider_id}"
  }) 
}
```

This configuration allows you to seamlessly integrate Adobe Commerce with Adobe IO Events, enabling you to send events from your commerce platform to Adobe IO.

For more details, refer to the official documentation of Adobe Commerce and Adobe IO Events.