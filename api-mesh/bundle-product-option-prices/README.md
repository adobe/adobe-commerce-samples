# Commerce Bundle Special and Tier Price Mesh

An Adobe API Mesh example that uses an additional resolver to adjust bundle
option pricing on the product detail page (PDP). The resolver applies the parent
bundle's active special price or eligible
tier price, whichever produces the lower option price, to bundle option product
prices in the existing Commerce GraphQL response.

This is a GraphQL response adjustment only, not a checkout pricing engine. It does
not change product data, carts, or orders.

## What it changes

The additional resolver runs on `ComplexProductView.options` and adjusts only
the final price of products within a bundle's options:

```text
options[].values[].product.price.final.amount.value
```

It reads the parent bundle's special price and tier price from
Commerce REST, derives the **most favorable** discount factor, and applies:

```text
adjusted option final price = existing option final price * factor
```

The factor is the lowest (largest-discount) of the applicable mechanisms:

* **Special price** — for bundles this is the **percentage paid**, not percentage
  off. `80` means pay 80% (`factor 0.80`). It is only applied within its
  `special_from_date`/`special_to_date` window (the to-date is inclusive of its
  day). The window is evaluated in the store timezone.
* **Tier price** — for bundles this is the **percentage off**. `20` means pay
  80% (`factor 0.80`). The resolver reads tier discounts from the parent bundle's
  Commerce REST product response and selects the largest discount available to
  the request's customer group at a bundle quantity of 1.

### Files

| File | Purpose |
| --- | --- |
| [mesh.json](./mesh.json) | Example configuration for a new Mesh, or a reference for adding the REST source, resolver, and hook to an existing Mesh. |
| [additional-resolvers.js](./additional-resolvers.js) | Bundle option final-price adjustment. |
| [hooks.js](./hooks.js) | Obtains an IMS access token to authenticate Commerce REST requests. |
| [product-schema.json](./product-schema.json) | REST response schema for `type_id`, `custom_attributes`, and `tier_prices`. |
| [store-config-schema.json](./store-config-schema.json) | REST response schema for `storeConfigs` (`code`, `timezone`). |
| [secrets.yml.sample](./secrets.yml.sample) | Template for the server-side IMS credentials and scopes used by [hooks.js](./hooks.js). |

## Prerequisites

* Node.js and npm, using a Node.js version supported by Adobe I/O CLI.
* Adobe I/O CLI (`aio`) and the API Mesh plugin. If needed, install them:

  ```sh
  npm install -g @adobe/aio-cli
  aio plugins:install @adobe/aio-cli-plugin-api-mesh
  ```

  See the [API Mesh getting-started guide](https://developer.adobe.com/graphql-mesh-gateway/mesh/basic/)
  for CLI requirements and setup.
* An Adobe Commerce as a Cloud Service (ACCS) instance. Make a note of its
  **GraphQL endpoint** and **REST base URL**, for configuring the Mesh's
  Commerce sources.
* Access to the instance's Adobe organization in
  [Adobe Developer Console](https://developer.adobe.com/console), with permission
  to create an App Builder project.
* For an existing Mesh, its complete configuration and referenced files.

## Set up the Developer Console project

### 1. Create an App Builder project (new Mesh only)

If you have not yet created a Mesh, create an App Builder project using the
steps below. If you already have a Mesh, use its existing project and workspace
and continue to step 2.

1. Open [Adobe Developer Console](https://developer.adobe.com/console) and select
   the Adobe organization associated with your ACCS instance.
2. Select **Create new project > Project from template > App Builder**, then
   enter a project title and save it.
3. Open the workspace you will use for this Mesh.

### 2. Add the ACCS Commerce REST API

1. In the workspace, select **Add service > API**.
2. Find and select the Commerce REST API for **Adobe Commerce as a Cloud
   Service**.
3. Choose **OAuth Server-to-Server** authentication and create or select the
   credential.
4. When prompted, select the product profile that grants access to the target
   ACCS instance, and save the API configuration. Ensure the credential has
   permission to read products and store configuration.
5. Open the OAuth Server-to-Server credential details and record the **Client
   ID**, **Client Secret**, and **Scopes** in a `secrets.yml` file. If
   you do not already have one, initialize it from the sample in this directory:

   ```sh
   cp secrets.yml.sample secrets.yml
   ```

   If you already have a secrets file, add these values without
   replacing its existing entries.

The authentication hook uses these credentials to obtain an IMS access token.

### 3. Select the CLI workspace

Sign in and select the organization, project, and workspace configured above:

```sh
aio auth login
aio console org select
aio console project select
aio console workspace select
```

For an existing Mesh, confirm that you have selected the workspace that owns it.

## Configure the Mesh

### 1. Prepare the configuration and files

**New Mesh:** Use this repository's [mesh.json](./mesh.json) as the starting
configuration. Keep these four files alongside it:

* [additional-resolvers.js](./additional-resolvers.js)
* [hooks.js](./hooks.js)
* [product-schema.json](./product-schema.json)
* [store-config-schema.json](./store-config-schema.json)

**Existing Mesh:** Keep your complete configuration and copy the four files
above into its project directory. Merge the REST source, resolver registration,
and authentication hook described below.

### 2. Configure the Commerce sources

For a new Mesh, replace the example GraphQL endpoint and REST base URL in
[mesh.json](./mesh.json) with those for your ACCS instance:

* Set `CommerceSaaSGraphQl.handler.graphql.endpoint` to the instance's GraphQL
  endpoint.
* Set `CommerceRest.handler.JsonSchema.baseUrl` to the instance's REST base URL,
  for example `https://na1-sandbox.api.commerce.adobe.com/<TENANT_ID>`.

Make sure both endpoints use your ACCS instance's actual region and environment
host and point to the same Commerce environment. `na1-sandbox` is only an example.

For an existing Mesh, keep your existing Commerce GraphQL source and leave all
other sources unchanged. Add the `CommerceRest` source from [mesh.json](./mesh.json)
to `meshConfig.sources` in your Mesh configuration file. Set the REST base URL to 
match the environment used by your GraphQL source.

### 3. Register the resolver and hook

The example [mesh.json](./mesh.json) already registers the resolver and hook. When
extending an existing Mesh, append this path to `meshConfig.additionalResolvers`,
creating the array if it does not exist:

```json
"./additional-resolvers.js"
```

Register `./hooks.js#accsRestAuth` as a blocking `beforeAll` hook in
`meshConfig.plugins`, as shown in [mesh.json](./mesh.json). This hook obtains the
IMS access token before Commerce REST requests execute.

## Deploy the Mesh

From your project root, use your complete configuration and private secrets
file. Substitute your filenames if they differ.

### Create a new Mesh

If the selected workspace does not already have a Mesh:

```sh
aio api-mesh create mesh.json --secrets secrets.yml
```

### Update an existing Mesh

If the selected workspace already has a Mesh, update it using the **complete
merged configuration** and **complete private secrets file**:

```sh
aio api-mesh update mesh.json --secrets secrets.yml
```

### Confirm the deployment

Check the deployment status using:

```sh
aio api-mesh status
```

Wait until the status reports that the Mesh was built successfully before
querying it.

## Testing

To see the pricing adjustment, send a `products` query for a bundle SKU to the
deployed Mesh endpoint. Include these request headers with values for your
Commerce instance:

| Header | Value |
| --- | --- |
| `Magento-Website-Code` | Website code. |
| `Magento-Store-View-Code` | Store-view code belonging to that website and store. |
| `Magento-Store-Code` | Store code. |
| `Magento-Customer-Group` | Required for tier prices configured for a specific customer group: the SHA-1 hash of the numeric customer group ID as a string, not the raw ID. |

The `Magento-Customer-Group` header must match the group configured on the tier
price for that discount to take effect. Without it, only tiers configured for
ALL GROUPS are eligible; omitting the header does not select the guest group.

Replace `Bundle-01` with your bundle SKU:

```graphql
query BundlePricing {
  products(skus: ["Bundle-01"]) {
    sku
    ... on ComplexProductView {
      options {
        id
        values {
          ... on ProductViewOptionValueProduct {
            product {
              sku
              price {
                regular {
                  amount { value currency }
                }
                final {
                  amount { value currency }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

Inspect `options[].values[].product.price.final.amount.value` in the response.
It should reflect the parent bundle's active special price or eligible tier
price, whichever produces the lower option price. Only tier prices applicable
at a bundle quantity of 1 are considered.
