import { Core } from "@adobe/aio-sdk";

const DEFAULT_CARRIERS = [
  { carrier_code: "standard", service_code: "ground", transit_days: 4 },
  { carrier_code: "express", service_code: "2day", transit_days: 2 },
  { carrier_code: "priority", service_code: "overnight", transit_days: 1 },
];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function parseShipDate(shipDate) {
  if (shipDate == null || typeof shipDate !== "string") {
    return null;
  }
  if (!ISO_DATE.test(shipDate)) {
    return null;
  }
  const d = new Date(`${shipDate}T12:00:00.000Z`);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  return shipDate;
}

function addBusinessDays(isoDate, days) {
  const d = new Date(`${isoDate}T12:00:00.000Z`);
  let added = 0;
  while (added < days) {
    d.setUTCDate(d.getUTCDate() + 1);
    const dow = d.getUTCDay();
    if (dow !== 0 && dow !== 6) {
      added += 1;
    }
  }
  return d.toISOString().slice(0, 10);
}

function cutoffUtc(isoDate, hour = 17) {
  return `${isoDate}T${String(hour).padStart(2, "0")}:00:00.000Z`;
}

function getBearerToken(headers) {
  const auth = headers?.authorization ?? "";
  if (typeof auth !== "string" || !auth.startsWith("Bearer ")) {
    return null;
  }
  return auth.slice(7).trim() || null;
}

function filterCarriers(body) {
  let carriers = DEFAULT_CARRIERS;

  if (Array.isArray(body?.carriers) && body.carriers.length > 0) {
    const set = new Set(body.carriers.map((c) => String(c).toLowerCase()));
    carriers = carriers.filter((c) => set.has(c.carrier_code.toLowerCase()));
  }

  if (Array.isArray(body?.service_levels) && body.service_levels.length > 0) {
    const set = new Set(
      body.service_levels.map((s) => String(s).toLowerCase()),
    );
    carriers = carriers.filter(
      (c) =>
        set.has(c.service_code.toLowerCase()) ||
        set.has(c.carrier_code.toLowerCase()),
    );
  }

  return carriers;
}

function buildEstimates(body) {
  const shipDate = parseShipDate(body?.ship_date);
  const baseDate = shipDate ?? new Date().toISOString().slice(0, 10);
  const carriers = filterCarriers(body);

  if (carriers.length === 0) {
    return { estimates: [], best_estimation: null };
  }

  const estimates = carriers.map((c) => ({
    carrier_code: c.carrier_code,
    service_code: c.service_code,
    delivery_date: addBusinessDays(baseDate, c.transit_days),
    safe_delivery_date: addBusinessDays(baseDate, c.transit_days + 1),
    transit_days: c.transit_days,
    cutoff_datetime_utc: cutoffUtc(baseDate, 17 - c.transit_days),
  }));

  return { estimates, best_estimation: estimates[0] };
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body,
  };
}

function parseBody(params) {
  if (params.__ow_body) {
    try {
      return JSON.parse(atob(params.__ow_body));
    } catch {
      return JSON.parse(params.__ow_body);
    }
  }
  const { origin, destination, ship_date, carriers, service_levels } = params;
  return { origin, destination, ship_date, carriers, service_levels };
}

function main(params) {
  const logger = Core.Logger("mock-delivery-api", {
    level: params.LOG_LEVEL || "info",
  });
  const headers = params.__ow_headers ?? {};

  const expectedKey = params.MOCK_API_KEY || "";
  if (expectedKey) {
    const token = getBearerToken(headers);
    if (!token || token !== expectedKey) {
      logger.debug("Unauthorized request — invalid or missing Bearer token");
      return jsonResponse(401, {
        error: "unauthorized",
        message: "Missing or invalid API key.",
      });
    }
  }

  const body = parseBody(params);

  if (body.ship_date != null && !parseShipDate(body.ship_date)) {
    return jsonResponse(400, {
      error: "bad_request",
      message: "Invalid ship_date; use YYYY-MM-DD.",
    });
  }

  const result = buildEstimates(body);
  logger.debug(`Returning ${result.estimates.length} estimates`);

  return jsonResponse(200, result);
}

export { main };
