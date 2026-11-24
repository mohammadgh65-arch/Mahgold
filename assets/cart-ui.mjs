const KEY="mahgold_cart";
const read=()=>{try{const value=JSON.parse(localStorage.getItem(KEY)||"[]");return Array.isArray(value)?value:[]}catch{return[]}};
const count=()=>read().reduce((sum,item)=>sum+Math.max(0,Number(item.quantity)||1),0);
function paint(){const total=count();document.querySelectorAll(".cartlink").forEach(link=>{let badge=link.querySelector(".cart-count");if(!badge){badge=document.createElement("span");badge.className="cart-count";badge.setAttribute("aria-hidden","true");link.appendChild(badge)}badge.textContent=new Intl.NumberFormat("fa-IR").format(total);badge.classList.toggle("is-empty",total===0);link.setAttribute("aria-label",total?("سبد خرید، "+total+" قلم کالا"):"سبد خرید، خالی")})}
function toast(name){let host=document.querySelector("#mahgold-cart-toast");if(!host){host=document.createElement("div");host.id="mahgold-cart-toast";host.className="cart-toast";host.setAttribute("role","status");host.setAttribute("aria-live","polite");document.body.appendChild(host)}host.innerHTML='<span class="cart-toast-icon" aria-hidden="true">✓</span><span class="cart-toast-copy"><strong>با موفقیت به سبد خرید اضافه شد</strong><small>'+escapeText(name)+'</small></span><a href="/cart/">مشاهده سبد</a>';host.classList.add("show");clearTimeout(window.__mahgoldToastTimer);window.__mahgoldToastTimer=setTimeout(()=>host.classList.remove("show"),4200)}
function escapeText(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function add(product){const cart=read(),id=String(product.product_id||product.id),existing=cart.find(item=>String(item.product_id||item.id)===id);if(existing)existing.quantity=(Number(existing.quantity)||1)+1;else cart.push({product_id:product.id||product.product_id,id:product.id||product.product_id,name:product.name,price_toman:product.price_toman,image_url:product.image_url,quantity:1});localStorage.setItem(KEY,JSON.stringify(cart));paint();toast(product.name)}
window.MahgoldCartUI={add,refresh:paint};
window.addEventListener("storage",event=>{if(event.key===KEY)paint()});
window.addEventListener("pageshow",paint);
document.addEventListener("DOMContentLoaded",paint);
paint();
