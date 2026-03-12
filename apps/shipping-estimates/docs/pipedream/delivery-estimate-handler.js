/**
 * Delivery Date Estimation API — Mock handler for Pipedream
 *
 * Paste this code into a Pipedream Node.js code step that runs after an
 * HTTP / Webhook trigger. The trigger must be configured for POST and path
 * /v1/delivery-estimate (or the step must handle routing).
 *
 * Compatible with: docs/PIPEDREAM_API_SPEC.md
 */

// Default carriers and transit days when request does not specify any
const DEFAULT_CARRIERS = [
  { carrier_code: "standard", service_code: "ground", transit_days: 4 },
  { carrier_code: "express", service_code: "2day", transit_days: 2 },
  { carrier_code: "priority", service_code: "overnight", transit_days: 1 },
];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parse and validate ship_date (YYYY-MM-DD). Returns null if missing/invalid.
 */
function parseShipDate(shipDate) {
  if (shipDate == null || typeof shipDate !== "string") return null;
  if (!ISO_DATE.test(shipDate)) return null;
  const d = new Date(shipDate + "T12:00:00.000Z");
  if (Number.isNaN(d.getTime())) return null;
  return shipDate;
}

/**
 * Add business days (simple: no holiday calendar) to an ISO date string.
 */
function addBusinessDays(isoDate, days) {
  const d = new Date(isoDate + "T12:00:00.000Z");
  let added = 0;
  while (added < days) {
    d.setUTCDate(d.getUTCDate() + 1);
    const dow = d.getUTCDay();
    if (dow !== 0 && dow !== 6) added += 1;
  }
  return d.toISOString().slice(0, 10);
}

/**
 * Build cutoff datetime for a given ship date (e.g. 17:00 UTC).
 */
function cutoffUtc(isoDate, hour = 17) {
  return `${isoDate}T${String(hour).padStart(2, "0")}:00:00.000Z`;
}

/**
 * Validate Bearer token from Authorization header.
 */
function getBearerToken(headers) {
  const auth =
    headers?.Authorization ?? headers?.authorization ?? "";
  if (typeof auth !== "string" || !auth.startsWith("Bearer ")) return null;
  return auth.slice(7).trim() || null;
}

/**
 * Main handler: compute mock delivery estimates from request body.
 * Returns { status, body } for HTTP response (body will be JSON-serialized).
 */
function handleDeliveryEstimate(body, apiKey) {
  const shipDate = parseShipDate(body?.ship_date);
  const baseDate = shipDate ?? new Date().toISOString().slice(0, 10);

  let carriers = DEFAULT_CARRIERS;

  if (Array.isArray(body?.carriers) && body.carriers.length > 0) {
    const set = new Set(body.carriers.map((c) => String(c).toLowerCase()));
    carriers = DEFAULT_CARRIERS.filter((c) =>
      set.has(c.carrier_code.toLowerCase())
    );
  }
  if (Array.isArray(body?.service_levels) && body.service_levels.length > 0) {
    const set = new Set(
      body.service_levels.map((s) => String(s).toLowerCase())
    );
    carriers = carriers.filter((c) =>
      set.has(c.service_code.toLowerCase()) ||
      set.has(c.carrier_code.toLowerCase())
    );
  }

  if (carriers.length === 0) {
    return {
      status: 200,
      body: { estimates: [], best_estimation: null },
    };
  }

  const estimates = carriers.map((c) => {
    const delivery_date = addBusinessDays(baseDate, c.transit_days);
    const safe_delivery_date = addBusinessDays(baseDate, c.transit_days + 1);
    const cutoff_datetime_utc = cutoffUtc(baseDate, 17 - c.transit_days);
    return {
      carrier_code: c.carrier_code,
      service_code: c.service_code,
      delivery_date,
      safe_delivery_date,
      transit_days: c.transit_days,
      cutoff_datetime_utc,
    };
  });

  const best = estimates[0];

  return {
    status: 200,
    body: {
      estimates,
      best_estimation: best,
    },
  };
}

/**
 * Pipedream Code step entrypoint.
 * - Expects trigger to provide: body (parsed JSON), headers (object).
 * - Uses workflow env var MOCK_API_KEY for Bearer validation; if not set, any Bearer token is accepted.
 */
export default defineComponent({
  async run({ steps, $ }) {
    const event = steps.trigger?.event ?? steps.trigger ?? {};
    const body = event.body ?? {};
    const headers = event.headers ?? {};

    const auth = getBearerToken(headers);
    const expectedKey =
      (typeof process.env.MOCK_API_KEY === "string" &&
        process.env.MOCK_API_KEY.trim()) ||
      null;

    if (expectedKey) {
      if (!auth || auth !== expectedKey) {
        await $.respond({
          immediate: true,
          status: 401,
          headers: { "Content-Type": "application/json" },
          body: {
            error: "unauthorized",
            message: "Missing or invalid API key.",
          },
        });
        return;
      }
    }

    if (body?.ship_date != null && !parseShipDate(body.ship_date)) {
      await $.respond({
        immediate: true,
        status: 400,
        headers: { "Content-Type": "application/json" },
        body: {
          error: "bad_request",
          message: "Invalid ship_date; use YYYY-MM-DD.",
        },
      });
      return;
    }

    const { status, body: responseBody } = handleDeliveryEstimate(body, auth);

    await $.respond({
      immediate: true,
      status,
      headers: { "Content-Type": "application/json" },
      body: responseBody,
    });
  },
});
