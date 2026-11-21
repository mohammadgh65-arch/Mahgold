import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};
function response(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}
async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function readLimitedBody(req: Request, maxBytes: number): Promise<string | null> {
  if (!req.body) return null;
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new Error("BODY_TOO_LARGE");
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder("utf-8", { fatal: true }).decode(merged);
}
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return response(405, { error: "Method not allowed" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceKey) return response(500, { error: "Server configuration is incomplete" });

  let body: Record<string, unknown>;
  try {
    const raw = await readLimitedBody(req, 48_000);
    if (raw === null) return response(400, { error: "Request body is required" });
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return response(400, { error: "Request body must be a JSON object" });
    }
    body = parsed as Record<string, unknown>;
  } catch (error) {
    if (error instanceof Error && error.message === "BODY_TOO_LARGE") return response(413, { error: "Request is too large" });
    return response(400, { error: "Invalid JSON body" });
  }

  const customerName = typeof body.customer_name === "string" ? body.customer_name.trim() : "";
  const customerPhone = typeof body.customer_phone === "string" ? body.customer_phone.trim() : "";
  const customerEmail = typeof body.customer_email === "string" ? body.customer_email.trim() : null;
  const shippingAddress = typeof body.shipping_address === "string" ? body.shipping_address.trim() : "";
  const customerNote = typeof body.customer_note === "string" ? body.customer_note : "";
  const items = body.items;
  const idempotencyKey = typeof body.idempotency_key === "string" ? body.idempotency_key.trim() : "";

  if (customerName.length < 2 || customerName.length > 120 ||
      customerPhone.replace(/\D/g, "").length < 8 || customerPhone.replace(/\D/g, "").length > 15 ||
      (customerEmail !== null && customerEmail.length > 254) ||
      shippingAddress.length < 5 || shippingAddress.length > 1200 ||
      customerNote.length > 1000 || !Array.isArray(items) || items.length < 1 || items.length > 30) {
    return response(400, { error: "Customer or cart details are invalid" });
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idempotencyKey)) {
    return response(400, { error: "A valid idempotency_key UUID is required" });
  }

  const authHeader = req.headers.get("authorization") || "";
  let customerId: string | null = null;
  const bearer = authHeader.match(/^Bearer\s+(.+)$/i)?.[1];
  const publicApiKey = req.headers.get("apikey") || "";
  if (bearer && bearer !== anonKey && bearer !== publicApiKey) {
    const authClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await authClient.auth.getUser(bearer);
    if (error || !data.user) return response(401, { error: "Authentication token is invalid" });
    if (!data.user.email_confirmed_at && !data.user.phone_confirmed_at) {
      return response(403, { error: "A verified customer account is required" });
    }
    customerId = data.user.id;
  }
  if (!customerId) return response(401, { error: "Please sign in with a verified customer account before ordering" });

  const authMethod = body.auth_method === "phone" ? "phone" : "email";
  // This endpoint is called directly from browsers; a proxy IP header is not guaranteed.
  // Rate-limit by the verified Supabase user to avoid putting every shopper in one "unknown" bucket.
  const rateLimitKey = `customer:${customerId}`;
  const ipHash = await sha256(rateLimitKey);
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: allowed, error: rateError } = await admin.rpc("mahgold_consume_order_rate_limit", { p_ip_hash: ipHash });
  if (rateError) return response(503, { error: "Order service is temporarily unavailable" });
  if (allowed !== true) return response(429, { error: "Too many order attempts. Please try again later." });

  const { error: profileError } = await admin.from("profiles").upsert({
    id: customerId,
    full_name: customerName,
    phone: customerPhone,
    preferred_auth_method: authMethod,
  }, { onConflict: "id" });
  if (profileError) return response(500, { error: "Customer profile could not be prepared. Please try again later." });

  const { data, error } = await admin.rpc("mahgold_create_order_idempotent", {
    p_customer_name: customerName,
    p_customer_phone: customerPhone,
    p_customer_email: customerEmail,
    p_shipping_address: shippingAddress,
    p_customer_note: customerNote,
    p_items: items,
    p_customer_id: customerId,
    p_idempotency_key: idempotencyKey,
  });

  if (error) {
    const message = error.message || "";
    const isExpected = /اطلاعات|سبد خرید|موجودی|قیمت|شماره|تلاش کنید|دسترسی|محصول|تکراری|فعال|کلید|درخواست قبلی/.test(message);
    return response(isExpected ? 400 : 500, {
      error: isExpected ? message : "Order could not be created. Please try again later.",
    });
  }
  return response(200, { data });
});
