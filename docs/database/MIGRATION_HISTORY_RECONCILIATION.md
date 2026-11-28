# Supabase migration-history reconciliation

**Snapshot date:** 2026-11-28  
**Scope:** Read-only comparison of the linked project's `supabase_migrations.schema_migrations` ledger for versions `20261101...` through `20261128...` against the migration files tracked in the review branch `fix/latest-storefront-admin-mfa-20261128`.

This document records observed metadata only. It does **not** certify the complete historical migration chain. Do not apply migrations or use this branch as a complete clean-install/replay baseline until canonical source is reconciled.

## Live ledger entries in scope

| Version | Ledger name |
|---|---|
| 20261111180650 | create_customer_cart_items |
| 20261111190158 | mahgold_security_hardening_public_access |
| 20261111190305 | mahgold_limit_public_product_columns |
| 20261111225506 | add_mahgold_site_content_management |
| 20261111225725 | expand_mahgold_jewelry_categories |
| 20261113081912 | 210eba85-4a5a-454b-ad2f-642b61cb9197 |
| 20261113205115 | add_secure_customer_order_creation |
| 20261113205154 | harden_order_items_and_stock_validation |
| 20261113205507 | restrict_direct_customer_order_writes |
| 20261114212315 | require_aal2_for_mahgold_admin_access |
| 20261115164955 | checkout_expected_price_guard |
| 20261115180546 | 202611150003_1405_gold_vat_alignment |
| 20261115180554 | 202611150004_order_invoice_breakdown |
| 20261115190424 | add_product_attributes_jsonb |
| 20261118112409 | secure_order_edge_gateway |
| 20261118112536 | disable_public_order_rpc |
| 20261118112551 | explicit_service_role_rate_limit_policy |
| 20261118113622 | add_order_idempotency |
| 20261118151700 | require_fresh_live_quote_for_auto_orders |
| 20261118155344 | mahgold_refresh_auto_prices_on_quote |
| 20261118155652 | mahgold_remove_legacy_quote_statement_trigger |
| 20261118160608 | mahgold_rls_policy_cleanup_and_fk_indexes |
| 20261118160628 | mahgold_products_policy_split |
| 20261120075717 | mahgold_guard_customer_profile_roles |
| 20261120082159 | allow_fresh_manual_gold_quotes |
| 20261120082437 | support_manual_quote_auto_price_refresh |
| 20261120083547 | block_unverified_paid_orders |
| 20261120165100 | mahgold_customer_order_tracking_and_auth_scaffold |
| 20261121213640 | mahgold_enforce_order_status_transitions |
| 20261121213931 | mahgold_fix_service_role_order_transition |
| 20261122114941 | mahgold_admin_product_visibility |
| 20261123141500 | mahgold_restrict_public_internal_pricing_columns |
| 20261123141600 | mahgold_public_column_allowlist |
| 20261123142051 | mahgold_require_aal2_for_admin_rls |
| 20261123142214 | mahgold_split_public_and_authenticated_product_select |
| 20261123142925 | mahgold_harden_legacy_definer_search_paths |
| 20261123153120 | order_archive_and_safe_cancelled_delete |
| 20261123153136 | expose_order_admin_actions_to_authenticated |
| 20261125200642 | index_orders_archived_by_fk |
| 20261126092530 | mahgold_require_expected_price_and_secure_quote_expiry |
| 20261126203302 | mahgold_admin_order_archive_recoverable_delete |
| 20261126203620 | allow_admin_soft_archive_paid_orders |
| 20261126203802 | grant_admin_order_archive_update_columns |


## Live Supabase advisor snapshot (read-only, 2026-11-28)

- **Security warning:** Supabase Auth leaked-password protection is disabled. This is an Auth configuration item, not something the proposed RLS migration changes.
- **Performance info:** `public.orders.deleted_by` foreign key has no covering index. The advisor also reports seven currently unused indexes; do not remove them based only on this snapshot, since low/seasonal traffic can make valid indexes appear unused.
- **Performance warning:** `public.orders` has multiple permissive UPDATE policies for authenticated users (`Admins can manage archived state of paid orders` and `Admins can update orders`). This appears intentional to separate paid-order archival from ordinary order updates; retain the distinct safeguards unless a tested policy consolidation proves equivalent.
- **Health advisor:** no findings at the time of this snapshot.

These are advisory findings only. No Auth configuration, index, policy, or production data was changed.

### Leaked-password protection plan requirement

The linked Supabase organization was checked on 2026-11-28 and is currently on the **Free** plan. Supabase documentation states that leaked-password protection (HaveIBeenPwned/Pwned Passwords checks) is available on **Pro and above**. Migration alone cannot enable this Auth feature. Keep it as a post-migration Auth hardening item, conditional on a Pro-or-higher plan; do not upgrade or incur costs automatically. If the project remains Free, retain the available password-strength controls and document that they are not equivalent to breached-password screening.

Official documentation: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Recovered historical source

- **Recovered exactly:** `20261123142051_mahgold_require_aal2_for_admin_rls.sql`
  - Found on branch `mahgold-production-hardening-20261123`.
  - Restored verbatim to this review branch in commit `ca596b1cee8c950997ef09b187af53b7b9a5c85d`.
  - This is a historical source file already represented in the live migration ledger; do not reapply it to production.
- **Still missing:** `20261114212315_require_aal2_for_mahgold_admin_access.sql`. Its exact source has not yet been recovered.

## Branch files and remaining gaps

The review branch contains the current storefront migrations and the restored historical AAL2 migration. Other November ledger entries still do not all map to exact-version files in this branch. Some tracked migration filenames differ from live ledger versions/names (e.g. manual quote and order tracking migrations).

This is a repository/source-history gap, not proof that the live database is missing those changes. Recover remaining canonical SQL from original source or a verified backup, then reconcile metadata and replay-test on a disposable database before any production change.

## Additional read-only RLS review (2026-11-28)

A policy catalog scan found admin-only market quote and inventory reservation policies, plus store-settings insert/update policies, that still referenced the legacy admin predicate. The proposed review migration now switches these policy paths to the hardened AAL2 predicate and the static contract test lists each target. This is a source-level correction only; PostgreSQL execution and role-matrix testing remain outstanding.

**Additional ownership check (2026-11-28):** The proposed policy keeps customer access to their own profiles, orders, order items, and order-status events while routing the administrator branch through the strengthened AAL2 predicate. The static contract now explicitly asserts parent-order ownership for order-status event reads, retains owner-scoped profile updates, and ensures this review migration does not remove or replace the separate profile-role guard. The linked live policy catalog was re-read to confirm the exact policy names and current predicates; no policy or data was changed.

**Profile role-escalation safeguard (read-only live check):** The linked production catalog contains a `BEFORE INSERT OR UPDATE OF role` trigger on `public.profiles` named `mahgold_profiles_guard_role`, invoking `mahgold_enforce_profile_role()`. Its function forces self-created profiles to `customer` and prevents non-privileged callers from changing their own role. The exact historical migration source for this guard was not found among the review-branch migration files. Therefore this live safeguard is confirmed for the current database, but its presence in a clean migration replay is **not yet proven**. Keep the migration-history/replay blocker open; do not infer that the policy migration alone installs this trigger.

**Validation status (2026-11-28):** On current PR head `7143c6c53ad851ca2f33af8a9d94d3713f9e638c`, GitHub Actions `static-contract` passed (run `46141631437`) and Cloudflare Pages preview deployment passed (check `140968682825`; preview `https://5fb48ba6.mahgold-production.pages.dev`). The static job explicitly identifies itself as static, not a PostgreSQL execution test. No local PostgreSQL server, `psql`, `initdb`, or Docker runtime was available in the execution environment; browser-based MFA/admin smoke testing also remains outstanding.

**Production status:** Read-only catalog/ledger queries only. No live SQL migration or schema change was executed; no production deployment was initiated.
