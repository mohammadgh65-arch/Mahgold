# Mahgold — Product SEO metadata audit

## Scope
Audit of the current `index.html` blob on branch `seo-product-metadata-preview` (blob SHA: `0ef5918abbadcfe82134e65550ce557f8e12d47a`). The 6 MB source was successfully retrieved through Git blob access and inspected without replacing or editing it.

## Confirmed findings
- The document has one static page title: `مه‌گلد | طلا، با امضای شما`.
- The document has one static description: `مه‌گلد؛ طلا، با امضای شما. مجموعه‌ای از زیورآلات، طلای آب‌شده، سکه و شمش.`
- No `og:title`, `og:description`, or JSON-LD Product structured data were found in the HTML source.
- The storefront loads active products from Supabase (`products`) and categories separately. Product records include fields such as `id`, `name`, `category`, `description`, `image_url`, `weight_grams`, `karat`, `price_toman`, `stock`, and `tag`.
- The audited file is a bundled React single-page application. There is no confirmed server-rendered, crawlable individual product URL pattern in this source inspection. Therefore product-specific meta tags cannot safely be implemented by simply adding a single static meta block to the shared HTML head.

## Follow-up route inspection (branch comparison)
Reviewed `src/App.jsx`, `index.html`, `public/_redirects`, and `wrangler.jsonc` on branch `feature/product-pages-dynamic-attributes-cart-toast` (commit `b61b3b203d9644a2f990d85c364b20e994bf487b`).
- Product detail route currently matches `/product/:id`, using the Supabase product ID as the route segment.
- Product navigation uses client-side `history.pushState`; the React app resolves the product from the already-loaded product collection. Direct refresh is routed to `index.html` by the catch-all `public/_redirects`, and Cloudflare assets use SPA fallback.
- The checked `index.html` contains only the shared title and description. No route-specific Open Graph or Product JSON-LD is present in that HTML.
- This is evidence of client-side route behavior only; it does not prove that search crawlers or social preview bots receive product-specific metadata from the initial HTML response.

## Safe implementation sequence
1. Establish a canonical, stable product URL pattern and verify that each product route loads directly and survives refresh.
2. Add route-aware title, description, canonical URL, Open Graph tags, and Product JSON-LD using actual product data (escaping JSON safely).
3. Add a sitemap containing only canonical, public, active product URLs; add robots.txt only after the canonical domain and crawl policy are confirmed.
4. Validate direct URL loading, metadata in the raw HTML response (not only after client-side JavaScript), canonical consistency, and structured-data errors.
5. Keep the patch isolated to this preview branch until the owner reviews it.

## Safety
No production deployment, database mutation, or change to the large `index.html` was made during this audit. This document records verified findings and the prerequisite for a correct implementation.
