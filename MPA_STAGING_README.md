# Mahgold MPA staging

This branch is an isolated implementation workspace. It does not change `main`, production DNS, or the currently deployed Worker.

## Independent documents
- `/products/`
- `/category/jewelry/`, `/category/melted-gold/`, `/category/coins/`, `/category/bars/`
- `/product/{product-id}/` (Worker resolves the slug/ID to the product document)
- `/cart/`, `/checkout/`, `/about/`, `/contact/`
- `/admin/` (copies the R2 admin panel; exit link points to `/`)

## Shared services
Pages use the Mahgold Supabase project and shared CSS/modules. Product data is read from `public.products`. The admin page retains the existing Supabase sign-in and both `profiles.role = 'admin'` and `store_admins` membership checks.

## Order security
The checkout client calls the existing `mahgold-create-order` Edge Function. That function uses the server-side service role to invoke the idempotent order RPC. The existing `MAHGOLD_ORDERS_ENABLED` feature gate remains unchanged and closed; no order-enabling secret was changed and no Edge Function was redeployed. Checkout cannot create orders until the existing licensing/payment prerequisites are completed and the gate is deliberately enabled.

## Deploy
Use a separate Worker named `mahgold-mpa-staging` with `wrangler.jsonc`. Do not bind `mah-gold.ir` or change production DNS until the staging Worker has passed direct URL, refresh, mobile, admin-auth, cart and checkout tests.
