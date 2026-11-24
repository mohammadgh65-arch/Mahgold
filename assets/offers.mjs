import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const supabase = createClient(
  "https://nzvvvpbwavaodhxrnkdr.supabase.co",
  "sb_publishable_8UgFkQuDJNNeez2O1CNv3Q_Jf44PrL9"
);

const excluded = value => /شمش|آب\s*شده|آبشده/.test(String(value || ""));
const included = value => /زینتی|سکه|انگشتر|گردنبند|دستبند|النگو|گوشواره|آویز|پلاک|زنجیر|پابند|سرویس طلا|jewelry|coin/i.test(String(value || ""));
const safe = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
})[char]);
const slug = value => encodeURIComponent(String(value || "product").trim()).replace(/%20/g, "-");

function addStyles() {
  if (document.getElementById("mahgold-offers-style")) return;
  const style = document.createElement("style");
  style.id = "mahgold-offers-style";
  style.textContent = `
    .mahgold-offers{width:min(1180px,92%);margin:25px auto 23px;padding:20px 20px 15px;border:1px solid #b88b3c88;border-radius:20px;background:radial-gradient(ellipse at 15% 0%,#1a513e 0,transparent 55%),linear-gradient(145deg,#102f24,#0b211a 72%);box-shadow:0 14px 38px #0004,inset 0 1px #f4d98b30;overflow:hidden}
    .mahgold-offers-head{display:flex;align-items:end;justify-content:space-between;gap:14px;margin-bottom:16px}
    .mahgold-offers-kicker{display:block;color:#d5b76d;font-size:10px;letter-spacing:2px}
    .mahgold-offers-title{margin:5px 0 2px;color:#f4d98b;font-size:clamp(19px,2.5vw,26px);font-weight:800}
    .mahgold-offers-sub{margin:0;color:#d7c9a7;font-size:12px}
    .mahgold-offers-count{white-space:nowrap;color:#f0d58c;border:1px solid #d4ad5c77;border-radius:999px;padding:7px 11px;font-size:10px}
    .mahgold-offers-viewport{overflow:hidden;direction:rtl}
    .mahgold-offers-track{display:flex;flex-direction:row;gap:14px;will-change:transform;transition:transform .72s cubic-bezier(.22,.75,.25,1)}
    .mahgold-offer-card{position:relative;display:block;flex:0 0 auto;width:calc((min(1180px,92vw) - 68px)/3);height:clamp(190px,23vw,265px);min-width:0;padding:0;overflow:hidden;border:1px solid #d4ad5c88;border-radius:15px;background:#17251d;text-align:right;color:#fff;cursor:pointer}
    .mahgold-offer-card img{display:block;width:100%;height:100%;object-fit:cover;transition:transform .65s ease}
    .mahgold-offer-card:hover img{transform:scale(1.055)}
    .mahgold-offer-card:after{content:"";position:absolute;inset:25% 0 0;background:linear-gradient(180deg,transparent,#07150fee)}
    .mahgold-offer-copy{position:absolute;z-index:1;right:15px;left:12px;bottom:14px;display:flex;flex-direction:column;gap:5px}
    .mahgold-offer-copy small{color:#f1d58e;font-size:10px}
    .mahgold-offer-copy strong{color:#fff2d1;font-size:15px;line-height:1.6}
    .mahgold-offer-copy em{display:flex;align-items:center;gap:6px;color:#e5c77f;font-size:10px;font-style:normal}
    .mahgold-offers-foot{display:flex;align-items:center;justify-content:space-between;margin-top:13px;color:#cbbd9e;font-size:10px}
    .mahgold-offers-dots{display:flex;gap:5px}
    .mahgold-offers-dots i{display:block;width:6px;height:6px;border-radius:9px;background:#b99a5a66;transition:all .2s}
    .mahgold-offers-dots i.active{width:19px;background:#e6c77b}
    @media(max-width:700px){.mahgold-offers{width:calc(100% - 28px);margin:18px auto;padding:15px 12px 12px;border-radius:16px}.mahgold-offers-head{margin-bottom:12px}.mahgold-offer-card{width:82vw;height:clamp(220px,66vw,310px)}.mahgold-offers-track{gap:10px}.mahgold-offers-count{font-size:9px;padding:6px 8px}.mahgold-offer-copy{right:12px;bottom:12px}.mahgold-offer-copy strong{font-size:14px}}
    @media(prefers-reduced-motion:reduce){.mahgold-offers-track,.mahgold-offer-card img{transition:none!important}}
  `;
  document.head.append(style);
}

async function initOffers() {
  const main = document.querySelector("#root main#home, #root main");
  const hero = main?.querySelector(".ref-hero");
  if (!main || !hero || main.querySelector(".mahgold-offers")) return false;
  addStyles();

  const section = document.createElement("section");
  section.className = "mahgold-offers";
  section.setAttribute("aria-label", "پیشنهادات مه‌گلد");
  section.innerHTML = `
    <div class="mahgold-offers-head">
      <div><span class="mahgold-offers-kicker">MAHGOLD SELECTION</span>
      <h2 class="mahgold-offers-title">پیشنهادات مه‌گلد</h2>
      <p class="mahgold-offers-sub">انتخاب‌هایی چشم‌نواز از مجموعه مه‌گلد</p></div>
      <span class="mahgold-offers-count">۵ انتخاب منتخب</span>
    </div>
    <div class="mahgold-offers-viewport"><div class="mahgold-offers-track"></div></div>
    <div class="mahgold-offers-foot"><span>حرکت حلقه‌ای به سمت راست · هر ۳ ثانیه</span><span class="mahgold-offers-dots"></span></div>`;
  hero.insertAdjacentElement("afterend", section);

  const subtitle = section.querySelector(".mahgold-offers-sub");
  const track = section.querySelector(".mahgold-offers-track");
  const dots = section.querySelector(".mahgold-offers-dots");
  const { data, error } = await supabase.from("products")
    .select("id,name,category,image_url,is_active,created_at")
    .eq("is_active", true).order("created_at", { ascending: false });
  if (error) {
    subtitle.textContent = "دریافت پیشنهادات در حال حاضر ممکن نیست.";
    return true;
  }

  const products = (data || [])
    .filter(product => !excluded(product.category) && !excluded(product.name))
    .filter(product => included(product.category + " " + product.name))
    .slice(0, 5);

  if (!products.length) {
    subtitle.textContent = "به‌زودی انتخاب‌های ویژه طلای زینتی و سکه در این بخش نمایش داده می‌شوند.";
    section.querySelector(".mahgold-offers-count").textContent = "منتخب مه‌گلد";
    return true;
  }

  const repeated = [...products, ...products.slice(0, Math.min(3, products.length))];
  track.innerHTML = repeated.map((product, index) => `
    <a class="mahgold-offer-card" href="/product/${safe(product.id)}-${slug(product.name)}/" aria-label="مشاهده جزئیات ${safe(product.name)}">
      <img src="${safe(product.image_url || "")}" alt="${safe(product.name)}" loading="${index < 3 ? "eager" : "lazy"}">
      <span class="mahgold-offer-copy"><small>${safe(product.category || "منتخب مه‌گلد")}</small>
      <strong>${safe(product.name || "محصول")}</strong><em>مشاهده جزئیات محصول ←</em></span>
    </a>`).join("");
  dots.innerHTML = products.map((_, index) => `<i class="${index === 0 ? "active" : ""}"></i>`).join("");
  section.querySelector(".mahgold-offers-count").textContent =
    new Intl.NumberFormat("fa-IR").format(products.length) + " انتخاب منتخب";

  let index = 0;
  let timer;
  const step = () => {
    const card = track.querySelector(".mahgold-offer-card");
    return card ? card.getBoundingClientRect().width + parseFloat(getComputedStyle(track).gap || 0) : 0;
  };
  const paint = animate => {
    track.style.transition = animate ? "" : "none";
    track.style.transform = `translate3d(${index * step()}px,0,0)`;
    [...dots.children].forEach((dot, i) => dot.classList.toggle("active", i === index % products.length));
  };
  const next = () => {
    index++;
    paint(true);
    if (index === products.length) setTimeout(() => { index = 0; paint(false); }, 760);
  };
  const start = () => {
    if (products.length > 1 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches && !timer)
      timer = setInterval(next, 3000);
  };
  const stop = () => { clearInterval(timer); timer = null; };
  section.addEventListener("mouseenter", stop);
  section.addEventListener("mouseleave", start);
  section.addEventListener("touchstart", stop, { passive: true });
  section.addEventListener("touchend", start, { passive: true });
  window.addEventListener("resize", () => paint(false));
  paint(false);
  start();
  return true;
}

const observer = new MutationObserver(() => {
  initOffers().then(mounted => { if (mounted) observer.disconnect(); }).catch(error => console.error("Mahgold offers:", error));
});
observer.observe(document.documentElement, { childList: true, subtree: true });
initOffers().then(mounted => { if (mounted) observer.disconnect(); }).catch(error => console.error("Mahgold offers:", error));
