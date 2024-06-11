# API Mesh Configuration with Custom Resolver
## Mocking a field in API Mesh

This is a sample API Mesh configuration that demonstrates how to use multiple commerce sources effortlessly in a single mesh.

## Table of Contents

- [Configuration](#configuration)

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
            "endpoint": "https://venia.magento.com/graphql"
          }
        }
      },
      {
        "name": "CommerceREST",
        "handler": {
          "openapi": {
            "source": "https://venia.magento.com/rest/all/schema?services=all"
          }
        }
      }
    ]
  }
}

```

### Explanation

- **sources**: Defines the external sources to be included in the mesh. In this example, we are using 2 sources, the Adobe Commerce GraphQL endpoint and the Adobe Commerce REST endpoint.