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
 * Checkout Metrics Definitions
 *
 * Defines OpenTelemetry metrics for checkout actions using dimensions/attributes pattern.
 * For more information on metrics, see:
 * https://github.com/adobe/aio-lib-telemetry/blob/main/docs/usage.md#metrics
 */

import { defineMetrics } from "@adobe/aio-lib-telemetry";
import { ValueType } from "@adobe/aio-lib-telemetry/otel";

/** Metrics for checkout-related actions. */
export const checkoutMetrics = defineMetrics((meter) => {
  return {
    // Payment Metrics
    validatePaymentCounter: meter.createCounter(
      "checkout.validate_payment.requests_total",
      {
        description: "Total number of validate payment requests.",
        valueType: ValueType.INT,
      },
    ),
    filterPaymentCounter: meter.createCounter(
      "checkout.filter_payment.requests_total",
      {
        description: "Total number of filter payment requests.",
        valueType: ValueType.INT,
      },
    ),

    // Shipping Methods Metrics
    shippingMethodsCounter: meter.createCounter(
      "checkout.shipping_methods.requests_total",
      {
        description: "Total number of shipping methods requests.",
        valueType: ValueType.INT,
      },
    ),

    // Tax Metrics
    collectTaxesCounter: meter.createCounter(
      "checkout.collect_taxes.requests_total",
      {
        description: "Total number of collect taxes requests.",
        valueType: ValueType.INT,
      },
    ),
    collectAdjustmentTaxesCounter: meter.createCounter(
      "checkout.collect_adjustment_taxes.requests_total",
      {
        description: "Total number of collect adjustment taxes requests.",
        valueType: ValueType.INT,
      },
    ),
  };
});
