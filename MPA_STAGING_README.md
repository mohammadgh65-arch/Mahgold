# Mahgold MPA staging

This branch is an isolated implementation workspace. It does not change `main`, production DNS, or the currently deployed Worker.

## Independent documents
- `/products/`
- `/category/jewelry/`, `/category/melted-gold/`, `/category/coins/`, `/category/bars/`
- `/product/{uuid}-{readable-name}/` (Worker resolves the UUID, fetches active product metadata, and renders title/description/canonical metadata server-side)
- `/cart/`, `/checkout/`, `/about/`, `/contact/`
- `/admin/` (copies the R2 admin panel; exit link points to `/`)

## Shared services
The approved root storefront HTML remains byte-for-byte unchanged; the Worker injects links to the independent routes into its existing desktop/mobile navigation at response time. Pages use the Mahgold Supabase project and shared CSS/modules. Product data is read from `public.products`. The admin page retains the existing Supabase sign-in and both `profiles.role = 'admin'` and `store_admins` membership checks.

## Order security
The checkout client calls the existing `mahgold-create-order` Edge Function. That function uses the server-side service role to invoke the idempotent order RPC. The existing `MAHGOLD_ORDERS_ENABLED` feature gate remains unchanged and closed; no order-enabling secret was changed and no Edge Function was redeployed. Checkout cannot create orders until the existing licensing/payment prerequisites are completed and the gate is deliberately enabled.

The static-assets ignore file excludes Worker source, deployment configuration, CI scripts, and Supabase Edge Function source from public asset uploads. Unknown paths return the dedicated `404.html`; no SPA fallback is configured.

## Deploy
Use a separate Worker named `mahgold-mpa-staging` with `wrangler.jsonc`. Do not bind `mah-gold.ir` or change production DNS until the staging Worker has passed direct URL, refresh, mobile, admin-auth, cart and checkout tests.

## Current staging verification notes (2026-11-24)

- The existing admin panel checks both `profiles.role = 'admin'` and membership in `store_admins`. The connected Mahgold database currently reports zero rows in `store_admins`; therefore admin sign-in is expected to deny access until the intended operator's authenticated user UUID is explicitly allowlisted. Do not weaken or remove this second check to make the panel appear accessible.
- Supabase Security Advisor currently reports leaked-password protection disabled. Enable it in Auth password/security settings before production cutover.
- The checkout client and Edge Function remain fail-closed. Keep `STAGING_SUBMISSION_ENABLED=false` and the server-side `MAHGOLD_ORDERS_ENABLED` gate closed until licensing and a verified payment callback are ready.
- Shared MPA CSS now includes visible keyboard focus, reduced-motion handling, and mobile navigation/layout refinements. CI verifies these requirements.
