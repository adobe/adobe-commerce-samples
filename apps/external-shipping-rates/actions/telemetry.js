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
 * Telemetry Configuration for Adobe App Builder Actions
 *
 * This file configures OpenTelemetry instrumentation using @adobe/aio-lib-telemetry.
 *
 * Official Documentation:
 * - Usage Guide: https://github.com/adobe/aio-lib-telemetry/blob/main/docs/usage.md
 * - API Reference: https://github.com/adobe/aio-lib-telemetry/blob/main/docs/api-reference/README.md
 * - OpenTelemetry Concepts: https://github.com/adobe/aio-lib-telemetry/blob/main/docs/concepts/open-telemetry.md
 * - Export data: https://github.com/adobe/aio-lib-telemetry/tree/main/docs/use-cases)
 * @see https://github.com/adobe/aio-lib-telemetry
 */

import {
  defineTelemetryConfig,
  getAioRuntimeResource,
  getPresetInstrumentations,
} from "@adobe/aio-lib-telemetry";
import {
  OTLPLogExporterProto,
  OTLPMetricExporterProto,
  OTLPTraceExporterProto,
  PeriodicExportingMetricReader,
  SimpleLogRecordProcessor,
} from "@adobe/aio-lib-telemetry/otel";

import { HTTP_OK } from "../lib/http.js";

/** The telemetry configuration to be used across all checkout actions */
const telemetryConfig = defineTelemetryConfig((_params, _isDev) => {
  return {
    sdkConfig: {
      serviceName: "commerce-checkout-starter-kit",
      instrumentations: getPresetInstrumentations("simple"),
      resource: getAioRuntimeResource(),
      // ...localCollectorConfig(), replace by your preferred telemetry exporter configuration
    },
    // disable diagnostics by default
    // diagnostics: {
    //   logLevel: _isDev ? "debug" : "info",
    // },
  };
});

/**
 * returns the configuration to send telemetry data to a local Open Telemetry Collector
 * @returns {object} the telemetry configuration object
 * Call in the sdkConfig as: ...localCollectorConfig() to export to local OTEL Collector
 */
function localCollectorConfig() {
  return {
    // Not specifying any export URL will default to find an Open Telemetry Collector instance in localhost.
    traceExporter: new OTLPTraceExporterProto(),
    metricReader: new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporterProto(),
    }),

    logRecordProcessors: [
      new SimpleLogRecordProcessor(new OTLPLogExporterProto()),
    ],
  };
}

/**
 * Helper function to determine if a webhook response is successful.
 * Webhooks return HTTP_OK even for errors, so we check the body.op field.
 * @param {unknown} result - The result of the instrumented webhook action.
 * @returns {boolean} - True if the webhook response is successful, false otherwise.
 */
function isWebhookSuccessful(result) {
  if (result && typeof result === "object") {
    if ("statusCode" in result && result.statusCode === HTTP_OK) {
      // Check if body contains an error operation
      if ("body" in result && typeof result.body === "object") {
        return result.body.op !== "exception";
      }
      return true;
    }
    return false;
  }
  return false;
}

export { telemetryConfig, isWebhookSuccessful, localCollectorConfig };
