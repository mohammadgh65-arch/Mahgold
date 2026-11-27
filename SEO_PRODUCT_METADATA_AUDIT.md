# Mahgold — Product SEO metadata audit

## Scope
Audit of the current `index.html` blob on branch `seo-product-metadata-preview` (blob SHA: `0ef5918abbadcfe82134e65550ce557f8e12d47a`). The 6 MB source was retrieved through Git blob access and inspected without replacing or editing it.

## Confirmed findings
- The document has one static page title: `مه‌گلد | طلا، با امضای شما`.
- The document has one static description: `مه‌گلد؛ طلا، با امضای شما. مجموعه‌ای از زیورآلات، طلای آب‌شده، سکه و شمش.`
- No `og:title`, `og:description`, or Product JSON-LD were found in this audited HTML source.
- The storefront loads active products from Supabase (`products`) and categories separately. Product records include fields such as `id`, `name`, `category`, `description`, `image_url`, `weight_grams`, `karat`, `price_toman`, `stock`, and `tag`.

## Route comparison
Reviewed `src/App.jsx`, `index.html`, `public/_redirects`, and `wrangler.jsonc` on:
- `feature/product-pages-dynamic-attributes-cart-toast` at commit `b61b3b203d9644a2f990d85c364b20e994bf487b`
- `fix/admin-direct-route-20261127` at commit `f8bb59c24b9eeda0d36c8a628dee5677724ed703`

Findings:
- Product route is `/product/:id`, using the Supabase product ID.
- React navigation uses `history.pushState`; the product is resolved from the client-loaded collection.
- The direct admin path `/admin` and `/admin/` are explicitly rewritten to `index.html` in the direct-route fix branch; React then renders the admin panel and marks the admin route `noindex,nofollow`. This is branch-level evidence, not live-host verification.
- In the direct-route fix branch, React updates title, description, robots, canonical, Open Graph/Twitter tags, and route JSON-LD after client-side rendering. Product and category route metadata is generated from fetched product data.
- Important limitation: these route-specific tags are injected by client-side JavaScript. They are not present as product-specific metadata in the initial raw HTML response inspected here. Some crawlers and social preview bots may not execute the app, so this is not equivalent to server-side rendering or pre-rendering.
- The SPA catch-all supports direct route refresh, but it does not by itself guarantee crawler-visible metadata.

## Remaining safe implementation sequence
1. Keep the stable product URL pattern `/product/:id` unless a deliberate canonical slug migration is planned; avoid changing existing URLs without redirects.
2. Choose a crawlable delivery approach (server rendering, static pre-rendering, or verified crawler-compatible rendering) that emits product metadata in the initial response.
3. Ensure canonical, Open Graph image/title/description and valid Product JSON-LD use actual active public product data; safely escape structured data.
4. Add a sitemap of canonical active public product URLs and confirm robots policy for the selected canonical domain.
5. Test direct refresh and raw HTTP HTML response, not only DOM after JavaScript; validate social previews and structured data.
6. Keep changes isolated for review before production deployment.

## Safety and status
No production deployment, database mutation, or live-host verification was performed. Findings describe repository branch source only.
