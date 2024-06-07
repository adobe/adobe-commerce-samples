# API Mesh Configuration with Custom Resolver
## Implementing a Custom Field in API Mesh

This is an example API Mesh configuration that demonstrates how to extend the GraphQL Query type with a custom field and add a resolver to connect it to an existing source.

In this example, we will connect the Commerce Source with the Announcements Source and implement an announcement field on the storeConfig.

## Table of Contents

- [Configuration](#configuration)

## Configuration

Here's the GraphQL Mesh configuration used in this example:

```json
{
  "meshConfig": {
    "sources": [
      {
        "name": "CommerceAPI",
        "handler": {
          "graphql": {
            "endpoint": "https://venia.magento.com/graphql/",
            "useGETForQueries": true,
            "operationHeaders": {
              "Content-Type": "application/json",
              "Store": "{context.headers['store']}",
              "Authorization": "context.headers['Authorization']"
            }
          }
        }
      },
      {
        "name": "Announcements",
        "handler": {
          "JsonSchema": {
            "baseUrl": "https://announcements-api.apimesh-adobe-test.workers.dev",
            "operations": [
              {
                "type": "Query",
                "field": "announcements",
                "path": "/",
                "method": "GET",
                "responseSample": "./samplesAnnouncement.json"
              }
            ]
          }
        }
      }
    ],
    "additionalTypeDefs": "extend type StoreConfig {announcement: String}",
    "additionalResolvers": ["./resolvers.js"]
  }
}

```

### Explanation

- **sources**: Defines the external GraphQL API to be included in the mesh. In this example, we are using the Adobe Commerce GraphQL endpoint.
- **additionalTypeDefs**: Extends the existing GraphQL schema by adding a new field `announcement` to the StoreConfig type.
- **additionalResolvers**: Points to a resolver file that contains the logic to resolve the `announcement` on the StoreConfig type.