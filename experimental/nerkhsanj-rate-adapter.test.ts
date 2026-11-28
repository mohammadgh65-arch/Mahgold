import {
  compareReferencePrice,
  validateNerkhSanjPayload,
} from "./nerkhsanj-rate-adapter.ts";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function tehranParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US-u-ca-persian-nu-latn", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
  return {
    date: `${p.year}/${p.month}/${p.day}`,
    time: `${p.hour}:${p.minute}`,
  };
}

function validPayload(now: Date) {
  const market = tehranParts(now);
  return { date: market.date, time: market.time, rates: { gold: 26_500_500 } };
}

Deno.test("accepts a fresh positive 18k quote but never marks it live", () => {
  const now = new Date("2026-11-28T13:30:00.000Z");
  const result = validateNerkhSanjPayload(validPayload(now), now);
  assert(result.ok, "fresh quote should pass");
  assert(result.quote.symbol === "gold_18k", "symbol mapping must be gold_18k");
  assert(result.quote.price_toman_per_gram === 26_500_500, "price must remain in toman");
  assert(result.quote.source === "nerkhsanj", "source must be tagged");
  assert(result.quote.is_live === false, "experimental quote must never be live");
});

Deno.test("rejects null and non-object payloads", () => {
  const now = new Date();
  assert(!validateNerkhSanjPayload(null, now).ok, "null must fail");
  assert(!validateNerkhSanjPayload("{}", now).ok, "string must fail");
});

Deno.test("rejects missing rates and invalid prices", () => {
  const now = new Date();
  const base = validPayload(now);
  assert(!validateNerkhSanjPayload({ date: base.date, time: base.time }, now).ok, "missing rates");
  for (const gold of [0, -1, NaN, Infinity, "26500000"]) {
    const result = validateNerkhSanjPayload({
      date: base.date, time: base.time, rates: { gold },
    }, now);
    assert(!result.ok, `invalid price must fail: ${String(gold)}`);
  }
});

Deno.test("rejects malformed or missing Jalali date", () => {
  const now = new Date();
  const base = validPayload(now);
  for (const date of ["", "1405-09-07", "yesterday", null]) {
    const result = validateNerkhSanjPayload({
      ...base, date, 
    }, now);
    assert(!result.ok, `invalid date must fail: ${String(date)}`);
  }
});

Deno.test("rejects missing and malformed market time", () => {
  const now = new Date();
  const base = validPayload(now);
  for (const time of ["", "9:05", "25:61", "market closed", null]) {
    const result = validateNerkhSanjPayload({
      ...base, time,
    }, now);
    assert(!result.ok, `invalid time must fail: ${String(time)}`);
  }
});

Deno.test("rejects a quote older than the three-minute freshness window", () => {
  const now = new Date("2026-11-28T13:30:00.000Z");
  const old = new Date(now.getTime() - 5 * 60_000);
  const market = tehranParts(old);
  const result = validateNerkhSanjPayload({
    date: market.date, time: market.time, rates: { gold: 26_500_500 },
  }, now);
  assert(!result.ok && result.reason === "market_quote_stale", "stale quote must fail closed");
});

Deno.test("rejects a market date that is not today's Tehran date", () => {
  const now = new Date();
  const base = validPayload(now);
  const result = validateNerkhSanjPayload({
    ...base, date: "1300/01/01",
  }, now);
  assert(!result.ok && result.reason === "market_date_not_today_tehran", "old date must fail");
});

Deno.test("accepts Persian and Arabic numerals in date/time", () => {
  const now = new Date();
  const base = validPayload(now);
  const toPersian = (s: string) => s.replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
  const result = validateNerkhSanjPayload({
    ...base, date: toPersian(base.date), time: toPersian(base.time),
  }, now);
  assert(result.ok, "localized digits should normalize");
});

Deno.test("reference comparison rejects deviations above 0.5 percent", () => {
  assert(compareReferencePrice(100_400, 100_000).ok, "0.4% deviation should pass");
  const failed = compareReferencePrice(100_600, 100_000);
  assert(!failed.ok && failed.reason === "reference_price_deviation_exceeded", "0.6% must fail");
});

Deno.test("reference comparison rejects invalid values", () => {
  assert(!compareReferencePrice(0, 100).ok, "zero candidate must fail");
  assert(!compareReferencePrice(100, NaN).ok, "NaN reference must fail");
});
