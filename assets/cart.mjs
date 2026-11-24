const root=document.querySelector("#cart-items");
const money=n=>new Intl.NumberFormat("fa-IR").format(Number(n||0))+" تومان";
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let cart=[];
try{cart=JSON.parse(localStorage.getItem("mahgold_cart")||"[]");if(!Array.isArray(cart))cart=[]}catch{}
function draw(){
  const hasUnpriced=cart.some(p=>!(Number(p.price_toman)>0));
  const total=cart.reduce((a,p)=>a+(Number(p.price_toman)>0?Number(p.price_toman)*Number(p.quantity||1):0),0);
  root.innerHTML=cart.length?cart.map((p,i)=>{
    const priced=Number(p.price_toman)>0;
    const qty=Math.max(1,Number(p.quantity)||1);
    return '<article class="product" style="padding:14px;display:flex;gap:12px;align-items:center"><img style="width:82px;height:82px;border-radius:10px;object-fit:cover" src="'+esc(p.image_url||"")+'" alt="'+esc(p.name||"محصول")+'" onerror="this.style.display=\'none\'"><div style="flex:1"><b>'+esc(p.name||"محصول")+'</b><div class="meta">تعداد: <button data-dec="'+i+'">−</button> '+qty+' <button data-inc="'+i+'">+</button></div><div class="price">'+(priced?money(Number(p.price_toman)*qty):"استعلام قیمت")+'</div></div><button class="btn secondary" data-del="'+i+'">حذف</button></article>';
  }).join("")+'<div class="status">'+(hasUnpriced?'<p>یک یا چند کالا قیمت قطعی ندارند. برای جلوگیری از محاسبه اشتباه، ادامه سفارش تا اعلام قیمت این کالاها غیرفعال است.</p>':'')+'جمع کالاهای قیمت‌دار: '+money(total)+'<br>'+(hasUnpriced?'<button class="btn" disabled>ابتدا استعلام قیمت کالاها</button>':'<a class="btn" href="/checkout/">ادامه و ثبت اطلاعات سفارش</a>')+'</div>':'<div class="status">سبد خرید شما خالی است.<br><a class="btn" href="/products/">مشاهده محصولات</a></div>';
  root.querySelectorAll("[data-inc]").forEach(b=>b.onclick=()=>{cart[+b.dataset.inc].quantity=(Number(cart[+b.dataset.inc].quantity)||1)+1;save()});
  root.querySelectorAll("[data-dec]").forEach(b=>b.onclick=()=>{const p=cart[+b.dataset.dec];p.quantity=Math.max(1,(Number(p.quantity)||1)-1);save()});
  root.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>{cart.splice(+b.dataset.del,1);save()});
}
function save(){localStorage.setItem("mahgold_cart",JSON.stringify(cart));draw()}
draw();