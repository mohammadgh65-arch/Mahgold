import{createClient}from"https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
const c=createClient("https://nzvvvpbwavaodhxrnkdr.supabase.co","sb_publishable_8UgFkQuDJNNeez2O1CNv3Q_Jf44PrL9");
const slug=document.querySelector("[data-category]")?.dataset.category;
const map={jewelry:"طلای زینتی","melted-gold":"طلای آب‌شده",coins:"سکه",bars:"شمش"};
const title=map[slug]||"محصولات";
document.querySelector("#category-title").textContent=title;
document.title=title+" | مه‌گلد";
const root=document.querySelector("#products");
const money=n=>new Intl.NumberFormat("fa-IR").format(Number(n||0))+" تومان";
const esc=s=>String(s??"").replace(/[&<>"']/g,x=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[x]));
const detail=p=>"/product/"+encodeURIComponent(p.id)+"-"+encodeURIComponent(p.name).replace(/%20/g,"-")+"/";
const terms={jewelry:["طلای زینتی","انگشتر","گردنبند","دستبند","النگو","گوشواره","آویز و پلاک","زنجیر","پابند","سرویس طلا","نیم ست","سایر زیورآلات"],"melted-gold":["آب‌شده","آبشده"],coins:["سکه"],bars:["شمش"]};
function add(p){if(window.MahgoldCartUI?.add){window.MahgoldCartUI.add(p);return}root.querySelector("#category-message")?.remove();const note=document.createElement("p");note.id="category-message";note.className="status";note.textContent="سبد خرید در حال آماده‌سازی است؛ لطفاً صفحه را دوباره بارگذاری کنید.";root.before(note)}
function render(list){
 root.innerHTML=list.length?list.map(p=>{
  const url=detail(p),priced=Number(p.price_toman)>0,available=Number(p.stock||0)>0;
  return '<article class="product"><a class="product-detail-link" href="'+url+'"><img loading="lazy" src="'+esc(p.image_url||"")+'" alt="'+esc(p.name)+'" onerror="this.style.display=\'none\'"></a><div class="productbody"><h2><a href="'+url+'">'+esc(p.name)+'</a></h2><div class="meta">'+esc(p.category||"")+(p.weight_grams?' · '+new Intl.NumberFormat("fa-IR").format(Number(p.weight_grams))+' گرم':'')+'</div><div class="price">'+(priced?money(p.price_toman):"استعلام قیمت")+'</div><div class="actions"><a class="btn secondary" href="'+url+'">مشاهده جزئیات</a><button class="btn" data-add="'+esc(p.id)+'" '+(priced&&available?'':'disabled')+'>'+(priced?(available?'افزودن به سبد':'ناموجود'):'استعلام قیمت')+'</button></div></div></article>'
 }).join(""):'<div class="status">در این دسته‌بندی هنوز محصول فعالی ثبت نشده است.</div>';
 root.querySelectorAll("[data-add]").forEach(b=>b.addEventListener("click",()=>{const p=list.find(x=>String(x.id)===String(b.dataset.add));if(p)add(p)}));
}
const{data,error}=await c.from("products").select("id,name,category,description,image_url,weight_grams,karat,price_toman,stock,is_active,created_at").eq("is_active",true).order("created_at",{ascending:false});
if(error){root.innerHTML='<div class="status">دریافت اطلاعات با خطا مواجه شد.</div>';console.error(error)}
else{const key=title.toLocaleLowerCase("fa");const list=(data||[]).filter(p=>(p.category||"").toLocaleLowerCase("fa").includes(key)||(terms[slug]||[]).some(k=>(p.category||"").includes(k)));render(list)}
