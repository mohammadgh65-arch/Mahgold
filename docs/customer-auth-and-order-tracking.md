# Mahgold customer identity and order tracking

## Current implementation
- Customer sign-in uses Supabase Auth email OTP (passwordless).
- New users are created by `signInWithOtp({ options: { shouldCreateUser: true } })`.
- The client verifies the one-time email token with `verifyOtp({ type: "email" })`.
- Checkout requires a valid authenticated session. The order Edge Function independently validates the bearer token and requires a verified email or phone identity.
- The Edge Function binds every order to the authenticated `auth.users.id`, and upserts the customer's name, phone and preferred auth method into `public.profiles`.
- Customer order reads are constrained by existing RLS policies on `orders` and `order_items`.
- `order_status_events` records initial order status and every later status transition. Customers can read events only for their own orders; store admins can read all.
- No payment provider is enabled by this change.

## SMS provider adapter (prepared, not active)
The customer UI exposes an SMS sign-in path but keeps sending disabled until a provider is selected and configured. Do not collect OTPs or claim phone verification before a real provider integration is active.

Recommended provider-neutral contract:
- `sendOtp({ phone, purpose, requestId }) -> { accepted: boolean, providerMessageId?: string }`
- `verifyOtp({ phone, code, purpose, requestId }) -> { verified: boolean }`

Provider adapters should be implemented server-side only (Supabase Edge Function), never in the browser. Credentials belong in Supabase Edge Function secrets, not Vite environment variables or GitHub source:
- `SMS_PROVIDER`
- `SMS_API_KEY`
- `SMS_SENDER` (if required)
- Provider-specific template/pattern identifier (if required)

The adapter must normalize Iranian mobile numbers to E.164, rate-limit by phone and IP, enforce short OTP expiry and attempt limits, avoid logging OTP values, and mark `profiles.phone_verified_at` only after provider verification succeeds. The client must then use Supabase phone OTP verification to establish the authenticated session; the order Edge Function still verifies the resulting JWT.

## Supabase Auth email configuration
Configure the email OTP template to display `{{ .Token }}` (not only a magic-link URL), set the production Site URL and allowed redirect URLs, and set sensible OTP expiry and rate limits. Test delivery and spam placement before production launch.

## Production gates
1. Choose and contract an SMS provider.
2. Add its secrets in Supabase Edge Function secrets.
3. Implement and test the provider adapter, resend cooldown, per-number/IP throttling, and failure handling.
4. Verify email OTP template and domain delivery.
5. Test customer isolation with two separate accounts.
6. Test order status transitions and admin updates.
7. Only after acceptance, deploy the storefront to Netlify. Payment remains disabled until explicitly authorized.
