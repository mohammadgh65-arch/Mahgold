export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const productMatch = url.pathname.match(/^\/product\/([^/]+)\/?$/);
    if (productMatch) {
      const rewritten = new URL("/product/index.html", url);
      return env.ASSETS.fetch(new Request(rewritten, request));
    }
    if (url.pathname === "/product" || url.pathname === "/product/") {
      return Response.redirect(new URL("/products/", url), 302);
    }
    return env.ASSETS.fetch(request);
  }
};