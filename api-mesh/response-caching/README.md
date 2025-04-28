# API Mesh Configuration with Response Caching

## Response Caching in API Mesh

This is a sample API Mesh configuration that demonstrates how to use API Mesh for Response Caching. Check [API Mesh Caching Documentation](https://developer.adobe.com/graphql-mesh-gateway/mesh/advanced/caching/) for further details.

![image](https://github.com/user-attachments/assets/b511c855-8714-4aee-9809-d3ceb3ae4fb2)

## Table of Contents

- [Configuration](#configuration)
- [Explanation](#explanation)

## Configuration

Here's the GraphQL Mesh configuration used in this example:

```json
{
  "meshConfig": {
    "sources": [
      {
        "name": "Commerce",
        "handler": {
          "graphql": {
            "endpoint": "{{env.COMMERCE_ENDPOINT}}"
          }
        },
        "responseConfig": {
          "cache": {
            "cacheControl": "public, max-age=120"
          }
        }
      }
    ],
    "responseConfig": {
      "cache": true
    }
  }
}
```

Note: This mesh depends on few variables which need to be provided through `.env`. A [sample env file](./sample.env) has been provided to get started.

## Explanation

- **sources**: Defines the external GraphQL API to be included in the mesh. In this example, we are using the Adobe Commerce GraphQL endpoint.
- **responseConfig.cache**: Enables response caching for the mesh. This will enable caching for GET and POST queries. Mutations and Error responses are ignored.
