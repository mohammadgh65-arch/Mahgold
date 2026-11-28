# Supabase migration-history reconciliation

**Snapshot date:** 2026-11-28  
**Scope:** Read-only comparison of the linked project's `supabase_migrations.schema_migrations` ledger for versions `20261101...` through `20261128...` against the migration files tracked in the review branch `fix/latest-storefront-admin-mfa-20261128`.

This document records observed metadata only. It does **not** recreate, replace, or certify historical SQL. Do not apply migrations or use this branch as a complete clean-install/replay baseline until the canonical migration source is recovered and reconciled.

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

## Files currently tracked in this review branch

- `20261120130000_allow_fresh_manual_gold_quotes.sql`
- `20261120140000_support_manual_quote_auto_price_refresh.sql`
- `20261120150000_block_unverified_paid_orders.sql`
- `20261120170000_customer_order_tracking.sql`
- `20261122090000_connect_automatic_product_pricing_triggers.sql`
- `20261126092530_mahgold_require_expected_price_and_secure_quote_expiry.sql`
- `20261127100000_admin_order_archive_recoverable_delete.sql`
- `20261128120000_require_aal2_for_admin_data_access.sql`

## Known discrepancies and required resolution

- The live ledger records the two earlier AAL2/admin migrations at versions `20261114212315` and `20261123142051`; their exact source files are not tracked in the reviewed branch and were not found by path-specific GitHub history lookup.
- Several tracked migration filenames do not have the same timestamp as the corresponding ledger entry. For example, the manual quote and customer order tracking migrations have ledger versions `20261120082159`, `20261120082437`, and `20261120165100`, while the repository filenames use different timestamps.
- Numerous other live ledger entries in this November window have no exact-version file in the reviewed branch. This is a migration-source/history gap, not proof that the live database is missing those changes.
- Recover exact canonical SQL from the original source repository or a verified backup. Then reconcile version/name metadata and validate replay on a disposable database before any production change.

**Production status:** This investigation was read-only. No live SQL migration or schema change was executed.