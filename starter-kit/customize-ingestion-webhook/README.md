# Customize Event Ingestion Webhook

This sample code shows how to customize the event [ingestion webhook](https://developer.adobe.com/commerce/extensibility/starter-kit/events/#ingestion-webhook) provided by the Adobe Commerce integration starter kit.
The customizations implemented in the sample code include:
- mapping the incoming event name to the event name configured in the external event provider
- trimming the incoming event data to match the data expected by the external event

## Usage

After installation and configuration, activate the event ingestion webhook by running the following command in a terminal.
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
