import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

function respond(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

function validateTalasanjPayload(payload: unknown, nowMs = Date.now()) {
  const data = payload as {
    updated_at?: unknown;
    unit?: unknown;
    market_open?: unknown;
    prices?: { gram18?: { price?: unknown } };
  };

  const updatedAt = typeof data?.updated_at === "string" ? Date.parse(data.updated_at) : NaN;
  const price = Number(data?.prices?.gram18?.price);
  const ageMs = nowMs - updatedAt;

  const checks = {
    has_valid_timestamp: Number.isFinite(updatedAt),
    timestamp_not_in_future: Number.isFinite(updatedAt) && ageMs >= -60_000,
    timestamp_within_five_minutes: Number.isFinite(updatedAt) && ageMs <= 300_000,
    unit_is_toman: data?.unit === "toman",
    positive_18k_price: Number.isFinite(price) && price > 0,
    market_open_flag_present: typeof data?.market_open === "boolean",
  };

  return {
    valid: Object.values(checks).every(Boolean),
    checks,
    // Sanitized diagnostics only: never return credentials or the raw provider payload.
    quote: Number.isFinite(price) && price > 0 ? {
      symbol: "gold_18k",
      price_toman: price,
      provider_updated_at: Number.isFinite(updatedAt) ? new Date(updatedAt).toISOString() : null,
      age_ms: Number.isFinite(ageMs) ? ageMs : null,
      market_open: typeof data?.market_open === "boolean" ? data.market_open : null,
    } : null,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return respond(405, { error: "Method not allowed" });

  const apiKey = Deno.env.get("TALASANJ_API_KEY");
  if (!apiKey) return respond(500, { error: "TALASANJ_API_KEY is not configured" });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch("https://talasanj.info/api/v1/prices", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Accept": "application/json",
        "X-Client-Name": "Mahgold",
        "X-Client-Url": "https://mahgold.netlify.app",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return respond(502, {
        error: "Talasanj provider request failed",
        upstream_status: response.status,
      });
    }

    const payload = await response.json();
    const result = validateTalasanjPayload(payload);

    // This test endpoint is deliberately read-only. It never writes market_quotes,
    // store_settings, orders, or any other database table.
    return respond(result.valid ? 200 : 409, {
      ok: result.valid,
      provider: "talasanj",
      ...result,
    });
  } catch {
    return respond(502, { error: "Talasanj provider request timed out or returned invalid data" });
  } finally {
    clearTimeout(timeout);
  }
});
