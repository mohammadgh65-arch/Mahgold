import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const jsonHeaders = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };
const coinAssets = [
  { id: "coin_emami", symbol: "coin_emami", title: "سکه امامی" },
  { id: "coin_bahar", symbol: "coin_bahar", title: "سکه بهار آزادی" },
  { id: "coin_nim", symbol: "coin_nim", title: "نیم سکه" },
  { id: "coin_rob", symbol: "coin_rob", title: "ربع سکه" },
  { id: "coin_gerami", symbol: "coin_gerami", title: "سکه گرمی" },
];
function reply(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}
function isValidProviderTimestamp(value: string | undefined, nowMs: number) {
  const time = Date.parse(value || "");
  return Number.isFinite(time) && time <= nowMs + 60000;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return reply(405, { error: "Method not allowed" });
  const syncToken = Deno.env.get("MAHGOLD_QUOTE_SYNC_TOKEN");
  const suppliedToken = req.headers.get("x-sync-token") || "";
  if (!syncToken || suppliedToken.length < 32 || suppliedToken !== syncToken) return reply(401, { error: "Unauthorized" });

  const appKey = Deno.env.get("ARZHAAM_APP_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!appKey || !supabaseUrl || !serviceRoleKey) return reply(500, { error: "Server configuration is incomplete" });

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const setProviderStatus = async (status: string) => {
    let effectiveStatus = status;
    if (status !== "connected") {
      const { data: latestQuote } = await admin.from("market_quotes")
        .select("source,is_live,observed_at")
        .eq("symbol", "gold_18k")
        .maybeSingle();
      const observedAt = Date.parse(latestQuote?.observed_at || "");
      const freshManualQuote = latestQuote?.source === "manual" &&
        latestQuote?.is_live === false &&
        Number.isFinite(observedAt) &&
        observedAt <= Date.now() + 60000 &&
        Date.now() - observedAt <= 300000;
      if (freshManualQuote) effectiveStatus = "manual";
    }
    await admin.from("store_settings")
      .update({ price_provider_status: effectiveStatus, updated_at: new Date().toISOString() })
      .eq("id", 1);
  };
  const nowMs = Date.now();
  const fetchedAt = new Date(nowMs).toISOString();
  const accepted: Array<Record<string, unknown>> = [];
  const skipped: Array<Record<string, string>> = [];

  // Gold is the checkout-critical quote. One provider request every two minutes
  // stays below the smallest documented daily quota while retaining freshness.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  let upstream: Response;
  try {
    upstream = await fetch("https://arzhaam.ir/api/rates/latest?assets=gold_18", {
      headers: { "X-App-Key": appKey, "Accept": "application/json" }, signal: controller.signal,
    });
  } catch {
    await setProviderStatus("error");
    return reply(502, { error: "Rate provider is unreachable" });
  } finally { clearTimeout(timeout); }

  if (!upstream.ok) {
    let providerError: any = {};
    try { providerError = await upstream.clone().json(); } catch { /* keep a safe generic error */ }
    const retryAfterHeader = Number(upstream.headers.get("Retry-After"));
    const retryAfterBody = Number(providerError?.retryAfter);
    await setProviderStatus(upstream.status === 429 ? "stale" : "error");
    return reply(upstream.status === 429 ? 429 : 502, {
      error: "Rate provider rejected the request",
      upstream_status: upstream.status,
      provider_code: typeof providerError?.error === "string" ? providerError.error : null,
      provider_message: typeof providerError?.message === "string" ? providerError.message.slice(0, 180) : null,
      retry_after_seconds: Number.isFinite(retryAfterHeader) && retryAfterHeader > 0 ? retryAfterHeader : (Number.isFinite(retryAfterBody) && retryAfterBody > 0 ? retryAfterBody : null),
    });
  }
  let payload: any;
  try { payload = await upstream.json(); } catch { await setProviderStatus("error"); return reply(502, { error: "Rate provider returned invalid JSON" }); }

  const rate = Array.isArray(payload?.rates)
    ? payload.rates.find((item: any) => item?.assetId === "gold_18")
    : (payload?.assetId === "gold_18" ? payload : null);
  const price = Number(rate?.price);
  const cacheAgeMs = Number(payload?.meta?.cacheAgeMs);
  const currency = payload?.meta?.currency;
  const goldChecks = {
    found_rate: Boolean(rate),
    positive_price: Number.isFinite(price) && price > 0,
    valid_provider_timestamp: isValidProviderTimestamp(rate?.updatedAt, nowMs),
    fresh_provider_cache: Number.isFinite(cacheAgeMs) && cacheAgeMs >= 0 && cacheAgeMs <= 300000,
    live_source: payload?.meta?.source === "live",
    currency_valid: currency == null || String(currency).toLowerCase() === "toman",
  };
  if (Object.values(goldChecks).every(Boolean)) {
    accepted.push({
      symbol: "gold_18k", title: "طلای ۱۸ عیار", price_toman: price,
      source: "arzhaam", observed_at: fetchedAt,
      provider_updated_at: new Date(Date.parse(rate.updatedAt)).toISOString(), is_live: true,
    });
  } else {
    skipped.push({ asset_id: "gold_18", reason: "provider_quote_failed_freshness_validation" });
  }

  // Coin conversion is intentionally hourly: five extra API calls every hour
  // plus 30 gold calls/hour remain safely below the trial plan's 1,000/day cap.
  const shouldSyncCoins = new Date(nowMs).getUTCMinutes() === 0;
  const coinResults: string[] = [];
  if (shouldSyncCoins) {
    for (const asset of coinAssets) {
      const convertUrl = new URL("https://arzhaam.ir/api/rates/convert");
      convertUrl.searchParams.set("from", asset.id);
      convertUrl.searchParams.set("to", "toman");
      convertUrl.searchParams.set("amount", "1");
      const convertController = new AbortController();
      const convertTimeout = setTimeout(() => convertController.abort(), 8000);
      try {
        const response = await fetch(convertUrl.toString(), {
          headers: { "X-App-Key": appKey, "Accept": "application/json" },
          signal: convertController.signal,
        });
        if (!response.ok) {
          skipped.push({ asset_id: asset.id, reason: "conversion_http_" + response.status });
          continue;
        }
        const converted: any = await response.json();
        const normalized = Number(converted?.to?.amount);
        const conversionAge = Number(converted?.meta?.cacheAgeMs);
        const providerTime = converted?.from?.updatedAt;
        const valid = converted?.to?.assetId === "toman" &&
          converted?.from?.assetId === asset.id &&
          Number.isFinite(normalized) && normalized > 1000000 &&
          converted?.meta?.source === "live" &&
          Number.isFinite(conversionAge) && conversionAge >= 0 && conversionAge <= 300000 &&
          isValidProviderTimestamp(providerTime, nowMs);
        if (!valid) {
          skipped.push({ asset_id: asset.id, reason: "conversion_failed_freshness_validation" });
          continue;
        }
        accepted.push({
          symbol: asset.symbol, title: asset.title, price_toman: normalized,
          source: "arzhaam", observed_at: fetchedAt,
          provider_updated_at: new Date(Date.parse(providerTime)).toISOString(), is_live: true,
        });
        coinResults.push(asset.symbol);
      } catch {
        skipped.push({ asset_id: asset.id, reason: "conversion_unavailable" });
      } finally { clearTimeout(convertTimeout); }
    }
  }

  if (!accepted.length) { await setProviderStatus("stale"); return reply(409, {
    error: "No asset passed rate validation; stored rates were not changed",
    skipped, gold_checks: goldChecks, coin_sync_attempted: shouldSyncCoins,
  }); }

  const { error } = await admin.from("market_quotes").upsert(accepted, { onConflict: "symbol" });
  if (error) { await setProviderStatus("error"); return reply(500, { error: "Could not store verified market quotes" }); }
  await setProviderStatus(accepted.some((item) => item.symbol === "gold_18k") ? "connected" : "stale");

  return reply(200, {
    ok: true, updated: accepted.map((item) => item.symbol),
    skipped, coin_sync_attempted: shouldSyncCoins, coin_updated: coinResults,
    observed_at: fetchedAt, provider_source: payload?.meta?.source ?? null,
    cache_age_ms: Number.isFinite(cacheAgeMs) ? cacheAgeMs : null,
  });
});