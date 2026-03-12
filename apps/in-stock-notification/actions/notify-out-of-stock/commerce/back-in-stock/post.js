const stateLib = require("@adobe/aio-lib-state");

const STATE_KEY = "out-of-stock-subscriptions";

/**
 * Removes notified subscriptions from state so they are not sent again.
 *
 * @param {object} params - Action params
 * @param {object} _transformed - Transformed data
 * @param {object} preProcessed - { subscriptionIds, subscriptions }
 * @param {object} _result - Sender result
 */
async function postProcess(params, _transformed, preProcessed, _result) {
  const subscriptionIds = preProcessed.subscriptionIds ?? [];
  if (subscriptionIds.length === 0) {
    return;
  }

  const state = await stateLib.init({
    ...(params.STATE_REGION && { region: params.STATE_REGION }),
  });

  const stateDoc = await state.get(STATE_KEY);
  const raw = stateDoc?.value;
  const data =
    typeof raw === "string" ? JSON.parse(raw) : raw ?? {};
  const subscriptions = data?.subscriptions ?? [];
  if (!Array.isArray(subscriptions)) {
    return;
  }

  const idsSet = new Set(subscriptionIds);
  const remaining = subscriptions.filter((s) => !idsSet.has(s.id));
  if (remaining.length < subscriptions.length) {
    await state.put(STATE_KEY, JSON.stringify({ subscriptions: remaining }));
  }
}

module.exports = {
  postProcess,
};
