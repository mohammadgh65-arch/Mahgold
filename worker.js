const SUPABASE_URL = "https://nzvvvpbwavaodhxrnkdr.supabase.co";
const SUPABASE_PUBLIC_KEY = "sb_publishable_8UgFkQuDJNNeez2O1CNv3Q_Jf44PrL9";
function injectNavigation(response) {
  const script = '<script>(() => { const links = [["/products/","همه محصولات"],["/category/jewelry/","طلای زینتی"],["/category/melted-gold/","طلای آب‌شده"],["/category/coins/","سکه"],["/category/bars/","شمش"],["/cart/","سبد خرید"],["/about/","درباره ما"],["/contact/","تماس"]]; const attach = (selector) => { const nav = document.querySelector(selector); if (!nav) return; for (const [href, label] of links) { if (nav.querySelector("[data-mpa-href=\\\"" + href + "\\\"]")) continue; const a = document.createElement("a"); a.href = href; a.dataset.mpaHref = href; a.textContent = label; nav.appendChild(a); } }; const update = () => { attach(".ref-primary-nav"); attach(".ref-mobile-links"); }; const observer = new MutationObserver(update); observer.observe(document.documentElement, { childList: true, subtree: true }); update(); })();</script>';
  return new HTMLRewriter().on("body", {
    element(element) { element.append(script + '<script type="module" src="/assets/cart-ui.mjs"></script>', { html: true }); }
  }).transform(response);
}
function escapeAttribute(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}
async function productDocument(request, env, url, productId) {
  const apiUrl = SUPABASE_URL + "/rest/v1/products?id=eq." + encodeURIComponent(productId) + "&is_active=eq.true&select=name,description";
  const lookup = await fetch(apiUrl, { headers: { apikey: SUPABASE_PUBLIC_KEY, Accept: "application/json" } });
  if (!lookup.ok) return null;
  const rows = await lookup.json();
  const product = Array.isArray(rows) ? rows[0] : null;
  if (!product) return null;
  const title = String(product.name || "محصول مه‌گلد");
  const description = String(product.description || "مشاهده مشخصات محصول در فروشگاه مه‌گلد.").slice(0, 160);
  const templateUrl = new URL("/product/index.html", url);
  const template = await env.ASSETS.fetch(new Request(templateUrl, { method: "GET", headers: request.headers }));
  const canonical = escapeAttribute(new URL(url.pathname, url.origin).toString());
  const titleAttr = escapeAttribute(title + " | مه‌گلد");
  const descriptionAttr = escapeAttribute(description);
  const transformed = new HTMLRewriter()
    .on("title", { element(element) { element.setInnerContent(title + " | مه‌گلد"); } })
    .on('meta[name="description"]', { element(element) { element.setAttribute("content", description); } })
    .on("#product-name", { element(element) { element.setInnerContent(title); } })
    .on("#product-description", { element(element) { element.setInnerContent(description); } })
    .on("head", { element(element) {
      element.append('<link rel="canonical" href="' + canonical + '"><meta property="og:title" content="' + titleAttr + '"><meta property="og:description" content="' + descriptionAttr + '">', { html: true });
    } })
    .transform(template);
  const headers = new Headers(transformed.headers);
  headers.set("Cache-Control", "no-store");
  return new Response(transformed.body, { status: transformed.status, headers });
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const staticRoutes = new Set([
      "/products", "/cart", "/checkout", "/about", "/contact", "/admin",
      "/category/jewelry", "/category/melted-gold", "/category/coins", "/category/bars"
    ]);
    if (staticRoutes.has(path)) {
      url.pathname = path + "/";
      return Response.redirect(url, 308);
    }
    const productMatch = path.match(/^\/product\/([^/]+)\/?$/);
    if (productMatch) {
      if (!path.endsWith("/")) {
        url.pathname = path + "/";
        return Response.redirect(url, 308);
      }
      const productId = decodeURIComponent(productMatch[1]).match(/^([0-9a-f-]{36})/i)?.[1];
      if (!productId) return new Response("Not found", { status: 404 });
      const response = await productDocument(request, env, url, productId);
      if (response) return response;
      const notFound = await env.ASSETS.fetch(new Request(new URL("/404.html", url)));
      return new Response(notFound.body, { status: 404, headers: notFound.headers });
    }
    if (path === "/product" || path === "/product/") {
      return Response.redirect(new URL("/products/", url), 302);
    }
    const response = await env.ASSETS.fetch(request);
    if (path === "/" || path === "/index.html") return injectNavigation(response);
    return response;
  }
};