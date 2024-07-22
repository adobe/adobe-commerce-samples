# Customize Event Ingestion Webhook

This sample code shows how to customize the event ingestion webhook provided by the Adobe Commerce integration starter kit.
The customizations implemented in the sample code include:
- mapping the incoming event name to the event name configured in the external event provider
- trimming the incoming event data to match the data expected by the external event

## Getting Started

To get started with these samples, follow these steps:

1. Clone the [Adobe Commerce integration starter kit](https://github.com/adobe/commerce-integration-starter-kit) repository
   ```bash
   git clone git@github.com:adobe/commerce-integration-starter-kit.git
   ```
2. Navigate to the cloned directory
   ```bash
   cd commerce-integration-starter-kit
   ```
3. Override the `commerce-integration-starter-kit` files with the files from the sample you want to use
   ```bash
   cp -r <path-to-sample-folder>/* .
   ```
4. Install and deploy the starter kit following the instructions in the [README](https://github.com/adobe/commerce-integration-starter-kit/blob/main/README.md)

## Usage

After installation and configuration, the event ingestion webhook can be activated by running the following command in a terminal
```bash
curl --request POST \
  --url https://${PROJECT_NAMESPACE}.adobeioruntime.net/api/v1/web/ingestion/webhook \
  --header 'Content-Type: application/json' \
  --data '{
    "data": {
        "uid": "${UUID}",
        "event": "external_provider.customer_created.v1.0",
        "value": {
            "PersonFirstName": "Test",
            "PersonLastName": "Customer",
            "PersonMiddleName": "AC",
            "PrimaryContactEmail": "${UNIQUE_EMAIL_ADDRESS}",
            "CustomerGroupId": "30",
            "SalesCurrencyCode": "USD",
            "PrimaryContactPhone": "555-555-1234",
            "PartyType": "Person",
            "AddressStreet": "1 Test Street",
            "AddressCountryRegionISOCode": "US",
            "AddressZipCode": "00210",
            "AddressCity": "Portsmouth",
            "AddressState": "NH",
            "AddressLocationRoles": "Invoice",
            "AddressDescription": "Test Billing",
            "DeliveryAddressStreet": "2 Test Avenue",
            "DeliveryAddressCountryRegionISOCode": "US",
            "DeliveryAddressZipCode": "00210",
            "DeliveryAddressCity": "Portsmouth",
            "DeliveryAddressState": "NH",
            "DeliveryAddressDescription": "Test Delivery"
        }
    }
}'
```

## More information

To learn more about Adobe Commerce integration starter kit visit the [Developer docs](https://developer.adobe.com/commerce/extensibility/starter-kit/).
