# API Mesh Configuration with Custom Resolver

## Mocking a field in API Mesh

This is a sample API Mesh configuration that demonstrates how to extend the GraphQL Query type with a custom field and add a resolver to return a specific mock response.

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
        }
      }
    ],
    "additionalTypeDefs": ["extend type Query {\n  mockedField: String\n}"],
    "additionalResolvers": ["./resolvers.js"]
  }
}
```

Note: This mesh depends on few variables which need to be provided through `.env`. A [sample env file](./sample.env) has been provided to get started.

## Explanation

- **sources**: Defines the external GraphQL API to be included in the mesh. In this example, we are using the Adobe Commerce GraphQL endpoint.
- **additionalTypeDefs**: Extends the existing GraphQL schema by adding a new field `mockedField` to the Query type.
- **additionalResolvers**: Points to a resolver file that contains the logic to resolve the `mockedField`.
