const SUPABASE_URL = "https://nzvvvpbwavaodhxrnkdr.supabase.co";
const SUPABASE_PUBLIC_KEY = "sb_publishable_8UgFkQuDJNNeez2O1CNv3Q_Jf44PrL9";
const PUBLIC_ORIGIN = "https://mah-gold.ir";

const PAGE_SEO = {
  "/": {
    title: "مه‌گلد | خرید آنلاین طلای زینتی، سکه و شمش",
    description: "در فروشگاه مه‌گلد، محصولات طلای زینتی، طلای آب‌شده، سکه و شمش را همراه با مشخصات و اطلاعات قیمت مشاهده و بررسی کنید."
  },
  "/products/": {
    title: "خرید طلا و مشاهده محصولات | فروشگاه مه‌گلد",
    description: "مجموعه محصولات مه‌گلد؛ مشاهده انگشتر، گردنبند، دستبند، نیم‌ست، سکه و شمش همراه با مشخصات، وزن، عیار و اطلاعات قیمت."
  },
  "/category/jewelry/": {
    title: "خرید طلای زینتی؛ انگشتر، گردنبند و دستبند | مه‌گلد",
    description: "مشاهده مصنوعات طلای زینتی مه‌گلد؛ انگشتر، گردنبند، دستبند، گوشواره و نیم‌ست با مشخصات محصول، وزن و عیار."
  },
  "/category/melted-gold/": {
    title: "طلای آب‌شده | مشاهده محصولات و مشخصات | مه‌گلد",
    description: "مشاهده محصولات طلای آب‌شده در مه‌گلد و بررسی اطلاعات ثبت‌شده، مشخصات و جزئیات هر محصول."
  },
  "/category/coins/": {
    title: "خرید سکه طلا؛ مشاهده انواع سکه | مه‌گلد",
    description: "مشاهده دسته سکه طلا در فروشگاه مه‌گلد و بررسی مشخصات و اطلاعات محصولات ثبت‌شده."
  },
  "/category/bars/": {
    title: "خرید شمش طلا | مشاهده مشخصات محصولات | مه‌گلد",
    description: "مشاهده شمش‌های طلا در فروشگاه مه‌گلد و بررسی مشخصات، وزن و اطلاعات هر محصول."
  },
  "/about/": {
    title: "درباره مه‌گلد | فروشگاه مصنوعات فیزیکی طلا",
    description: "با مه‌گلد آشنا شوید؛ فروشگاه عرضه مصنوعات فیزیکی طلا با تمرکز بر شفافیت مشخصات، انتخاب آگاهانه و تجربه ساده خرید."
  },
  "/contact/": {
    title: "تماس با مه‌گلد | پشتیبانی و ارتباط با فروشگاه",
    description: "راه‌های ارتباط با فروشگاه مه‌گلد برای پرسش درباره محصولات، دریافت اطلاعات و پیگیری درخواست‌ها."
  }
};
const CATEGORY_COPY = {
  "/category/jewelry/": { heading: "طلای زینتی", intro: "در این بخش می‌توانید مصنوعات طلای زینتی مه‌گلد از جمله انگشتر، گردنبند، دستبند، گوشواره و نیم‌ست را مشاهده کنید. مشخصات هر محصول، از جمله وزن و عیار، در صفحه اختصاصی آن ارائه می‌شود." },
  "/category/melted-gold/": { heading: "طلای آب‌شده", intro: "محصولات دسته طلای آب‌شده را در این صفحه بررسی کنید. اطلاعات و مشخصات هر محصول بر اساس داده‌های ثبت‌شده در فروشگاه مه‌گلد نمایش داده می‌شود." },
  "/category/coins/": { heading: "سکه طلا", intro: "در این دسته می‌توانید محصولات سکه طلا را مشاهده و مشخصات ثبت‌شده هر مورد را پیش از تصمیم‌گیری بررسی کنید." },
  "/category/bars/": { heading: "شمش طلا", intro: "انواع شمش ثبت‌شده در فروشگاه مه‌گلد را در این صفحه ببینید و جزئیات محصول و اطلاعات وزن را در صفحه اختصاصی آن بررسی کنید." }
};

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}
function jsonLd(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}
function absolute(path) {
  return new URL(path, PUBLIC_ORIGIN).toString();
}
function productSlug(name) {
  return encodeURIComponent(String(name || "product").trim()).replace(/%20/g, "-");
}
function seoHead(response, url, seo, options = {}) {
  const canonical = options.canonical || absolute(url.pathname);
  const title = seo.title;
  const description = seo.description;
  const robots = options.noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
  const schema = options.schema ? '<script type="application/ld+json">' + jsonLd(options.schema) + '</script>' : "";
  return new HTMLRewriter()
    .on("title", { element(element) { element.setInnerContent(title); } })
    .on('meta[name="description"]', { element(element) { element.setAttribute("content", description); } })
    .on("head", { element(element) {
      element.append(
        '<link rel="canonical" href="' + escapeHtml(canonical) + '">' +
        '<meta name="robots" content="' + robots + '">' +
        '<meta property="og:type" content="' + (options.ogType || "website") + '">' +
        '<meta property="og:site_name" content="مه‌گلد">' +
        '<meta property="og:locale" content="fa_IR">' +
        '<meta property="og:title" content="' + escapeHtml(title) + '">' +
        '<meta property="og:description" content="' + escapeHtml(description) + '">' +
        '<meta property="og:url" content="' + escapeHtml(canonical) + '">' +
        (options.image ? '<meta property="og:image" content="' + escapeHtml(options.image) + '">' : "") +
        '<meta name="twitter:card" content="summary_large_image">' +
        '<meta name="twitter:title" content="' + escapeHtml(title) + '">' +
        '<meta name="twitter:description" content="' + escapeHtml(description) + '">' +
        schema,
        { html: true }
      );
    } })
    .transform(response);
}
function injectNavigation(response) {
  const script = '<script>(() => { const links = [["/products/","همه محصولات"],["/category/jewelry/","طلای زینتی"],["/category/melted-gold/","طلای آب‌شده"],["/category/coins/","سکه"],["/category/bars/","شمش"],["/cart/","سبد خرید"],["/about/","درباره ما"],["/contact/","تماس"]]; const attach = (selector) => { const nav = document.querySelector(selector); if (!nav) return; for (const [href, label] of links) { if (nav.querySelector("[data-mpa-href=\\\\\\\"" + href + "\\\\\\\"]")) continue; const a = document.createElement("a"); a.href = href; a.dataset.mpaHref = href; a.textContent = label; nav.appendChild(a); } }; const update = () => { attach(".ref-primary-nav"); attach(".ref-mobile-links"); }; const observer = new MutationObserver(update); observer.observe(document.documentElement, { childList: true, subtree: true }); update(); })();</script>';
  return new HTMLRewriter().on("body", {
    element(element) { element.append(script + '<script type="module" src="/assets/cart-ui.mjs"></script>', { html: true }); }
  }).transform(response);
}
async function productDocument(request, env, url, productId) {
  const fields = "id,name,description,category,price_toman,image_url,weight_grams,karat,stock,created_at";
  const apiUrl = SUPABASE_URL + "/rest/v1/products?id=eq." + encodeURIComponent(productId) + "&is_active=eq.true&select=" + fields;
  const lookup = await fetch(apiUrl, { headers: { apikey: SUPABASE_PUBLIC_KEY, Accept: "application/json" } });
  if (!lookup.ok) return null;
  const rows = await lookup.json();
  const product = Array.isArray(rows) ? rows[0] : null;
  if (!product) return null;

  const title = String(product.name || "محصول مه‌گلد");
  const description = String(product.description || ("مشاهده مشخصات، وزن، عیار و اطلاعات محصول " + title + " در فروشگاه مه‌گلد.")).replace(/\s+/g, " ").slice(0, 155);
  const canonicalPath = "/product/" + productId + "-" + productSlug(title) + "/";
  const canonical = absolute(canonicalPath);
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: title,
    description,
    category: product.category || undefined,
    image: product.image_url && /^https?:\/\//i.test(product.image_url) ? [product.image_url] : undefined,
    brand: { "@type": "Brand", name: "مه‌گلد" },
    url: canonical,
    additionalProperty: [
      product.weight_grams != null ? { "@type": "PropertyValue", name: "وزن", value: product.weight_grams, unitText: "گرم" } : null,
      product.karat != null ? { "@type": "PropertyValue", name: "عیار", value: product.karat } : null
    ].filter(Boolean)
  };
  if (Number(product.price_toman) > 0) {
    schema.offers = {
      "@type": "Offer",
      url: canonical,
      priceCurrency: "IRR",
      price: String(Math.round(Number(product.price_toman) * 10)),
      seller: { "@type": "Organization", name: "مه‌گلد" },
      ...(product.stock != null ? { availability: Number(product.stock) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" } : {}),
      itemCondition: "https://schema.org/NewCondition"
    };
  }
  const templateUrl = new URL("/product/index.html", url);
  const template = await env.ASSETS.fetch(new Request(templateUrl, { method: "GET", headers: request.headers }));
  const transformed = new HTMLRewriter()
    .on("#product-name", { element(element) { element.setInnerContent(title); } })
    .on("#product-description", { element(element) { element.setInnerContent(description); } })
    .transform(template);
  const seoResponse = seoHead(transformed, url, { title: title + " | خرید و مشخصات محصول | مه‌گلد", description }, {
    canonical, schema, image: product.image_url && /^https?:\/\//i.test(product.image_url) ? product.image_url : undefined, ogType: "product", noindex: url.hostname.endsWith("workers.dev")
  });
  const headers = new Headers(seoResponse.headers);
  headers.set("Cache-Control", "no-store");
  if (url.hostname.endsWith("workers.dev")) headers.set("X-Robots-Tag", "noindex, nofollow");
  return new Response(seoResponse.body, { status: seoResponse.status, headers });
}
async function sitemapResponse() {
  const staticPaths = ["/", "/products/", "/category/jewelry/", "/category/melted-gold/", "/category/coins/", "/category/bars/", "/about/", "/contact/"];
  const urls = staticPaths.map((path) => "<url><loc>" + escapeHtml(absolute(path)) + "</loc></url>");
  const lookup = await fetch(SUPABASE_URL + "/rest/v1/products?is_active=eq.true&select=id,name,created_at&order=created_at.desc&limit=5000", {
    headers: { apikey: SUPABASE_PUBLIC_KEY, Accept: "application/json" }
  });
  if (lookup.ok) {
    const products = await lookup.json();
    for (const product of products || []) {
      const loc = absolute("/product/" + product.id + "-" + productSlug(product.name) + "/");
      const lastmod = product.created_at && !Number.isNaN(Date.parse(product.created_at)) ? "<lastmod>" + new Date(product.created_at).toISOString() + "</lastmod>" : "";
      urls.push("<url><loc>" + escapeHtml(loc) + "</loc>" + lastmod + "</url>");
    }
  }
  return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + urls.join("") + "</urlset>", {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=300" }
  });
}
function robotsResponse(url) {
  const staging = url.hostname.endsWith("workers.dev");
  const body = staging
    ? "User-agent: *\nDisallow: /\n"
    : "User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /cart/\nDisallow: /checkout/\nSitemap: " + absolute("/sitemap.xml") + "\n";
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=300" } });
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (path === "/robots.txt") return robotsResponse(url);
    if (path === "/sitemap.xml") return sitemapResponse();

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
    if (path === "/product" || path === "/product/") return Response.redirect(new URL("/products/", url), 302);

    const response = await env.ASSETS.fetch(request);
    let output = response;
    if (path === "/" || path === "/index.html") output = injectNavigation(response);
    const route = path === "/index.html" ? "/" : path;
    const seo = PAGE_SEO[route];
    if (seo && response.headers.get("content-type")?.includes("text/html")) {
      const schema = route === "/" ? {
        "@context": "https://schema.org",
        "@graph": [
          { "@type": "Organization", name: "مه‌گلد", url: PUBLIC_ORIGIN, description: PAGE_SEO["/"].description },
          { "@type": "WebSite", name: "مه‌گلد", url: PUBLIC_ORIGIN, inLanguage: "fa-IR" }
        ]
      } : (CATEGORY_COPY[route] ? {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: CATEGORY_COPY[route].heading,
        description: PAGE_SEO[route].description,
        url: absolute(route),
        inLanguage: "fa-IR"
      } : undefined);
      output = seoHead(output, url, seo, { schema, noindex: url.hostname.endsWith("workers.dev") });
    }
    const category = CATEGORY_COPY[route];
    if (category && response.headers.get("content-type")?.includes("text/html")) {
      output = new HTMLRewriter()
        .on("#category-title", { element(element) { element.setInnerContent(category.heading); } })
        .on(".hero > p", { element(element) { element.setInnerContent(category.intro); } })
        .transform(output);
    }
    if (["/cart/", "/checkout/"].includes(route) && response.headers.get("content-type")?.includes("text/html")) {
      output = new HTMLRewriter().on("head", {
        element(element) { element.append('<meta name="robots" content="noindex, nofollow">', { html: true }); }
      }).transform(output);
    }
    const headers = new Headers(output.headers);
    if (url.hostname.endsWith("workers.dev") && headers.get("content-type")?.includes("text/html")) {
      headers.set("X-Robots-Tag", "noindex, nofollow");
    }
    return new Response(output.body, { status: output.status, statusText: output.statusText, headers });
  }
};
