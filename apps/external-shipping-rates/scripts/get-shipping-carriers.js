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

import { getAdobeCommerceClient } from "../lib/adobe-commerce.js";

/**
 * Retrieves all shipping carrier from the configured Adobe Commerce instance
 */
export async function main() {
  const client = await getAdobeCommerceClient(process.env);
  const response = await client.getOopeShippingCarriers();
  console.info("Fetching shipping carriers...");
  if (response.success) {
    console.info(
      `Total ${response.message.length} shipping carriers fetched: ${response.message
        .map((carrier) => `\n${JSON.stringify(carrier, null, 2)}`)
        .join("")}`,
    );
  } else {
    console.error(`Failed to retrieve shipping carriers${response.message}`);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
