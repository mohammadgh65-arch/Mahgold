import { useMemo, useState } from 'react';

const defaults = [
 {name:'طلای زینتی',desc:'زیورآلات ظریف و ماندگار',image:'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=700&q=80'},
 {name:'طلای آب‌شده',desc:'انتخابی برای سرمایه‌گذاری',image:'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=700&q=80'},
 {name:'سکه',desc:'ارزش آشنا و ماندگار',image:'https://images.unsplash.com/photo-1610375461369-d613b6f6e2d4?auto=format&fit=crop&w=700&q=80'},
 {name:'شمش',desc:'خلوص در ساده‌ترین شکل',image:'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=700&q=80'}
];
const defaultSlide = {eyebrow:'MAHGOLD · FINE JEWELRY',title:'درخششِ طلا، امضایِ استایلِ شما',description:'زیبایی در سادگی‌ست؛ انتخاب‌هایی ظریف و ماندگار برای لحظه‌هایی که ارزش، معنا پیدا می‌کند.',button:'کشف مجموعه مه‌گلد',image:'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1600&q=85'};
const safeImage = value => typeof value==='string' && (/^https:\/\//i.test(value)||/^\/[^/]/.test(value)) ? value : '';
const money = value => new Intl.NumberFormat('fa-IR').format(Number(value||0));

export default function SiteLivePreview({content={},products=[],quotes=[]}){
 const [device,setDevice]=useState('desktop');
 const slide=useMemo(()=> (Array.isArray(content.slides)?content.slides.filter(x=>x&&x.active!==false&&x.title):[])[0]||defaultSlide,[content.slides]);
 const tiles=useMemo(()=>defaults.map(item=>({...item,...((content.tiles||[]).find(x=>x.name===item.name)||{})})),[content.tiles]);
 const quote=quotes.find(x=>x.symbol==='gold_18k')||quotes[0];
 const logo=safeImage(content.logo_url)||'/mahgold-logo.webp';
 const hero=safeImage(slide.image)||defaultSlide.image;
 const story=safeImage(content.story_image)||'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&q=80';
 const announcement=content.announcement?.active===false?'':(content.announcement?.text||'ارسال امن و بسته‌بندی ویژه ✦ پشتیبانی مه‌گلد ✦ همراه انتخاب شما');
 return <section className="admin-live-preview" aria-label="پیش‌نمایش زنده فروشگاه">
  <div className="admin-live-preview-head">
   <div><h3>پیش‌نمایش زنده فروشگاه</h3><p>تغییرات فرم‌ها را همین‌جا زنده ببینید؛ تا قبل از ذخیره فقط پیش‌نمایش است.</p></div>
   <div className="admin-preview-switch">
    <button type="button" className={device==='desktop'?'active':''} onClick={()=>setDevice('desktop')}>نمای دسکتاپ</button>
    <button type="button" className={device==='mobile'?'active':''} onClick={()=>setDevice('mobile')}>نمای موبایل</button>
   </div>
  </div>
  <div className="admin-preview-stage">
   <div className={'admin-preview-device '+device}>
    {announcement&&<div className="admin-preview-announcement">{announcement}</div>}
    <div className="admin-preview-nav"><div className="admin-preview-brand"><img src={logo} alt="لوگوی مه‌گلد"/><span>مه‌گلد</span></div><div className="admin-preview-links"><span>دسته‌بندی‌ها</span><span>فروشگاه</span><span>درباره مه‌گلد</span></div><span className="admin-preview-cart">سبد خرید</span></div>
    <div className="admin-preview-hero" style={{'--preview-hero-image':"url('"+hero.replace(/['()\\]/g,'')+"')"}}>
     <div className="admin-preview-copy"><small>{slide.eyebrow||defaultSlide.eyebrow}</small><h2>{slide.title||defaultSlide.title}</h2><p>{slide.description||defaultSlide.description}</p><span className="admin-preview-cta">{slide.button||defaultSlide.button}</span></div>
    </div>
    <div className="admin-preview-section"><h4>مجموعه‌های مه‌گلد</h4><div className="admin-preview-categories">{tiles.map(tile=><div className="admin-preview-category" key={tile.name}><img src={safeImage(tile.image)||defaults.find(x=>x.name===tile.name)?.image} alt=""/><b>{tile.name}</b></div>)}</div></div>
    <div className="admin-preview-section"><h4>منتخب‌های مه‌گلد</h4><div className="admin-preview-products">{products.filter(x=>x.is_active!==false).slice(0,3).map(product=><div className="admin-preview-product" key={product.id}><img src={safeImage(product.image_url)||tiles.find(x=>x.name===product.category)?.image||defaults[0].image} alt=""/><b>{product.name}</b><small>{money(product.price_toman)} تومان</small></div>)}{!products.length&&<div className="admin-preview-product"><img src={defaults[0].image} alt=""/><b>محصول نمونه</b><small>قیمت پس از اتصال نمایش داده می‌شود</small></div>}</div></div>
    <div className="admin-preview-story"><img src={story} alt="داستان مه‌گلد"/><div><b>مه‌گلد؛ طلا، با امضای شما</b><p>انتخابی درخشان، با جزئیات دقیق و تجربه‌ای مطمئن</p></div></div>
    <div className="admin-preview-foot">MAHGOLD · فروشگاه تخصصی طلا و زیورآلات</div>
   </div>
  </div>
  <div className="admin-preview-note">{quote?.price_toman?'آخرین نرخ ثبت‌شده: '+money(quote.price_toman)+' تومان':'نرخ طلا در پیش‌نمایش با اتصال نرخ معتبر نمایش داده خواهد شد'} · این قاب فقط پیش‌نمایش طراحی است.</div>
 </section>;
}
