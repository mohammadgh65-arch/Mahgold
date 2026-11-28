/**
 * Mahgold — experimental NerkhSanj adapter.
 *
 * SAFETY: This module is deliberately NOT wired into production order pricing,
 * market_quotes writes, or cron. It only fetches and validates a candidate quote.
 *
 * Endpoint contract (per provider docs): amounts are toman; rates.gold is
 * 18-karat gold per gram; date is Jalali YYYY/MM/DD; time is Tehran HH:mm.
 */

export type CandidateQuote = {
  symbol: "gold_18k";
  price_toman_per_gram: number;
  source: "nerkhsanj";
  market_date_jalali: string;
  market_time_tehran: string;
  received_at_utc: string;
  is_live: false;
  metadata: {
    provider_endpoint: string;
    provider_date: string;
    provider_time: string;
    validation: "passed";
    purpose: "experimental_only";
  };
};

export type AdapterResult =
  | { ok: true; quote: CandidateQuote }
  | { ok: false; reason: string };

const ENDPOINT = "https://nerkh.jahankhahan.shop/data/live.json";
const MIN_FETCH_INTERVAL_MS = 60_000;
const MAX_MARKET_AGE_MINUTES = 3;
let lastFetchStartedAt = 0;

function normalizeDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

function tehranJalaliNow(now: Date): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat("en-US-u-ca-persian-nu-latn", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
  return {
    date: `${p.year}/${p.month}/${p.day}`,
    time: `${p.hour}:${p.minute}`,
  };
}

function parseClock(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

export function validateNerkhSanjPayload(
  payload: unknown,
  now = new Date(),
): AdapterResult {
  if (!payload || typeof payload !== "object") {
    return { ok: false, reason: "payload_not_object" };
  }

  const data = payload as Record<string, unknown>;
  const rates = data.rates;
  if (!rates || typeof rates !== "object") {
    return { ok: false, reason: "rates_missing" };
  }

  const gold = (rates as Record<string, unknown>).gold;
  if (typeof gold !== "number" || !Number.isFinite(gold) || gold <= 0) {
    return { ok: false, reason: "invalid_gold_price" };
  }

  const date = typeof data.date === "string"
    ? normalizeDigits(data.date.trim())
    : "";
  const time = typeof data.time === "string"
    ? normalizeDigits(data.time.trim())
    : "";

  if (!/^\d{4}\/\d{2}\/\d{2}$/.test(date)) {
    return { ok: false, reason: "invalid_or_missing_jalali_date" };
  }

  const marketMinute = parseClock(time);
  if (marketMinute === null) {
    return { ok: false, reason: "invalid_or_missing_market_time" };
  }

  const current = tehranJalaliNow(now);
  if (date !== current.date) {
    return { ok: false, reason: "market_date_not_today_tehran" };
  }

  const currentMinute = parseClock(current.time)!;
  const ageMinutes = currentMinute - marketMinute;
  if (ageMinutes < -1) {
    return { ok: false, reason: "market_time_in_future" };
  }
  if (ageMinutes > MAX_MARKET_AGE_MINUTES) {
    return { ok: false, reason: "market_quote_stale" };
  }

  return {
    ok: true,
    quote: {
      symbol: "gold_18k",
      price_toman_per_gram: gold,
      source: "nerkhsanj",
      market_date_jalali: date,
      market_time_tehran: time,
      received_at_utc: now.toISOString(),
      is_live: false,
      metadata: {
        provider_endpoint: ENDPOINT,
        provider_date: date,
        provider_time: time,
        validation: "passed",
        purpose: "experimental_only",
      },
    },
  };
}

/**
 * Best-effort single-isolate throttle only. This is NOT a distributed lock:
 * do not use it as the sole production rate limiter across Edge Function
 * isolates. Production scheduling must enforce one request/minute centrally.
 */
export async function fetchNerkhSanjCandidate(
  now = new Date(),
): Promise<AdapterResult> {
  if (now.getTime() - lastFetchStartedAt < MIN_FETCH_INTERVAL_MS) {
    return { ok: false, reason: "local_rate_limit_one_request_per_minute" };
  }
  lastFetchStartedAt = now.getTime();

  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: "GET",
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(8_000),
    });
  } catch {
    return { ok: false, reason: "provider_network_error" };
  }

  if (!response.ok) {
    return { ok: false, reason: `provider_http_${response.status}` };
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return { ok: false, reason: "provider_non_json_content_type" };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return { ok: false, reason: "provider_invalid_json" };
  }

  return validateNerkhSanjPayload(payload, now);
}
