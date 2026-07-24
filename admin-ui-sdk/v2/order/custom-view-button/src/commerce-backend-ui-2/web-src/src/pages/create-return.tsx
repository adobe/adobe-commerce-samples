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

import {
  useHostConnection,
  useOrderViewButtonContext,
} from "@adobe/aio-commerce-lib-admin-ui/web";
import { Button } from "@react-spectrum/s2";

/** Entrypoint for the "Create Return" order view button. */
export function CreateReturnPage() {
  const { data, error } = useOrderViewButtonContext();
  const { actions, error: hostError } = useHostConnection();

  // Custom handling: close the iframe and flag an error state instead of rethrowing to the lib-admin-ui error boundary.
  if (error || hostError) {
    actions?.closeWithError();
    return null;
  }

  return (
    <main>
      <h1>Request Return</h1>
      <p>Order ID is: {data.orderId}</p>
      <Button onPress={actions.close} variant="primary">
        Done
      </Button>
    </main>
  );
}
