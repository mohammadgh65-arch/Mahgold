import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const sql = readFileSync('supabase/migrations/20261128120000_require_aal2_for_admin_data_access.sql', 'utf8');

const requiredPolicies = [
  'Admins delete products','Admins insert products','Admins update products',
  'Authenticated can read active products or admin products',
  'Basic admins delete categories','Basic admins insert categories','Basic admins update categories',
  'Basic admins delete site content','Basic admins insert site content','Basic admins update site content',
  'Admins insert store settings','Admins update store settings',
  'Admins can manage archived state of paid orders','Admins can update orders',
  'Customers can read own orders','Customers can read own order items',
  'Basic admins upload product images','Basic admins update product images','Basic admins delete product images'
];

assert.match(sql, /SECURITY DEFINER/i, 'admin predicate must run as SECURITY DEFINER');
assert.match(sql, /SET search_path TO ''/i, 'admin predicate must use an empty search_path');
assert.match(sql, /auth\.jwt\(\)\s*->>\s*'aal'\)\s*=\s*'aal2'/i, 'AAL2 claim must be required');
assert.match(sql, /p\.role\s*=\s*'admin'/i, 'profiles admin role check must remain');
assert.match(sql, /public\.store_admins/i, 'store_admins membership check must remain');

for (const policy of requiredPolicies) {
  assert.ok(sql.includes(`ALTER POLICY "${policy}"`), `missing target policy: ${policy}`);
}

assert.match(sql, /Customers can read own orders"[\s\S]*?auth\.uid\(\)[\s\S]*?customer_id[\s\S]*?OR public\.zarin_is_admin\(\)/i,
  'customer order SELECT must retain owner access as well as admin access');
assert.match(sql, /is_active\s*=\s*true\)\s*OR public\.zarin_is_admin\(\)/i,
  'authenticated active-product visibility must remain public to signed-in customers');
assert.doesNotMatch(sql, /DROP POLICY|DROP TABLE|TRUNCATE|DELETE FROM/i, 'migration must not contain destructive DML/DDL');
assert.doesNotMatch(sql, /enforce_product_pricing_mfa/i, 'pricing MFA trigger must not be modified by this migration');

console.log(`Admin MFA migration static contract passed (${requiredPolicies.length} policy targets).`);
