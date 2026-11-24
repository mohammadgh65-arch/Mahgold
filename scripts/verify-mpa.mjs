import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";

const pages = ["index.html","products/index.html","category/jewelry/index.html","category/melted-gold/index.html","category/coins/index.html","category/bars/index.html","product/index.html","cart/index.html","checkout/index.html","about/index.html","contact/index.html","admin/index.html","404.html"];
const modules = ["assets/products.mjs","assets/category.mjs","assets/product.mjs","assets/cart.mjs","assets/checkout.mjs","assets/mpa.css","worker.js","wrangler.jsonc",".assetsignore","supabase/functions/mahgold-create-order/index.ts"];
const failures = [];
for (const path of [...pages, ...modules]) {
  try { await access(path, constants.R_OK); }
  catch { failures.push("Missing file: " + path); }
}
for (const path of pages) {
  try {
    const html = await readFile(path, "utf8");
    if (!/^<!doctype html>/i.test(html)) failures.push("Missing doctype: " + path);
    if ((html.match(/<body\b/gi) || []).length !== 1) failures.push("Expected one body start: " + path);
    if ((html.match(/<\/body>/gi) || []).length !== 1) failures.push("Expected one body end: " + path);
    if (path !== "admin/index.html" && path !== "index.html" && !html.includes("/assets/mpa.css")) failures.push("Shared stylesheet not linked: " + path);
  } catch {}
}
const worker = await readFile("worker.js", "utf8").catch(() => "");
if (!worker.includes("env.ASSETS.fetch") || !worker.includes("/product/index.html")) failures.push("Worker product route resolver is missing.");
const orderFn = await readFile("supabase/functions/mahgold-create-order/index.ts", "utf8").catch(() => "");
if (!orderFn.includes("MAHGOLD_ORDERS_ENABLED") || !orderFn.includes("mahgold_create_order_idempotent")) failures.push("Secure order function must retain its server-side feature gate and idempotent RPC.");
const admin = await readFile("admin/index.html", "utf8").catch(() => "");
if (!admin.includes("signInWithPassword") || !admin.includes("store_admins")) failures.push("Admin login must retain Supabase authentication and admin membership check.");
if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log("MPA checks passed: " + pages.length + " HTML pages and " + modules.length + " runtime/config files.");
}
