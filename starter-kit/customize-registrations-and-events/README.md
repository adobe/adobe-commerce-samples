# Customize Registrations and Events

This sample code shows how to customize the registrations and events predefined in the Adobe Commerce integration starter kit, to match the requirements of the integration you are building.

## Usage

The customizations implemented in the sample code include:
- registering only to the events relevant to the integration you are building. For example, the following `scripts/onboarding/config/starter-kit-registrations.json` indicate that your integration is only concerned about
    ```json
      {
          "product": ["commerce"],
          "customer": ["commerce", "backoffice"],
          "order": ["commerce"],
          "stock": []
      }
    ```
    - `product` and `order` events originating from Commerce
    - `customer` events originating from both systems
    - no `stock` events
- subscribing Commerce to propagate to App Builder only the events of interest to your integration.

To learn more about Adobe Commerce Integration Starter Kit configuration visit the [Complete the configuration](https://developer.adobe.com/commerce/extensibility/starter-kit/create-integration/#complete-the-configuration) Developer docs page.
  
After installation, configuration and deployment
- only the runtime actions relevant to the integration you are building will be deployed, and
- only the event registrations relevant to the integration you are building will be active.

## More information

To learn more about Adobe Commerce integration starter kit visit the [Developer docs](https://developer.adobe.com/commerce/extensibility/starter-kit/).
