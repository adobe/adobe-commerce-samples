# API Mesh Configuration with Custom Resolver

## Mocking a field in API Mesh

This is a sample API Mesh configuration that demonstrates how to use multiple commerce sources effortlessly in a single mesh.

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
        "name": "CommerceGraphql",
        "handler": {
          "graphql": {
            "endpoint": "{{env.COMMERCE_GRAPHQL_ENDPOINT}}"
          }
        }
      },
      {
        "name": "CommerceREST",
        "handler": {
          "openapi": {
            "source": "{{env.COMMERCE_REST_ENDPOINT}}"
          }
        }
      }
    ]
  }
}
```

Note: This mesh depends on few variables which need to be provided through `.env`. A [sample env file](./sample.env) has been provided to get started.

## Explanation

- **sources**: Defines the external sources to be included in the mesh. In this example, we are using 2 sources, the Adobe Commerce GraphQL endpoint and the Adobe Commerce REST endpoint.
