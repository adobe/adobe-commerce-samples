/*
Copyright 2026 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/
const NAMES = [
  "Ceramic planter",
  "Linen basket",
  "Desk organizer",
  "Travel tumbler",
  "Oak tray",
  "Canvas tote",
];

export function generateProduct() {
  const id = crypto.randomUUID();
  return {
    sku: `DEMO-${id}`,
    name: `${NAMES[Math.floor(Math.random() * NAMES.length)]} ${id.slice(0, 4)}`,
    price: Math.round((5 + Math.random() * 95) * 100) / 100,
  };
}

export function generateRows(count, products = null) {
  if (!Number.isInteger(count) || count < 1 || count > 500) {
    throw new Error("Choose a whole number between 1 and 500.");
  }
  const rows = Array.from({ length: count }, () => generateProduct());
  if (!products) {
    return rows;
  }
  return rows.map((row, index) => {
    if (index === 0 && products[0]) {
      return {
        type: "upsert",
        sku: products[0].sku,
        name: products[0].name,
        price: row.price,
      };
    }
    if (index === 1 && products[1]) {
      return { type: "discontinue", sku: products[1].sku };
    }
    return { type: "upsert", ...row };
  });
}
