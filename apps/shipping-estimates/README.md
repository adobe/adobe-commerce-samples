# Adobe Commerce checkout starter kit

Welcome to the home of Adobe Commerce checkout starter kit.

This starter kit is designed to help you get started with building custom checkout experiences for Adobe Commerce. Its
goal is to showcase how to use Adobe Commerce Extensibility in combination with Adobe App Builder to build custom
checkout experiences.

For more details, please refer to the [Adobe Commerce checkout starter kit documentation](https://developer.adobe.com/commerce/extensibility/starter-kit/checkout/).

---

# Template: `<project-name>`

_The following is an example app installation guide. For more details, please refer to the [App submission guidelines](https://developer.adobe.com/commerce/extensibility/app-development/app-submission-guidelines/)._

_Note that this template could be outdated. Make sure to refer to the latest information in the [Adobe Commerce checkout starter kit documentation](https://developer.adobe.com/commerce/extensibility/starter-kit/checkout/)._

## Prerequisites

You must install or have access to the following prerequisites to develop with `<project-name>`:

- Adobe Commerce as a Cloud Service (SaaS) or Adobe Commerce version `2.4.5` or higher (PaaS).

- [Node.js](https://nodejs.org/) version 22. If you have Node Version Manager (`nvm`) installed, you can run the following command to install and use the required version:

  ```bash
  nvm install 22 && nvm use
  ```

- [Adobe I/O CLI](https://developer.adobe.com/app-builder/docs/guides/runtime_guides/tools/cli-install):

  ```bash
  npm install -g @adobe/aio-cli
  ```

- Access to the [Adobe Developer Console](https://console.adobe.io/) with an App Builder license.

### Install Adobe Commerce Modules (PaaS only)

_List only necessary modules for the project._

- Install the required modules for `<project-name>`:

  ```bash
  composer require magento/module-out-of-process-payment-methods --with-dependencies
  composer require magento/module-out-of-process-shipping-methods --with-dependencies
  composer require magento/module-out-of-process-tax-management --with-dependencies
  ```

- For Commerce Webhook, refer to the [Install Adobe Commerce Webhooks](https://developer.adobe.com/commerce/extensibility/webhooks/installation/)

- (If using Eventing) Update Commerce Eventing module to version `1.12.1` or higher:

  ```bash
  composer show magento/commerce-eventing
  composer update magento/commerce-eventing --with-dependencies
  ```

- (If using Admin UI SDK) Complete the [Admin UI SDK installation process](https://developer.adobe.com/commerce/extensibility/admin-ui-sdk/installation/) and install version `3.0.0` or higher:

  ```bash
  composer require "magento/commerce-backend-sdk": ">=3.0"
  ```

### Create an App Builder project in Developer Console

1. Log in to the [Adobe Developer Console](https://console.adobe.io/) and select the desired organization from the dropdown menu in the top-right corner.

1. Click **Create new project from template**.

1. Select **App Builder**. The **Set up templated project** page displays.

1. Specify a project title and app name. Mark the **Include Runtime with each workspace** checkbox.

## Initialize App Builder project

1.  Navigate to the downloaded code and run:

    ```bash
    npm install
    aio login
    aio console org select
    aio console project select
    aio console workspace select
    aio app use --merge
    ```

1.  Add required services to your project:

    ```bash
    aio app add service
    ```

    Select the following from the list:
    - I/O Management API
    - (If using Eventing) I/O Events
    - (If using Eventing) Adobe I/O Events for Adobe Commerce
    - (If connecting to Adobe Commerce as a Cloud Service) Adobe Commerce as a Cloud Service

1.  Copy the environment variables from the `env.dist` to a local `.env` file. We will complete the required variables in the upcoming sections.

1.  Run the following command to populate the relevant `.env` values:

    ```bash
    npm run sync-oauth-credentials
    ```

    This will generate entries:

    ```env
    OAUTH_CLIENT_ID=
    OAUTH_CLIENT_SECRETS=[""]
    OAUTH_TECHNICAL_ACCOUNT_ID=
    OAUTH_TECHNICAL_ACCOUNT_EMAIL=
    OAUTH_SCOPES=[""]
    OAUTH_IMS_ORG_ID=
    ```

    - This script is also configured as a pre-app-build hook and will auto-sync when a build is triggered.

    - If the credential is empty, make sure you have added the `I/O Management API` and your `.env` is synced with the Developer Console Project.

## Connect to Adobe Commerce

Update the `COMMERCE_BASE_URL` value in the `.env` file and complete the authentication setup:

- For PaaS (On-Premise/Cloud):
  - The base URL includes your base site URL + `/rest/<store_view_code>/`
  - Example: `https://<commerce_instance_url>/rest/all/`
- For SaaS (Adobe Commerce as a Cloud Service):
  - Go to Commerce Cloud Manager in [Adobe Experience Cloud](https://experience.adobe.com/) and click info button on the instance > GraphQL endpoint URL.
  - Example: `https://na1.api.commerce.adobe.com/<tenant_id>/`

### Option 1: Authenticate with IMS

- For PaaS, this process requires a Commerce instance with [Adobe Identity Management Service (IMS) for Adobe Commerce](https://experienceleague.adobe.com/docs/commerce-admin/start/admin/ims/adobe-ims-integration-overview.html) configured.
- For SaaS, IMS configuration is included by default.

To create OAuth credentials for App Builder authentication:

1. Access your IMS credentials via the [Adobe Developer Console](https://developer.adobe.com/console). Select the project and workspace, then click **OAuth Server-to-Server** in the side-navigation menu.

   **Note:** You can find these credentials already in your `.env` as `OAUTH_*`.

1. Add a technical account with server-to-server credentials to Commerce Admin using the [Admin User Creation Guide](https://experienceleague.adobe.com/en/docs/commerce-admin/systems/user-accounts/permissions-users-all#create-a-user).

1. When associating the user, use the **Technical Account email** from the generated IMS credentials (`<technical-account>@techacct.adobe.com`) in the **Email** field.

1. On the **User Role** tab, assign the necessary API integration permissions and save the user.

### Option 2: Authenticate with Commerce Integration (PaaS only)

1. Create a new Adobe Commerce Integration by following the [systems integration](https://experienceleague.adobe.com/en/docs/commerce-admin/systems/integrations) guide.

1. Copy the integration details to the `.env` file in the root of the project.

   ```env
   COMMERCE_CONSUMER_KEY=<key>
   COMMERCE_CONSUMER_SECRET=<secret>
   COMMERCE_ACCESS_TOKEN=<access token>
   COMMERCE_ACCESS_TOKEN_SECRET=<access token secret>
   ```

## Configuration

### Configure `<project-name>`

_Describe any credentials required for the app._

### Configure Payment Method

Create a payment method defined in `payment-methods.yaml`:

```bash
npm run create-payment-methods
```

Update the `.env` with your payment method code, which is used for the payment method validation webhook:

```env
COMMERCE_PAYMENT_METHOD_CODES=["<your-payment-code>"]
```

### Configure Shipping Method

Create a shipping method defined in `shipping-carriers.yaml`:

```bash
npm run create-shipping-carriers
```

### Configure Tax Integration

Create a tax integration defined in `tax-integrations.yaml`:

```bash
npm run create-tax-integrations
```

### Configure Webhooks

#### Prepare Webhook Signature

1. In Adobe Commerce, go to **Stores > Settings > Configuration > Adobe Services > Webhooks**
1. Enable **Digital Signature Configuration** and click **Regenerate Key Pair**
1. Add the generated **Public Key** to your `.env` as [the same format](https://developer.adobe.com/commerce/extensibility/webhooks/signature-verification/#verify-the-signature-in-the-app-builder-action):

   ```env
   COMMERCE_WEBHOOKS_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
   XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   -----END PUBLIC KEY-----"
   ```

#### Create Webhooks

After deploying your App Builder actions, [create the webhooks](https://developer.adobe.com/commerce/extensibility/webhooks/create-webhooks/) with the following actions:

_List all webhook methods and their corresponding actions required for the application._

1. `collect-taxes`: This action collects taxes for the cart.
   - For SaaS, register your action to `plugin.magento.out_of_process_tax_management.api.oop_tax_collection.collect_taxes` webhook method in **System > Webhooks > Webhooks Subscriptions**.
   - For PaaS, please refer to `webhooks.xml`. Replace the app builder URL with your action after deploying the App Builder application.

     ```xml
     <config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_AdobeCommerceWebhooks:etc/webhooks.xsd">
         <method name="plugin.magento.out_of_process_tax_management.api.oop_tax_collection.collect_taxes" type="before">
             <hooks>
                 <batch name="collect_taxes">
                     <hook
                         name="collect_taxes"
                         url="https://<your_app_builder>.runtime.adobe.io/api/v1/web/<your-project>/collect-taxes"
                         method="POST" timeout="10000" softTimeout="2000"
                         priority="300" required="true" fallbackErrorMessage="Tax calculation failed. Please try again later."
                         ttl="0"
                     />
                 </batch>
             </hooks>
         </method>
     </config>
     ```

### Configure Eventing

Follow the steps below to configure eventing for your application:

#### Create Event Provider

Configure the event provider defined in `events.config.yaml`:

```bash
npm run configure-events
```

This scripts populates the `AIO_EVENTS_PROVIDERMETADATA_TO_PROVIDER_MAPPING` environment variable in your `.env` file with the provider metadata and the provider id.

#### Configure Commerce Eventing

To configures the Commerce event provider for your Commerce instance:

1. Update your `.env` file with the Commerce event provider metadata in **Stores > Configuration > Adobe Services > Adobe I/O Events > Commerce events**:

   ```env
   COMMERCE_ADOBE_IO_EVENTS_MERCHANT_ID=
   COMMERCE_ADOBE_IO_EVENTS_ENVIRONMENT_ID=
   ```

1. Run the following script to configure the Commerce Event module to your Commerce. This uses the commerce event provider `dx_commerce_events` defined in `events.config.yaml`:

   ```bash
   npm run configure-commerce-events
   ```

Once this step is done, [deploy the application](#deploy-your-application) to register the events to your App Builder application.

## Deploy Your Application

Once all configuration steps are complete, deploy the application:

```bash
aio app deploy --force-build --force-deploy
```

## Validation

_Write your validation steps here_

To verify the application:

1. Check that payment, shipping, and tax methods appear on the Checkout page.
1. Place an order and confirm that it is successfully created with the expected configurations.
