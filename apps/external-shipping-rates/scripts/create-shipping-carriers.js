/*
Copyright 2025 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import fs from "node:fs";

import yaml from "js-yaml";

import { getAdobeCommerceClient } from "../lib/adobe-commerce.js";

/**
 * Creates a shipping carrier defined in the shipping-carriers.yaml file in the configured Adobe Commerce instance
 * @param {string} configFilePath shipping-carriers.yaml file path
 * @returns  {string[]} array of strings
 */
export async function main(configFilePath) {
  console.info("Reading shipping configuration file...");
  const fileContents = fs.readFileSync(configFilePath, "utf8");
  const data = yaml.load(fileContents);
  console.info("Creating shipping carriers...");
  const createShippingMethods = [];

  const client = await getAdobeCommerceClient(process.env);

  for (const shippingCarrier of data.shipping_carriers) {
    const response = await client.createOopeShippingCarrier(shippingCarrier);
    const shippingCarrierCode = shippingCarrier.carrier.code;
    if (response.success) {
      console.info(`Shipping carrier ${shippingCarrierCode} created`);
      createShippingMethods.push(shippingCarrierCode);
    } else {
      console.error(
        `Failed to create shipping carrier ${shippingCarrierCode}: ` +
          response.message,
      );
    }
  }
  return createShippingMethods;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const configFile = process.argv[2] || "shipping-carriers.yaml";
  main(configFile).catch(console.error);
}
