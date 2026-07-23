/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { useOrderViewButtonContext } from "@adobe/aio-commerce-lib-admin-ui/web";

/** Entrypoint for the "Delete" order view button. */
export function DeleteOrderPage() {
  const { data, error } = useOrderViewButtonContext();
  if (error) {
    // Rethrowing sends the error to the error boundary set up by lib-admin-ui; you could also render fallback UI instead.
    throw error;
  }

  return (
    <main>
      <h1>Delete Order</h1>
      <p>Order ID to delete is: {data.orderId}</p>
    </main>
  );
}
