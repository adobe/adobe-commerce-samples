# API Mesh Configuration with Custom Resolver

## Implementing a Custom Field in API Mesh

This is an example API Mesh configuration that demonstrates how to extend the GraphQL Query type with a custom field and add a resolver to connect it to an existing source.

In this example, we will connect the Commerce Source with the Announcements Source and implement an announcement field on the storeConfig.

## Table of Contents

- [Configuration](#configuration)
- [Explanation](#explanation)
- [Verification Steps](#verification-steps)

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
            "endpoint": "{{env.COMMERCE_ENDPOINT}}",
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
            "baseUrl": "{{env.ANNOUNCEMENTS_ENDPOINT}}",
            "operations": [
              {
                "type": "Query",
                "field": "announcements",
                "path": "/",
                "method": "GET",
                "responseSample": "{{env.ANNOUNCEMENTS_ENDPOINT}}"
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

Note: This mesh depends on few variables which need to be provided through `.env`. A [sample env file](./sample.env) has been provided to get started.

## Explanation

- **sources**: Defines the external GraphQL API to be included in the mesh. In this example, we are using the Adobe Commerce GraphQL endpoint.
- **additionalTypeDefs**: Extends the existing GraphQL schema by adding a new field `announcement` to the StoreConfig type.
- **additionalResolvers**: Points to a resolver file that contains the logic to resolve the `announcement` on the StoreConfig type.

## Verification Steps

Create a mesh with the above config and resolver. Run the following command to verify:

```graphql
{
  storeConfig {
    announcement
  }
}
```

<img width="1303" alt="image" src="https://github.com/adobe/adobe-commerce-samples/assets/35203638/fce4ebea-05a7-483e-966e-543790c45080">
