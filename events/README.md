# Adobe I/O Events Samples

This section contains a collection of samples that demonstrate the use of Adobe I/O Events for Adobe Commerce.
Each sample demonstrates the effective use of Adobe I/O Events to build event-driven integrations with Adobe Commerce.

## Applications List

The samples covered in this section include:

- [Adobe Commerce customer login](./commerce-customer-login) — listens to the Commerce `observer.customer_login` event and forwards the payload to a Slack channel.
- [Circuit breaker (infinite-loop breaker)](./circuit-breaker) — bidirectional product sync between Commerce and an external back-office system, guarded by a circuit breaker so a single change does not echo forever.

Please refer to the README file of each individual sample for more details.

## Getting Started

To get started with these applications, simply navigate to the directory of the application you are interested in and follow the instructions provided in its README file.

## More information

For more information about Adobe I/O Events for Adobe Commerce, refer to the [documentation](https://developer.adobe.com/commerce/extensibility/events/)
