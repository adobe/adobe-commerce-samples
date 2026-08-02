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
  massActionErrorResponse,
  okMassActionResponse,
  parseMassActionRequest,
} from "@adobe/aio-commerce-sdk/admin-ui/mass-actions";
import { CommerceSdkValidationError } from "@adobe/aio-commerce-sdk/core/error";
import AioLogger from "@adobe/aio-lib-core-logging";

export function main(params) {
  const logger = AioLogger("customer-mass-action", {
    level: params.LOG_LEVEL || "info",
  });

  try {
    const { gridType, selectedIds } = parseMassActionRequest(params);
    logger.info(
      `Running "${gridType}" mass action for customer IDs: ${selectedIds.join(", ")}`,
    );

    return okMassActionResponse();
  } catch (error) {
    if (error instanceof CommerceSdkValidationError) {
      return massActionErrorResponse(400, error.display(false));
    }

    return massActionErrorResponse(500, error.message);
  }
}
