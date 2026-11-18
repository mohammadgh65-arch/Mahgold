import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const jsonHeaders = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };
function reply(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  let upstream: Response;
  try {
    upstream = await fetch("https://arzhaam.ir/api/rates/latest?assets=gold_18", {
      headers: { "X-App-Key": appKey, "Accept": "application/json" }, signal: controller.signal,
    });
  } catch {
    return reply(502, { error: "Rate provider is unreachable" });
  } finally { clearTimeout(timeout); }

  if (!upstream.ok) return reply(502, { error: "Rate provider rejected the request", upstream_status: upstream.status });
  let payload: any;
  try { payload = await upstream.json(); } catch { return reply(502, { error: "Rate provider returned invalid JSON" }); }

  const rates = Array.isArray(payload?.rates) ? payload.rates : [];
  const rate = rates.find((item: any) => item?.assetId === "gold_18") ?? (payload?.assetId === "gold_18" ? payload : null);
  const price = Number(rate?.price);
  const providerUpdatedAtMs = Date.parse(rate?.updatedAt || "");
  const nowMs = Date.now();
  const cacheAgeMs = Number(payload?.meta?.cacheAgeMs);
  const currency = payload?.meta?.currency;
  const checks = {
    found_rate: Boolean(rate),
    positive_price: Number.isFinite(price) && price > 0,
    valid_provider_timestamp: Number.isFinite(providerUpdatedAtMs) && providerUpdatedAtMs <= nowMs + 60000,
    fresh_provider_cache: Number.isFinite(cacheAgeMs) && cacheAgeMs >= 0 && cacheAgeMs <= 300000,
    live_source: payload?.meta?.source === "live",
    currency_valid: currency == null || String(currency).toLowerCase() === "toman",
  };
  if (!Object.values(checks).every(Boolean)) {
    return reply(409, {
      error: "Provider quote failed validation; stored rate was not changed",
      checks, source: payload?.meta?.source ?? null, currency: currency ?? null,
      asset_id: rate?.assetId ?? null,
      cache_age_ms: Number.isFinite(cacheAgeMs) ? cacheAgeMs : null,
    });
  }

  const fetchedAt = new Date(nowMs).toISOString();
  const providerUpdatedAt = new Date(providerUpdatedAtMs).toISOString();
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await admin.from("market_quotes").upsert({
    symbol: "gold_18k", title: "طلای ۱۸ عیار", price_toman: price,
    source: "arzhaam", observed_at: fetchedAt, provider_updated_at: providerUpdatedAt, is_live: true,
  }, { onConflict: "symbol" });
  if (error) return reply(500, { error: "Could not store the verified quote" });

  return reply(200, {
    ok: true, symbol: "gold_18k", price_toman: price,
    observed_at: fetchedAt, provider_updated_at: providerUpdatedAt,
    provider_source: payload.meta.source, cache_age_ms: cacheAgeMs,
  });
});