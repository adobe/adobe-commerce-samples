const { randomUUID } = require("node:crypto");
const { Core } = require("@adobe/aio-sdk");
const stateLib = require("@adobe/aio-lib-state");
const { stringParameters } = require("../lib/utils");
const {
  HTTP_CREATED,
  HTTP_BAD_REQUEST,
  HTTP_NOT_FOUND,
  HTTP_INTERNAL_ERROR,
} = require("../lib/constants");
const { validate } = require("./validator");

const STATE_KEY_PREFIX = "qa.";
const STATE_KEY_SAFE = /[^a-zA-Z0-9-_.]/g;

function stateKey(prefix, sku) {
  return prefix + String(sku).replace(STATE_KEY_SAFE, "_");
}

/**
 * POST a question or answer for a product SKU.
 *
 * @param {object} params - Body: sku, type ('question'|'answer'), questionId? (required if answer), content, user?
 * @returns {{ statusCode: number, body: object }}
 */
async function main(params) {
  const logger = Core.Logger("product-reviews-qa-post", {
    level: params.LOG_LEVEL || "info",
  });
  try {
    logger.info("Start processing request");
    logger.debug(`Params: ${stringParameters(params)}`);

    const validation = validate(params);
    if (!validation.valid) {
      return {
        statusCode: HTTP_BAD_REQUEST,
        body: { error: validation.error },
      };
    }

    const state = await stateLib.init();
    const key = stateKey(STATE_KEY_PREFIX, validation.body.sku);
    const result = await state.get(key);
    let store = result?.value;
    if (typeof store === "string") {
      try {
        store = JSON.parse(store);
      } catch {
        store = {};
      }
    }
    const questions = Array.isArray(store?.questions)
      ? [...store.questions]
      : [];
    const createdAt = new Date().toISOString();

    if (validation.body.type === "question") {
      const id = randomUUID();
      const { content, user } = validation.body;
      questions.push({
        id,
        content,
        user: user ?? undefined,
        createdAt,
        answers: [],
      });
      await state.put(key, JSON.stringify({ questions }));
      logger.info("Question created");
      return {
        statusCode: HTTP_CREATED,
        body: { success: true, id },
      };
    }

    const {
      questionId,
      content: answerContent,
      user: answerUser,
    } = validation.body;
    const questionIndex = questions.findIndex((q) => q.id === questionId);
    if (questionIndex === -1) {
      return {
        statusCode: HTTP_NOT_FOUND,
        body: {
          error: `Question with id '${questionId}' not found for this product.`,
        },
      };
    }

    const answerId = randomUUID();
    const question = questions[questionIndex];
    const answers = Array.isArray(question.answers)
      ? [...question.answers]
      : [];
    answers.push({
      id: answerId,
      content: answerContent,
      user: answerUser ?? undefined,
      createdAt,
    });
    question.answers = answers;
    questions[questionIndex] = question;
    await state.put(key, JSON.stringify({ questions }));

    logger.info("Answer created");
    return {
      statusCode: HTTP_CREATED,
      body: { success: true, id: answerId },
    };
  } catch (error) {
    logger.error(`Server error: ${error.message}`, error);
    return {
      statusCode: HTTP_INTERNAL_ERROR,
      body: { error: "Internal server error." },
    };
  }
}

exports.main = main;
