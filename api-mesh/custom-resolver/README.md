# API Mesh Custom Resolver Example

This is an example for API Mesh custom resolver.

## Table of Contents

- [Introduction](#introduction)
- [Prerequisites](#prerequisites)
- [Explanation](#explanation)

## Introduction

Custom resolvers allow developers to extend the schema and apply some different business logic to the final result.

## Prerequisites

Before you begin, ensure you have the following:

- An Adobe Developer account
- Node.js and npm installed on your local machine (nvm 18.x.x (Mac/Linux) or nvm-windows (Windows))
- API Mesh configured for your project.

## Explanation

With this mesh config and custom resolver we can return two new fields, ```capital``` and ```currency```, to the final result. The data for these fields will be retrieved from Trevorblades GraphQl.

```graphql
{
    ACOM_country(id: "US") {
        available_regions {
        code
        id
        name
        }
        full_name_english
        full_name_locale
        id
        three_letter_abbreviation
        two_letter_abbreviation
        capital
        currency
    }
}
```

### Mesh configuration used in this example:

```json
{
  "meshConfig": {
    "sources": [
      {
        "name": "ACOMGQL",
        "handler": {
          "graphql": {
            "endpoint": "https://venia.magento.com/graphql"
          }
        },
        "transforms": [
          {
            "prefix": {
              "includeRootOperations": true,
              "value": "ACOM_"
            }
          }
        ]
      },
      {
        "name": "TBGQL",
        "handler": {
          "graphql": {
            "endpoint": "https://countries.trevorblades.com/graphql"
          }
        },
        "transforms": [
          {
            "prefix": {
              "includeRootOperations": true,
              "value": "TB_"
            }
          }
        ]
      }
    ],
    "additionalTypeDefs": "extend type ACOM_Country { capital: String currency: String }",
    "additionalResolvers": [
      "./resolvers/cc-resolver.js"
    ]
  }
}
```
