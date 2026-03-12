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

/**
 * Extension Registration Component
 *
 * @returns {Promise<{statusCode: number, body: object}>} The HTTP response with status code and body
 */
export function main() {
  const sectionId = "oope_checkout_extensions";

  return {
    statusCode: 200,
    body: {
      registration: {
        menuItems: [
          {
            id: `${sectionId}::apps`,
            title: "Apps",
            isSection: true,
            sortOrder: 100,
          },
          {
            id: `${sectionId}::delivery_estimates`,
            title: "Delivery Estimates",
            parent: `${sectionId}::apps`,
            sortOrder: 1,
          },
        ],
        page: {
          title: "Delivery Estimates",
        },
      },
    },
  };
}
