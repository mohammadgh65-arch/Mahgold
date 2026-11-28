import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const sql = readFileSync('supabase/migrations/20261128120000_require_aal2_for_admin_data_access.sql', 'utf8');
const admin = readFileSync('src/Admin.jsx', 'utf8');

const requiredPolicies = [
  'Admins delete products','Admins insert products','Admins update products',
  'Authenticated can read active products or admin products',
  'Basic admins delete categories','Basic admins insert categories','Basic admins update categories',
  'Basic admins delete site content','Basic admins insert site content','Basic admins update site content',
  'Admins insert store settings','Admins update store settings',
  'Admins can manage archived state of paid orders','Admins can update orders',
  'Customers can read own orders','Customers can read own order items',
  'Basic admins upload product images','Basic admins update product images','Basic admins delete product images',
  'Admins delete market quotes','Admins insert market quotes','Admins update market quotes',
  'Admins inspect reservations','Admins release reservations',
  'profiles_select_own_or_admin','profiles_update_own_or_admin',
  'Customers can read own order status events'
];

assert.match(sql, /SECURITY DEFINER/i, 'admin predicate must run as SECURITY DEFINER');
assert.match(sql, /SET search_path TO ''/i, 'admin predicate must use an empty search_path');

const functionStart = sql.indexOf('CREATE OR REPLACE FUNCTION public.zarin_is_admin()');
assert.notEqual(functionStart, -1, 'hardened admin function must be defined');
const functionEnd = sql.indexOf('$function$;', functionStart);
assert.notEqual(functionEnd, -1, 'admin function body must terminate');
const adminFunction = sql.slice(functionStart, functionEnd);

assert.match(adminFunction, /auth\.jwt\(\)\s*->>\s*'aal'\)\s*=\s*'aal2'/i, 'AAL2 claim must be required');
assert.match(adminFunction, /FROM public\.profiles p[\s\S]*?p\.id\s*=\s*\(SELECT auth\.uid\(\)\)[\s\S]*?p\.role\s*=\s*'admin'/i,
  'profiles role must be tied to the current authenticated user');
assert.match(adminFunction, /FROM public\.store_admins a[\s\S]*?a\.user_id\s*=\s*\(SELECT auth\.uid\(\)\)/i,
  'store_admin membership must be tied to the current authenticated user');
assert.match(adminFunction, /AND EXISTS[\s\S]*?public\.profiles[\s\S]*?AND EXISTS[\s\S]*?public\.store_admins/i,
  'both admin authorization records must be required');

for (const policy of requiredPolicies) {
  const start = sql.indexOf(`ALTER POLICY "${policy}"`);
  assert.notEqual(start, -1, `missing target policy: ${policy}`);
  const next = sql.indexOf('ALTER POLICY "', start + 1);
  const block = sql.slice(start, next === -1 ? sql.length : next);
  assert.match(block, /public\.zarin_is_admin\(\)/i,
    `policy must use the hardened admin predicate: ${policy}`);
}

assert.match(sql, /Customers can read own orders"[\s\S]*?auth\.uid\(\)[\s\S]*?customer_id[\s\S]*?OR public\.zarin_is_admin\(\)/i,
  'customer order SELECT must retain owner access as well as admin access');
assert.match(sql, /Customers can read own order status events"[\s\S]*?o\.customer_id\s*=\s*\(SELECT auth\.uid\(\)\)[\s\S]*?OR public\.zarin_is_admin\(\)/i,
  'customer order-status event access must remain parent-order owner scoped');
assert.match(sql, /Customers can read own order items"[\s\S]*?o\.customer_id\s*=\s*\(SELECT auth\.uid\(\)\)[\s\S]*?OR public\.zarin_is_admin\(\)/i,
  'customer order-item access must remain parent-order owner scoped');
assert.match(sql, /is_active\s*=\s*true\)\s*OR public\.zarin_is_admin\(\)/i,
  'authenticated active-product visibility must remain public to signed-in customers');
assert.match(sql, /Admins can manage archived state of paid orders"[\s\S]*?USING\s*\(public\.zarin_is_admin\(\) AND status = 'paid'\)[\s\S]*?WITH CHECK\s*\(public\.zarin_is_admin\(\) AND status = 'paid'\)/i,
  'paid-order archive policy must constrain both existing and resulting rows');
assert.match(sql, /Admins can update orders"[\s\S]*?status <> 'paid'/i,
  'ordinary admin order update policy must exclude paid rows');
assert.doesNotMatch(sql, /DROP POLICY|DROP TABLE|TRUNCATE|DELETE FROM/i, 'migration must not contain destructive DML/DDL');
assert.doesNotMatch(sql, /enforce_product_pricing_mfa/i, 'pricing MFA trigger must not be modified by this migration');

// Frontend fail-closed checks: MFA must be verified before admin role reads,
// and admin-only table loading must be gated by the combined admin state.
assert.match(admin, /aalData\?\.currentLevel===['"]aal2['"]/, 'frontend must check current AAL2 level');
assert.match(admin, /supabase\.auth\.mfa\.verify\(/, 'frontend must verify the authenticator challenge');
assert.match(admin, /if\(!session\|\|!aal2Ready\)/, 'profile/admin membership lookup must wait for session and AAL2');
assert.match(admin, /profileResult\.data\?\.role===['"]admin['"]&&!!adminResult\.data/, 'frontend must require profile admin role and store_admins membership');
assert.match(admin, /if\(!supabase\|\|!adminOk\)return/, 'admin data loader must fail closed');
assert.match(admin, /if\(mfaMode!==['"]complete['"]\|\|!aal2Ready\)/, 'UI must block panel until MFA is complete');

console.log(`Admin MFA static contract passed: ${requiredPolicies.length} RLS policy targets + exact identity predicates and frontend fail-closed checks.`);
