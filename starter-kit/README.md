# Adobe Commerce integration starter kit samples

This section contains a collection of samples that show how the [Adobe Commerce integration starter kit](https://github.com/adobe/commerce-integration-starter-kit) can be customized to meet your business needs.
Each folder serves as a practical example of a particular customization.

## Overview

Use the Adobe Commerce integration starter kit to enrich customer shopping experiences and to support multichannel, global commerce for B2B, B2C, and hybrid businesses.

## Directory Structure

- `add-ingestion-scheduler`: Contains sample code of how to create an scheduled ingestion action.
- `customize-ingestion-webhook`: Contains sample code of how to customize the ingestion webhook.
- `customize-registrations-and-events`: Contains sample code of how to customize the registrations and events used by an integration built on top of the starter kit.

## Getting Started

To get started with these samples, follow these steps:

1. Clone the [Adobe Commerce integration starter kit](https://github.com/adobe/commerce-integration-starter-kit) repository.
   ```bash
   git clone git@github.com:adobe/commerce-integration-starter-kit.git
   ```
2. Navigate to the cloned directory.
   ```bash
   cd commerce-integration-starter-kit
   ```
3. Override the `commerce-integration-starter-kit` files with the files from the sample you want to use.
   ```bash
   cp -r <path-to-sample-folder>/* .
   ```
4. Install and deploy the starter kit following the instructions in the [README](https://github.com/adobe/commerce-integration-starter-kit/blob/main/README.md) 

## More information

To learn more about Adobe Commerce integration starter kit visit the [Developer docs](https://developer.adobe.com/commerce/extensibility/starter-kit/).
