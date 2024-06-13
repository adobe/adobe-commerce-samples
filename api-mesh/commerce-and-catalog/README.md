# API Mesh Configuration with Multiple Sources

## Using Commerce and Catalog Services through API Mesh

This is an example API Mesh configuration that demonstrates how to use Commerce and [Catalog Services](https://developer.adobe.com/commerce/services/graphql/catalog-service/) through API Mesh.

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
            "endpoint": "{{env.CATALOG_ENDPOINT}}",
            "useGETForQueries": true,
            "schemaHeaders": {
              "Content-Type": "application/json",
              "x-api-key": "{{env.CATALOG_API_KEY}}"
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

Note: This mesh depends on few variables which need to be provided through `.env`. A [sample env file](./sample.env) has been provided to get started.

## Explanation

- **sources**: Defines the GraphQL API to be included in the mesh. In this example, we are using the Adobe Commerce GraphQL endpoint and Adobe Commerce Catalog endpoint.
- **transforms**:
  - **filterSchema**: Filter Schema Transform can be used to include or remove certain operations / types from the schema. In this example we are using the filterSchema transform on the Adobe Commerce Source to remove certain queries and mutations that collide with the Catalog Schema.
- **operationHeaders**: Defines headers forwarding to sources. In this example, we are using operationHeaders to forward few incoming headers to the respective sources using context. We do this because the Catalog service depends on these headers forwarded to it to process the request.
- **schemaHeaders**: Defined headers needed for schema building. In this example, we have added 2 headers to the Catalog source that need to be forwarded to the Catalog API to retrieve the introspection schema.

## Verification Steps

Create a mesh using the above config and run a few sample catalog / commerce [queries](./queries/) and [mutations](./mutations/).

![image](https://github.com/adobe/adobe-commerce-samples/assets/35203638/00c3553e-74df-4c7a-b795-ce62b75b34c3)
