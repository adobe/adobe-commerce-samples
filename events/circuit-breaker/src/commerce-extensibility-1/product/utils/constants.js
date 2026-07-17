/**
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

import appConfig from "#app.commerce.config";

/** The back-office product update event */
export const BACK_OFFICE_PRODUCT_UPDATE_EVENT =
  "be-observer.catalog_product_update";

/** The Commerce product-save event. */
export const COMMERCE_PRODUCT_UPDATE_EVENT =
  "observer.catalog_product_save_commit_after";

/** The back-office provider key */
export const BACKOFFICE_PROVIDER_KEY =
  appConfig.eventing.external[0].provider.key;
