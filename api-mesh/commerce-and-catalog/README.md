# API Mesh Configuration with Multiple Sources

## Using Commerce and Catalog Services through API Mesh

This is an example API Mesh configuration that demonstrates how to use Commerce and Catalog Services through API Mesh.

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
            "endpoint": "https://integration-5ojmyuq-7yvbzwvtkgerq.us-4.magentosite.cloud/graphql",
            "useGETForQueries": true,
            "operationHeaders": {
              "Content-Type": "application/json",
              "Store": "{context.headers['store']}",
              "Authorization": "context.headers['Authorization']"
            }
          }
        },
        "transforms": [
          {
            "filterSchema": {
              "mode": "bare",
              "filters": [
                "Query.!category",
                "Query.!customerOrders",
                "Query.!products",
                "Query.!categories",
                "Query.!urlResolver",
                "Query.!wishlist",
                "Query.!categoryList",
                "Mutation.!setPaymentMethodAndPlaceOrder",
                "Mutation.!addBundleProductsToCart",
                "Mutation.!addConfigurableProductsToCart",
                "Mutation.!addDownloadableProductsToCart",
                "Mutation.!addSimpleProductsToCart",
                "Mutation.!addVirtualProductsToCart",
                "Mutation.!createCustomer",
                "Mutation.!updateCustomer"
              ]
            }
          }
        ]
      },
      {
        "name": "CatalogAPI",
        "handler": {
          "graphql": {
            "endpoint": "https://catalog-service-sandbox.adobe.io/graphql",
            "useGETForQueries": true,
            "schemaHeaders": {
              "Content-Type": "application/json",
              "x-api-key": "9753cd30401a477e816ed850c4f77e18"
            },
            "operationHeaders": {
              "Content-Type": "application/json",
              "Magento-Environment-Id": "{context.headers['magento-environment-id']}",
              "Magento-Website-Code": "{context.headers['magento-website-code']}",
              "Magento-Store-View-Code": "{context.headers['magento-store-view-code']}",
              "Magento-Store-Code": "{context.headers['magento-store-code']}",
              "Magento-Customer-Group": "{context.headers['magento-customer-group']}",
              "x-api-key": "{context.headers['x-api-key']}",
              "Authorization": "context.headers['Authorization']"
            }
          }
        }
      }
    ]
  }
}

```

### Explanation

- **sources**: Defines the GraphQL API to be included in the mesh. In this example, we are using the Adobe Commerce GraphQL endpoint and Adobe Commerce Catalog endpoint.
- **transforms**:
    - **filterSchema**: Filter Schema Transform can be used to include or remove certain operations / types from the schema. In this example we are using the filterSchema transform on the Adobe Commerce Source to remove certain queries and mutations that collide with the Catalog Schema.
- **operationHeaders**: Defines headers forwarding to sources. In this example, we are using operationHeaders to forward few incoming headers to the respective sources using context.
- **schemaHeaders**: Defined headers needed for schema building. In this example, we have added 2 headers to the Catalog source that need to be forwarded to the Catalog API to retrieve the introspection schema.