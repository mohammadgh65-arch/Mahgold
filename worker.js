function injectNavigation(response) {
  const script = '<script>(() => { const links = [["/products/","همه محصولات"],["/category/jewelry/","طلای زینتی"],["/category/melted-gold/","طلای آب‌شده"],["/category/coins/","سکه"],["/category/bars/","شمش"],["/cart/","سبد خرید"],["/about/","درباره ما"],["/contact/","تماس"]]; const attach = (selector) => { const nav = document.querySelector(selector); if (!nav) return; for (const [href, label] of links) { if (nav.querySelector("[data-mpa-href=\"" + href + "\"]")) continue; const a = document.createElement("a"); a.href = href; a.dataset.mpaHref = href; a.textContent = label; nav.appendChild(a); } }; const update = () => { attach(".ref-primary-nav"); attach(".ref-mobile-links"); }; const observer = new MutationObserver(update); observer.observe(document.documentElement, { childList: true, subtree: true }); update(); })();</script>';
  return new HTMLRewriter().on("body", {
    element(element) { element.append(script, { html: true }); }
  }).transform(response);
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
    const productMatch = path.match(/^\\/product\\/([^/]+)\\/?$/);
    if (productMatch) {
      if (!path.endsWith("/")) {
        url.pathname = path + "/";
        return Response.redirect(url, 308);
      }
      const rewritten = new URL("/product/index.html", url);
      return env.ASSETS.fetch(new Request(rewritten, request));
    }
    if (path === "/product" || path === "/product/") {
      return Response.redirect(new URL("/products/", url), 302);
    }
    const response = await env.ASSETS.fetch(request);
    if (path === "/" || path === "/index.html") return injectNavigation(response);
    return response;
  }
};