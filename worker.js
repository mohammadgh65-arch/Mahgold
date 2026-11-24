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
      const rewritten = new URL("/product/index.html", url);
      return env.ASSETS.fetch(new Request(rewritten, request));
    }
    if (path === "/product" || path === "/product/") {
      return Response.redirect(new URL("/products/", url), 302);
    }
    return env.ASSETS.fetch(request);
  }
};