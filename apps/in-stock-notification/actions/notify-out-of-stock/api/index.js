const { Core } = require("@adobe/aio-sdk");
const stateLib = require("@adobe/aio-lib-state");
const { randomUUID } = require("node:crypto");
const {
  HTTP_OK,
  HTTP_CREATED,
  HTTP_BAD_REQUEST,
  HTTP_NOT_FOUND,
  HTTP_CONFLICT,
  HTTP_INTERNAL_ERROR,
  HTTP_SERVICE_UNAVAILABLE,
} = require("../../constants");
const { actionErrorResponse } = require("../../responses");
const { stringParameters } = require("../../utils");

const STATE_KEY = "out-of-stock-subscriptions";

function parseBody(params) {
  if (params.__ow_body) {
    try {
      const raw = Buffer.from(params.__ow_body, "base64").toString("utf8");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }
  return params.body ?? params;
}

async function getSubscriptionsFromState(state) {
  const v = await state.get(STATE_KEY);
  if (!v?.value) {
    return [];
  }
  const data =
    typeof v.value === "string" ? JSON.parse(v.value) : v.value ?? {};
  const subs = data?.subscriptions;
  return Array.isArray(subs) ? subs : [];
}

async function handlePost(state, body) {
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const sku = typeof body.sku === "string" ? body.sku.trim() : "";
  if (!(email && sku)) {
    return actionErrorResponse(
      HTTP_BAD_REQUEST,
      "Missing or invalid email and sku",
    );
  }
  const subs = await getSubscriptionsFromState(state);
  const duplicate = subs.find(
    (s) => s.email.toLowerCase() === email.toLowerCase() && s.sku === sku,
  );
  if (duplicate) {
    return actionErrorResponse(
      HTTP_CONFLICT,
      "Subscription already exists for this email and sku",
    );
  }
  const id = randomUUID();
  const created = {
    id,
    email,
    sku,
    createdAt: new Date().toISOString(),
  };
  subs.push(created);
  await state.put(STATE_KEY, JSON.stringify({ subscriptions: subs }));
  return { statusCode: HTTP_CREATED, body: created };
}

async function handleGet(state, params, body) {
  const id = params.id ?? body.id;
  const email = params.email ?? body.email;
  const sku = params.sku ?? body.sku;
  const subs = await getSubscriptionsFromState(state);

  if (id) {
    const one = subs.find((s) => s.id === id);
    if (!one) {
      return actionErrorResponse(HTTP_NOT_FOUND, "Subscription not found");
    }
    return { statusCode: HTTP_OK, body: one };
  }

  let list = subs;
  if (typeof sku === "string" && sku) {
    list = list.filter((s) => s.sku === sku);
  }
  if (typeof email === "string" && email) {
    const e = email.toLowerCase();
    list = list.filter((s) => s.email.toLowerCase() === e);
  }
  return { statusCode: HTTP_OK, body: { subscriptions: list } };
}

async function handleDelete(state, params, body) {
  const id = params.id ?? body.id;
  const email = params.email ?? body.email;
  const sku = params.sku ?? body.sku;
  const subs = await getSubscriptionsFromState(state);

  let remaining = subs;
  if (id) {
    remaining = subs.filter((s) => s.id !== id);
  } else if (
    typeof email === "string" &&
    email &&
    typeof sku === "string" &&
    sku
  ) {
    const e = email.toLowerCase();
    remaining = subs.filter(
      (s) => s.email.toLowerCase() !== e || s.sku !== sku,
    );
  } else {
    return actionErrorResponse(
      HTTP_BAD_REQUEST,
      "Delete requires id or both email and sku",
    );
  }

  if (remaining.length === subs.length) {
    return actionErrorResponse(HTTP_NOT_FOUND, "Subscription not found");
  }
  await state.put(STATE_KEY, JSON.stringify({ subscriptions: remaining }));
  return { statusCode: HTTP_OK, body: { success: true } };
}

async function main(params) {
  const logger = Core.Logger("notify-out-of-stock-api", {
    level: params.LOG_LEVEL || "info",
  });
  logger.debug(`Received params: ${stringParameters(params)}`);

  const method = (params.__ow_method || "get").toLowerCase();
  const body = parseBody(params);

  let state;
  try {
    state = await stateLib.init({
      ...(params.STATE_REGION && { region: params.STATE_REGION }),
    });
  } catch (err) {
    logger.error(`State init failed: ${err.message}`);
    return actionErrorResponse(HTTP_SERVICE_UNAVAILABLE, "Service unavailable");
  }

  try {
    if (method === "post") {
      return await handlePost(state, body);
    }
    if (method === "get") {
      return await handleGet(state, params, body);
    }
    if (method === "delete") {
      return await handleDelete(state, params, body);
    }
    return actionErrorResponse(HTTP_BAD_REQUEST, "Method not allowed");
  } catch (err) {
    logger.error(`API error: ${err.message}`);
    return actionErrorResponse(HTTP_INTERNAL_ERROR, err.message);
  }
}

exports.main = main;
