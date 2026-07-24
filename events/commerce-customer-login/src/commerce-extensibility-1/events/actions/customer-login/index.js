/**
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/*
 * This is a sample action showcasing how to access an external API
 */

const AioLogger = require("@adobe/aio-lib-core-logging");
const {
  ok,
  buildErrorResponse,
  internalServerError,
} = require("@adobe/aio-commerce-sdk/core/responses");

const main = async (params) => {
  const logger = AioLogger("main", { level: params.LOG_LEVEL || "info" });

  try {
    logger.info("Calling the main action of customer-login");

    const slackText = `Customer Login - ${JSON.stringify(params)}`;

    const payload = {
      text: slackText,
    };

    const res = await fetch(params.SLACK_WEBHOOK, {
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });
    if (!res.ok) {
      logger.info(
        `${res.status}: Something is wrong with your Slack webhook URL.`,
      );
      return buildErrorResponse(res.status, {
        body: { message: "Something is wrong with your Slack webhook URL." },
      });
    }

    logger.info("200: successful request");
    return ok({
      body: { message: "Commerce event information sent successfully." },
    });
  } catch (error) {
    logger.error(error);
    return internalServerError("server error");
  }
};

exports.main = main;
