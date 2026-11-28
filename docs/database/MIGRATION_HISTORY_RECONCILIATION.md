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


## Exact review-branch migration inventory (read-only, 2026-11-28)

A fresh GitHub directory listing of `supabase/migrations/` at PR head `7cb4a753fd44fa8dbcd39d55ad6e06cc970b008a` returned exactly **9 SQL files**:

- `20261120130000_allow_fresh_manual_gold_quotes.sql`
- `20261120140000_support_manual_quote_auto_price_refresh.sql`
- `20261120150000_block_unverified_paid_orders.sql`
- `20261120170000_customer_order_tracking.sql`
- `20261122090000_connect_automatic_product_pricing_triggers.sql`
- `20261123142051_mahgold_require_aal2_for_admin_rls.sql`
- `20261126092530_mahgold_require_expected_price_and_secure_quote_expiry.sql`
- `20261127100000_admin_order_archive_recoverable_delete.sql`
- `20261128120000_require_aal2_for_admin_data_access.sql`

This inventory confirms that the review branch is **not a complete migration archive** for the 43-entry live ledger. In particular, the exact source for live version `20261114212315` is absent, as are many earlier migration files. Several later live ledger versions are represented only by differently timestamped/name-mismatched files, so do not treat filename similarity as proof of equivalence.

A fresh search of the repository's branches for `20261114`, code search for `require_aal2_for_mahgold_admin_access`, and commit search for the same identifier returned no matches. The linked Supabase project currently has **no development branches**. No branch was created because development branches may incur charges and the project must remain free.

**Next safe step:** obtain the original migration archive or a verified database/source backup containing the missing SQL, then compare exact contents and checksums against the live ledger. Until then, do not attempt a clean replay, mark missing migrations as resolved, or apply the proposed `20261128120000` migration to production.


## Historical admin-access PR cross-check (2026-11-28)

An additional review of earlier repository PRs found PR #14/#15, titled "Separate basic admin access from MFA-protected operations". PR #15 is merged and its body states that its matching migration was applied and the RLS policies verified. The exact SQL available on its source branch is `20261123190000_mahgold_tiered_admin_access.sql` (blob `b3f138cba686dd4d78caa7ee05ede8b774cb4989`). It creates `zarin_is_admin_basic()` and moves only category, site-content, and product-image policies to that basic-admin predicate while retaining AAL2 for sensitive operations.

This is useful historical evidence for the tiered-admin design, but it is **not** the missing `20261114212315_require_aal2_for_mahgold_admin_access.sql`: its version, filename, and purpose differ. It must not be renamed or substituted for the missing migration. PR #14 remains open with a different source branch; PR #15 was merged at `0cf544663f1a1c3d6d7d885503b603b17301ddae`.

The exact-source recovery blocker for `20261114212315` therefore remains open. This cross-check was read-only; no migration was applied or changed.


## Encrypted backup workflow audit (2026-11-28)

The repository's `.github/workflows/supabase-backup.yml` was inspected. It is designed to create a custom-format `pg_dump`, encrypt it with AES-256 using `BACKUP_ENCRYPTION_PASSPHRASE`, and upload a 7-day GitHub Actions artifact. No artifact was produced in the two most recent scheduled runs:

- Run `46108592679` (2026-11-28): failed in `Create encrypted database dump`.
- Run `45941435788` (2026-11-27): failed at the same step.
- Both logs show PostgreSQL reached the Supabase session pooler at `aws-0-ap-southeast-1.pooler.supabase.com:5432`, then rejected authentication for user `postgres` with `password authentication failed`.
- The logs mask secret values; this audit does not reveal or infer them. The failure is consistent with an invalid/stale database password or a mismatched connection string/credential. It does not prove which secret is wrong.
- The artifact-upload step was skipped, and the latest run has no artifacts. Therefore these runs cannot supply the missing historical SQL archive or a database dump.

Security/operational consequence: there is currently no successful backup artifact evidenced by these two runs. The GitHub Actions secrets `SUPABASE_SESSION_POOLER_URL` and `BACKUP_ENCRYPTION_PASSPHRASE` require owner-side verification/update before a future backup run. Do not print secrets, add credentials to repository files, or attempt password resets from this review.

This is a read-only audit. No secrets, database credentials, workflow definitions, or production database settings were changed.


## Supavisor credential-format diagnosis (read-only, 2026-11-28)

The two failed backup job logs show the connection reached the Shared Pooler (Supavisor) session endpoint on port 5432, but PostgreSQL reported the attempted role as `postgres`. The current Supabase connection guide documents the session-pooler username format as `postgres.<project-ref>`, not plain `postgres`:

- Official guide: https://supabase.com/docs/guides/database/connecting-to-postgres
- Mahgold project ref: `nzvvvpbwavaodhxrnkdr`
- Expected pooler username shape: `postgres.nzvvvpbwavaodhxrnkdr`
- The password must be the current database password; reserved URI characters must be percent-encoded.

This makes a malformed/stale `SUPABASE_SESSION_POOLER_URL` a concrete likely cause of the backup failure. The Actions log masks the actual secret, so its full value was not inspected and the diagnosis is not treated as proven. The repository workflow and GitHub secret were not modified.

Owner-side corrective action: in GitHub repository Settings → Secrets and variables → Actions, replace `SUPABASE_SESSION_POOLER_URL` with the exact Session pooler URI copied from the Mahgold Supabase dashboard (Connect → Session pooler), checking the username format above and using the current database password. Do not paste the URI or password into chat, issues, commits, or workflow logs. Then manually run the encrypted backup workflow and verify that the dump and encrypted artifact upload both succeed. No password reset is necessary unless the current database password is unknown or invalid.

This conclusion follows the official Supabase connection guide and the masked failure logs. No credentials or production settings were changed.


## Live administrator predicate and profile-role trigger verification (read-only, 2026-11-28)

A fresh read-only catalog query against the linked production database confirmed:

- Current `public.zarin_is_admin()` is **not** `SECURITY DEFINER`; it is owned by `postgres`, uses an empty search path, and currently requires AAL2 plus membership in `public.store_admins`. It does not currently check `profiles.role = 'admin'`.
- Current `public.zarin_is_admin_basic()` is also not `SECURITY DEFINER`; it checks both `profiles.role = 'admin'` and `store_admins` membership but does not require AAL2.
- Authenticated users can execute both predicates; anon cannot. The profile-role trigger function is not executable by authenticated or anon directly.
- `mahgold_profiles_guard_role` is confirmed as a `BEFORE INSERT OR UPDATE OF role` trigger on `public.profiles`. Its function `mahgold_enforce_profile_role()` forces newly inserted profiles to `customer`; only database operators with current_user in `postgres`, `service_role`, or `supabase_admin` may assign privileged roles directly. Other callers cannot change their own role unless already authorized by `public.zarin_is_admin()`.
- All ten reviewed public tables have RLS enabled (not forced). This is the current state; the review did not change it.

The proposed `20261128120000_require_aal2_for_admin_data_access.sql` changes the administrator predicate to `SECURITY DEFINER`, requires AAL2, `profiles.role = 'admin'`, and `store_admins` membership, then redirects the legacy basic-admin RLS policy paths to that predicate. A fresh catalog comparison found 16 live policy expressions using `zarin_is_admin_basic()`; the proposed migration includes those policy targets (including the order, order-item, product, category, site-content, store-settings, and product-image paths). Existing policies already using `zarin_is_admin()` inherit the hardened predicate when the function is replaced.

**Operational implication:** an administrator's profile role must be provisioned by a trusted server/database operator; the browser's self-service profile update cannot promote a customer to admin. The proposed migration does not remove or replace the role guard. Keep exact historical source recovery and clean replay validation as blockers; do not apply the proposed migration to production yet.

This verification used read-only catalog queries only. No function, trigger, policy, role, grant, or production data was changed.


## Order lifecycle, paid-order immutability, and soft-archive audit (read-only, 2026-11-28)

A fresh read-only inspection covered live triggers, trigger functions, RLS policies, constraints, indexes, function grants, and status counts for `orders`, `order_items`, `order_status_events`, and `inventory_reservations`.

### Confirmed safeguards
- `mahgold_block_unverified_paid_status()` rejects every attempt to set an order's status to `paid`. This is a fail-closed safeguard until a real payment gateway verification flow is implemented; the database currently does not allow the admin UI or service role to mark an order paid through an ordinary status update.
- `mahgold_enforce_order_status_transition()` is `SECURITY DEFINER`, uses an empty search path, and restricts status transitions to the documented lifecycle. It permits authenticated AAL2 admins or the service role, and releases active inventory reservations on `cancelled` or `payment_failed`.
- `mahgold_record_order_status()` records initial and changed statuses in `order_status_events` using a `SECURITY DEFINER` trigger.
- `guard_paid_order_archive_only()` blocks changes to paid-order fields other than the explicit archive/soft-delete metadata and `updated_at`, for basic admins. This is an independent row-level guard; preserve it when changing admin RLS policies.
- The private `private.set_order_archived(uuid, boolean)` routine is `SECURITY DEFINER`, requires a non-null authenticated user and `zarin_is_admin()`, locks the target order, and only archives/restores orders whose status is `completed` and whose `paid_at` is non-null.
- The public `mahgold_set_order_archived(uuid, boolean)` wrapper is invoker-security and delegates to that private routine. Authenticated users can execute the private routine; anon cannot.
- Order-item snapshots have line-total arithmetic checks and positive quantity/price checks. Reservation rows have positive-quantity, valid-status, expiry, uniqueness, and foreign-key constraints. Order-status history and reservations are indexed by their order identifiers.

### Findings requiring attention before future changes
- The wrapper currently has an EXECUTE grant for `service_role`, but the private routine is not executable by `service_role` and independently rejects calls where `auth.uid()` is null. Therefore the service-role grant on the public wrapper does not provide a working service-role archive path. The current design effectively requires an authenticated AAL2 admin. Do not broaden this path without an explicit server-side authorization design.
- The paid-order archive trigger still calls `zarin_is_admin_basic()`. If the proposed MFA migration is applied, verify this trigger under the final admin predicate and test the paid-order field-difference allowlist; do not remove the trigger.
- The order status CHECK constraint includes `paid`, but the dedicated trigger intentionally blocks setting that status until gateway verification exists. A future payment integration must implement a verified, server-only transition rather than weakening the trigger.
- The live order table currently contains only **2 rows**, both `cancelled`; there are no live `paid` or `completed` orders at this snapshot. Consequently, the paid-order immutability and archive/restore paths have not been exercised against live paid records.
- Foreign keys from `order_items` and `order_status_events` to `orders` use `ON DELETE CASCADE`. Keep hard deletion inaccessible to ordinary users and retain soft archive/delete as the normal administrative workflow.

### Validation limits
This was catalog/source inspection only. No test order was created, no row was updated or deleted, no payment was simulated, and no trigger/function/policy/grant/index was changed. A disposable PostgreSQL role-matrix test is still required for: ordinary customer, admin at AAL1, admin at AAL2, service role, paid-order archive/restore, attempted paid-status assignment, and cancellation reservation release.
