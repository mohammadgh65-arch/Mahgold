import{createClient}from"https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
const c=createClient("https://nzvvvpbwavaodhxrnkdr.supabase.co","sb_publishable_8UgFkQuDJNNeez2O1CNv3Q_Jf44PrL9");
const id=decodeURIComponent(location.pathname.split("/").filter(Boolean).pop()||"").match(/^([0-9a-f-]{36})/i)?.[1]||"";
const root=document.querySelector("#product-detail"),money=n=>new Intl.NumberFormat("fa-IR").format(Number(n||0))+" تومان";
const fmt=n=>new Intl.NumberFormat("fa-IR",{maximumFractionDigits:3}).format(Number(n||0));
const esc=s=>String(s??"").replace(/[&<>"']/g,x=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[x]));
const labels={half_set_type:"نوع نیم‌ست",has_stone:"وضعیت سنگ",stone_labor_percent:"اجرت سنگ",half_set_components:"اجزای نیم‌ست",first_grams:"وزن جزء اول (گرم)",first_sot:"وزن جزء اول (سوت)",second_grams:"وزن جزء دوم (گرم)",second_sot:"وزن جزء دوم (سوت)",color:"رنگ",size:"سایز",model:"مدل",material:"جنس",description:"توضیحات تکمیلی"};
const hidden=new Set(["variant_sku","parent_product_id","variant_model_name","internal_sku","admin_note"]);
const halfTypes={earrings_necklace:"گوشواره و گردنبند",bracelet_necklace:"دستبند و گردنبند"};
function attrRows(attrs){const out=[];for(const [k,v] of Object.entries(attrs||{})){if(hidden.has(k)||v==null||v==="")continue;if(k==="half_set_type"){out.push([labels[k],halfTypes[v]||String(v)]);continue}if(k==="has_stone"){out.push([labels[k],v?"سنگ‌دار":"بدون سنگ"]);continue}if(k==="stone_labor_percent"){out.push([labels[k],fmt(v)+"٪"]);continue}if(k==="half_set_components"&&typeof v==="object"){const a=v;out.push(["وزن جزء اول",fmt(Number(a.first_grams||0)+Number(a.first_sot||0)/1000)+" گرم"]);out.push(["وزن جزء دوم",fmt(Number(a.second_grams||0)+Number(a.second_sot||0)/1000)+" گرم"]);continue}if(typeof v==="object")continue;const label=labels[k]||k.replace(/_/g," ");out.push([label,String(v)])}return out}
function row(label,value){return '<tr><th scope="row">'+esc(label)+'</th><td>'+esc(value)+'</td></tr>'}
function setupZoom(src,alt){const viewer=document.querySelector("#zoom-viewer"),img=document.querySelector("#zoom-image"),level=document.querySelector("#zoom-level"),stage=document.querySelector("#zoom-stage");let scale=1,x=0,y=0,drag=false,startX=0,startY=0,baseX=0,baseY=0;
function paint(){img.style.transform='translate('+x+'px,'+y+'px) scale('+scale+')';level.textContent=fmt(scale*100)+'٪';img.classList.toggle("dragging",drag)}
function reset(){scale=1;x=0;y=0;paint()}
function open(){img.src=src;img.alt=alt;reset();viewer.classList.add("open");document.body.style.overflow="hidden";document.querySelector("#zoom-close").focus()}
function close(){viewer.classList.remove("open");document.body.style.overflow=""}
function change(d){scale=Math.max(1,Math.min(4,scale+d));if(scale===1){x=0;y=0}paint()}
document.querySelector("#zoom-close").onclick=close;document.querySelector("#zoom-in").onclick=()=>change(.25);document.querySelector("#zoom-out").onclick=()=>change(-.25);document.querySelector("#zoom-reset").onclick=reset;
viewer.addEventListener("click",e=>{if(e.target===viewer)close()});
stage.addEventListener("wheel",e=>{e.preventDefault();change(e.deltaY<0?.2:-.2)},{passive:false});
img.addEventListener("pointerdown",e=>{if(scale<=1)return;drag=true;startX=e.clientX;startY=e.clientY;baseX=x;baseY=y;img.setPointerCapture(e.pointerId);paint()});
img.addEventListener("pointermove",e=>{if(!drag)return;x=baseX+e.clientX-startX;y=baseY+e.clientY-startY;paint()});
img.addEventListener("pointerup",()=>{drag=false;paint()});img.addEventListener("pointercancel",()=>{drag=false;paint()});
document.addEventListener("keydown",e=>{if(!viewer.classList.contains("open"))return;if(e.key==="Escape")close();if(e.key==="+"||e.key==="=")change(.25);if(e.key==="-")change(-.25)});
return open}
if(!id||id==="index.html"){root.innerHTML='<div class="status">شناسه محصول معتبر نیست.</div>'}
else{
 const{data:p,error}=await c.from("products").select("id,name,category,description,image_url,weight_grams,karat,price_toman,stock,is_active,tag,attributes,created_at").eq("id",id).eq("is_active",true).maybeSingle();
 if(error||!p){root.innerHTML='<div class="status">محصول پیدا نشد یا در حال حاضر فعال نیست.</div>'}
 else{
  try{
  document.querySelector("#product-name").textContent=p.name;document.querySelector("#product-description").textContent=p.description||"مشخصات کامل محصول مه‌گلد";document.title=p.name+" | مه‌گلد";
  const meta=document.querySelector('meta[name="description"]');if(meta)meta.content=(p.description||p.name).slice(0,155);
  const stock=Number(p.stock||0)>0?"موجود":"برای اطلاع از موجودی تماس بگیرید";
  const specs=[["دسته‌بندی",p.category||"—"],["وزن",p.weight_grams!=null?fmt(p.weight_grams)+" گرم":"—"],["عیار",p.karat?fmt(p.karat):"—"],["وضعیت موجودی",stock]];
  if(p.tag)specs.push(["برچسب محصول",p.tag]);
  let extraSpecs=[];try{extraSpecs=attrRows(p.attributes&&typeof p.attributes==="object"?p.attributes:{})}catch(e){console.warn("Product attributes could not be rendered",e)}
  for(const [k,v] of extraSpecs)specs.push([k,v]);
  const image=p.image_url||"",price=Number(p.price_toman)>0?money(p.price_toman):"استعلام قیمت";
  root.innerHTML='<div class="detail-layout"><div class="detail-visual"><div class="detail-photo-frame">'+(image?'<img class="detail-photo" id="detail-photo" src="'+esc(image)+'" alt="'+esc(p.name)+'" loading="eager"><span class="zoom-hint">⌕ انگشت را روی تصویر بکشید تا همان قسمت بزرگ‌نمایی شود</span>':'<div class="status">تصویری برای این محصول ثبت نشده است.</div>')+'</div></div><div class="detail-copy"><h2>'+esc(p.name)+'</h2><p class="detail-description">'+esc(p.description||"برای دریافت اطلاعات بیشتر درباره این محصول با مه‌گلد در ارتباط باشید.")+'</p><div class="detail-price">'+price+'</div><div class="spec-title">مشخصات محصول</div><table class="spec-table"><tbody>'+specs.map(x=>row(x[0],x[1])).join("")+'</tbody></table><div class="detail-actions"><button class="btn" id="add" '+(Number(p.price_toman)>0?'':'disabled')+'>'+(Number(p.price_toman)>0?'افزودن به سبد خرید':'قیمت: استعلام تلفنی')+'</button><a class="btn secondary" href="/products/">بازگشت به محصولات</a></div></div></div>';
  if(image){const photo=document.querySelector("#detail-photo");photo.addEventListener("error",()=>{photo.parentElement.innerHTML='<div class="status">تصویر محصول در دسترس نیست.</div>'});const frame=photo.closest(".detail-photo-frame"),loupe=document.createElement("div");loupe.className="touch-loupe";frame.appendChild(loupe);
  const magnify=e=>{const r=photo.getBoundingClientRect(),W=r.width,H=r.height,nw=photo.naturalWidth||W,nh=photo.naturalHeight||H,ratio=Math.min(W/nw,H/nh),cw=nw*ratio,ch=nh*ratio,ox=(W-cw)/2,oy=(H-ch)/2;let px=e.clientX-r.left-ox,py=e.clientY-r.top-oy;px=Math.max(0,Math.min(cw,px));py=Math.max(0,Math.min(ch,py));const z=2.8;loupe.classList.add("active");const L=loupe.getBoundingClientRect().width,cx=photo.offsetLeft+ox+px,cy=photo.offsetTop+oy+py;const left=Math.max(0,Math.min(frame.clientWidth-L,cx-L/2)),top=Math.max(0,Math.min(frame.clientHeight-L,cy-L*1.18));loupe.style.left=left+"px";loupe.style.top=top+"px";loupe.style.backgroundImage="url("+JSON.stringify(image)+")";loupe.style.backgroundSize=(cw*z)+"px "+(ch*z)+"px";loupe.style.backgroundPosition=(-(px*z-L/2))+"px "+(-(py*z-L/2))+"px"};
  let touching=false,suppressClick=false;photo.addEventListener("pointerdown",e=>{if(e.pointerType!=="touch")return;touching=true;suppressClick=true;photo.setPointerCapture(e.pointerId);magnify(e);e.preventDefault()});photo.addEventListener("pointermove",e=>{if(touching&&e.pointerType==="touch"){magnify(e);e.preventDefault()}});const endTouch=()=>{if(!touching)return;touching=false;loupe.classList.remove("active");setTimeout(()=>{suppressClick=false},350)};photo.addEventListener("pointerup",endTouch);photo.addEventListener("pointercancel",endTouch);const openZoom=setupZoom(image,p.name);photo.addEventListener("click",e=>{if(suppressClick||e.detail===0)return;openZoom()})}
  if(Number(p.price_toman)>0){document.querySelector("#add").onclick=()=>{let a=[];try{a=JSON.parse(localStorage.getItem("mahgold_cart")||"[]")}catch{}const old=a.find(x=>String(x.product_id||x.id)===String(p.id));if(old)old.quantity=(old.quantity||1)+1;else a.push({product_id:p.id,id:p.id,name:p.name,price_toman:p.price_toman,image_url:p.image_url,quantity:1});localStorage.setItem("mahgold_cart",JSON.stringify(a));alert("به سبد خرید اضافه شد.")}}
  }catch(e){console.error("Product detail render failed",e);root.innerHTML='<div class="status">نمایش مشخصات محصول با خطا مواجه شد. لطفاً صفحه را دوباره بارگذاری کنید.</div>'}
 }
}