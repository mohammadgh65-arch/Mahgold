# Mahgold migration readiness review

Reviewed the tracked SQL files at branch `mahgold-independent-react`, commit `cceb2fb1218f08483076e569f68e13d36b9ba348`. This is a source review only; no SQL was run against Supabase.

## Migration files present
- `20261120130000_allow_fresh_manual_gold_quotes.sql`
- `20261120140000_support_manual_quote_auto_price_refresh.sql`
- `20261120150000_block_unverified_paid_orders.sql`
- `20261120170000_customer_order_tracking.sql`
- `20261122090000_connect_automatic_product_pricing_triggers.sql`

## Confirmed source-level dependencies / blockers
1. The idempotent order RPC calls `public.mahgold_create_order_secure(...)`. The tracked migrations in this branch do not define that function. It must already exist in the target database, with a reviewed signature and grants, before this migration can safely be applied.
2. The order tracking RLS policy calls `public.zarin_is_admin()`. The tracked migrations do not define it. Confirm the exact function exists and is appropriately restricted, or replace the policy with the actual admin authorization function used by this project.
3. The current tracked migration set is not a full database bootstrap: it uses existing `orders`, `products`, `market_quotes`, and `profiles` tables and columns. It must not be run against an empty or differently-versioned database as a standalone migration bundle.
4. The pricing functions are defined in the quote/price migration; their trigger wiring is in the later trigger migration. Preserve that order.
5. The migration that adds order-status history backfills existing orders. Review expected row volume and RLS behavior before applying to production.
6. The payment guard intentionally rejects setting an order to `paid` until a verified gateway integration is active. Do not remove it merely to make test orders appear paid.

## Safe validation sequence
- Inspect the target Supabase schema and function signatures read-only.
- Verify function ownership, SECURITY DEFINER search_path, EXECUTE grants, RLS policies, and unique/idempotency constraints.
- Apply to a disposable staging project first, in timestamp order, then test product save, valid/expired/manual quote refresh, order creation/replay, unauthorized order access, status history, and payment-state guard.
- Only after staging passes, prepare a separately approved production migration plan.

## Status
`NOT READY FOR LIVE APPLY`. No Supabase migration, production deployment, or live database mutation was performed during this review.
