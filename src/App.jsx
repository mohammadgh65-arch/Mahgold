import { MAHGOLD_LOGO } from './mahgold-brand';
import './mahgold-social-contact.css';
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import {
  Search, ShoppingBag, Menu, X, Gem, ArrowLeft, ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
  ShieldCheck, Gift, Headphones, Plus, Minus, UserRound, LogOut,
  House, LayoutGrid, Phone, MapPin, PackageCheck, MessageCircle, Send
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
const AdminPanel = lazy(() => import('./Admin.jsx'));

const forceAdminPreview = import.meta.env.VITE_ADMIN_PREVIEW === 'true';
const slides = [
  {
    eyebrow: 'MAHGOLD · FINE JEWELRY',
    title: 'درخششِ طلا، امضایِ استایلِ شما',
    description: 'زیبایی در سادگی‌ست؛ انتخاب‌هایی ظریف و ماندگار برای لحظه‌هایی که ارزش، معنا پیدا می‌کند.',
    button: 'کشف مجموعه مه‌گلد',
    image: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&q=72',
    category: 'طلای زینتی'
  },
  {
    eyebrow: 'A GIFT TO REMEMBER',
    title: 'هدیه‌ای که همیشه می‌ماند',
    description: 'انگشترها و زیورآلات منتخب، با بسته‌بندی ویژه مه‌گلد.',
    button: 'مشاهده طلای زینتی',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=760&q=72',
    category: 'طلای زینتی'
  },
  {
    eyebrow: 'INVEST IN GOLD',
    title: 'سکه، انتخابی ماندگار',
    description: 'سرمایه‌ای آشنا با خلوص و ارزش ماندگار.',
    button: 'مشاهده سکه',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=760&q=72',
    category: 'سکه'
  }
];
const tiles = [
  {name:'طلای زینتی',desc:'زیورآلات برای هر روز و هر occasion',image:'https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=640&q=70'},
  {name:'سکه',desc:'ارزش آشنا، انتخاب مطمئن',image:'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=640&q=70'}
];
const editorialCategoryImages = {
  'طلای زینتی':'https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=900&q=82',
  'سکه':'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=82',
  'انگشتر':'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=900&q=82',
  'گردنبند':'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&q=82',
  'دستبند':'https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=900&q=82',
  'النگو':'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=900&q=82',
  'گوشواره':'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=82',
  'آویز و پلاک':'https://images.unsplash.com/photo-1602170427-0c1a6f2c0f1b?auto=format&fit=crop&w=900&q=82',
  'زنجیر':'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=82',
  'پابند':'https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=900&q=82',
  'سرویس طلا':'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&q=82',
  'سایر زیورآلات':'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=900&q=82'
};
const editorialImageFor = name => editorialCategoryImages[name] || editorialCategoryImages['طلای زینتی'];

// Serve appropriately sized, modern-format images from Unsplash without changing
// customer-uploaded product image URLs or their original quality.
function optimizeUnsplashImage(source, width = 640, quality = 70) {
  try {
    const url = new URL(source);
    if (url.hostname !== 'images.unsplash.com') return source;
    url.searchParams.set('auto', 'format'); url.searchParams.set('fit', 'crop');
    url.searchParams.set('w', String(width)); url.searchParams.set('q', String(quality));
    return url.toString();
  } catch { return source; }
}
function unsplashResponsiveSrcSet(source) {
  try {
    if (new URL(source).hostname !== 'images.unsplash.com') return undefined;
    return `${optimizeUnsplashImage(source,360)} 360w, ${optimizeUnsplashImage(source,640)} 640w, ${optimizeUnsplashImage(source,900)} 900w`;
  } catch { return undefined; }
}

const displayTileDefaults = tiles.map(tile=>({...tile,image:editorialImageFor(tile.name)}));
const presetCategories = [
  'همه محصولات','طلای زینتی','سکه','انگشتر','گردنبند',
  'دستبند','النگو','گوشواره','آویز و پلاک','زنجیر','پابند','سرویس طلا','سایر زیورآلات'
];
const jewelryProductCategories = new Set(['طلای زینتی','انگشتر','گردنبند','دستبند','النگو','گوشواره','آویز و پلاک','زنجیر','پابند','سرویس طلا','سایر زیورآلات']);
const investmentCategories = new Set(['سکه']);
const catalogCategoryGroups = [
  {name:'همه محصولات',value:'همه محصولات',items:[]},
  {name:'طلای زینتی',value:'طلای زینتی',items:['انگشتر','گردنبند','دستبند','النگو','گوشواره','آویز و پلاک','زنجیر','پابند','سرویس طلا','سایر زیورآلات']},
  {name:'سرمایه‌گذاری',value:'سرمایه‌گذاری',items:['سکه']}
];
const hiddenProductAttributeKeys = new Set(['has_stone','stone_labor_percent','market_quote_symbol','parent_product_id','variant_model_name','variant_size','variant_sku']);
const storyImage = 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&q=72';
const money = value => new Intl.NumberFormat('fa-IR').format(Math.round(Number(value || 0)));
const priceBreakdown = (p,q) => {const base=Number(p.weight_grams||0)*Number(q?.price_toman||0)*(Number(p.karat||18)/18);const mode=p.labor_mode||'percent',v=Number(p.labor_value||0);const labor=mode==='per_gram'?Number(p.weight_grams||0)*v:mode==='fixed'?v:base*v/100;const profit=(base+labor)*Number(p.seller_profit_percent??7)/100;const commission=(base+labor+profit)*Number(p.commission_percent||0)/100;const tax=(labor+profit+commission)*0.10;return {base,labor,profit,commission,tax,total:Math.round(base+labor+profit+commission+tax)};};
const isQuoteFresh = (q,now=Date.now()) => {const observed=q?.observed_at?Date.parse(q.observed_at):NaN;const observedFresh=Number.isFinite(observed)&&now-observed<=300000&&observed<=now+60000;const manual=q?.source==='manual'&&q?.is_live===false;const provider=q?.provider_updated_at?Date.parse(q.provider_updated_at):NaN;const providerFresh=Number.isFinite(provider)&&now-provider<=300000&&provider<=now+60000;return Number(q?.price_toman)>0&&observedFresh&&(manual||(q?.is_live===true&&q?.source!=='manual'&&providerFresh));};
const gram = value => new Intl.NumberFormat('fa-IR',{maximumFractionDigits:3}).format(Number(value || 0)) + ' گرم';
const toLatinDigits = value => value.replace(/[۰-۹٠-٩]/g, d => {
  const fa='۰۱۲۳۴۵۶۷۸۹', ar='٠١٢٣٤٥٦٧٨٩';
  return String(fa.indexOf(d)>=0 ? fa.indexOf(d) : ar.indexOf(d));
});

function ProductImage({product, className='', onClick}) {
  const [failed,setFailed] = useState(false);
  const src = !failed && product.image_url ? product.image_url : tiles.find(t=>t.name===product.category)?.image || tiles[0].image;
  return <div className={'ref-product-image ' + className} onClick={onClick} role={onClick?'button':undefined} tabIndex={onClick?0:undefined} onKeyDown={onClick?(e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onClick();}}):undefined}>
    <img src={optimizeUnsplashImage(src,640)} srcSet={unsplashResponsiveSrcSet(src)} sizes="(max-width: 767px) 46vw, (max-width: 1200px) 24vw, 280px" alt={product.name || 'محصول مه‌گلد'} loading="lazy" decoding="async" fetchPriority="low" onError={()=>setFailed(true)}/>
  </div>;
}

function orderStatusLabel(status) {
  return ({pending:'در انتظار بررسی',awaiting_payment:'در انتظار پرداخت',paid:'پرداخت‌شده',processing:'در حال آماده‌سازی',shipped:'ارسال‌شده',completed:'تحویل‌شده',cancelled:'لغوشده',payment_failed:'خطای پرداخت'})[status]||'در حال بررسی';
}

function AccountContent({onClose,onAuthenticated,notice=''}) {
  const [session,setSession]=useState(null);
  const [authMode,setAuthMode]=useState('email');
  const [name,setName]=useState('');
  const [phone,setPhone]=useState('');
  const [email,setEmail]=useState('');
  const [code,setCode]=useState('');
  const [sent,setSent]=useState(false);
  const [message,setMessage]=useState(notice);
  const [busy,setBusy]=useState(false);
  const [orders,setOrders]=useState([]);
  const [events,setEvents]=useState([]);

  useEffect(()=>{
    if(!supabase)return;
    supabase.auth.getSession().then(({data})=>setSession(data.session));
    const {data:listener}=supabase.auth.onAuthStateChange((_event,next)=>setSession(next));
    return ()=>listener.subscription.unsubscribe();
  },[]);

  useEffect(()=>{
    if(!supabase || !session?.user?.id){setOrders([]);setEvents([]);return;}
    let active=true;
    (async()=>{
      const {data,error}=await supabase.from('orders')
        .select('id,order_number,status,total_toman,created_at,updated_at')
        .eq('customer_id',session.user.id).order('created_at',{ascending:false}).limit(50);
      if(!active)return;
      if(error){setMessage('دریافت سفارش‌ها با خطا مواجه شد.');return;}
      setOrders(data||[]);
      const ids=(data||[]).map(o=>o.id);
      if(ids.length){
        const history=await supabase.from('order_status_events')
          .select('id,order_id,status,note,created_at').in('order_id',ids)
          .order('created_at',{ascending:false});
        if(active&&!history.error)setEvents(history.data||[]);
      }
    })();
    return ()=>{active=false;};
  },[session?.user?.id]);

  const sendCode=async event=>{
    event.preventDefault();
    if(!supabase)return setMessage('اتصال حساب کاربری در دسترس نیست.');
    if(authMode==='phone')return setMessage('ورود پیامکی آماده اتصال است؛ پس از انتخاب و تنظیم سرویس پیامکی فعال می‌شود.');
    if(!email.trim())return setMessage('ایمیل را وارد کنید.');
    setBusy(true);setMessage('');
    const result=await supabase.auth.signInWithOtp({
      email:email.trim().toLowerCase(),
      options:{shouldCreateUser:true,data:{full_name:name.trim(),phone:phone.trim(),preferred_auth_method:'email'}}
    });
    setBusy(false);
    if(result.error)setMessage('ارسال کد انجام نشد: '+result.error.message);
    else {setSent(true);setMessage('کد تأیید به ایمیل شما ارسال شد. کد را در همین بخش وارد کنید.');}
  };
  const verifyCode=async event=>{
    event.preventDefault();
    if(!supabase||!email.trim()||!code.trim())return;
    setBusy(true);setMessage('');
    const result=await supabase.auth.verifyOtp({email:email.trim().toLowerCase(),token:code.trim(),type:'email'});
    setBusy(false);
    if(result.error)setMessage('کد معتبر نیست یا منقضی شده است. دوباره درخواست کد بدهید.');
    else {setMessage('حساب شما با موفقیت تأیید شد.');onAuthenticated?.();}
  };

  if(session)return <div className="ref-account-panel">
    <span className="eyebrow text-gold-deep">MAHGOLD ACCOUNT</span>
    <h3>حساب کاربری شما</h3>
    <p className="text-sm text-muted-foreground">{session.user.email||session.user.phone||'حساب تأییدشده مه‌گلد'}</p>
    <div className="mt-3 border-t border-border pt-4">
      <div className="mb-3 flex items-center justify-between text-sm"><b>پیگیری سفارش‌ها</b><span className="text-muted-foreground">{money(orders.length)} مورد</span></div>
      {orders.length ? <div className="ref-order-list">{orders.map(order=><div className="ref-order-item" key={order.id}>
        <div><b>سفارش {order.order_number||'—'}</b><small>{new Date(order.created_at).toLocaleDateString('fa-IR')}</small><small className="text-gold-deep">{orderStatusLabel(order.status)}</small>
          <details className="mt-2 text-xs"><summary className="cursor-pointer text-gold-deep">تاریخچه وضعیت سفارش</summary><div className="mt-2 space-y-2 border-r border-gold/40 pr-3">{events.filter(e=>e.order_id===order.id).map(e=><div key={e.id}><b>{orderStatusLabel(e.status)}</b><small className="block">{new Date(e.created_at).toLocaleString('fa-IR')}</small>{e.note&&<small>{e.note}</small>}</div>)}</div></details>
        </div>
        <div className="text-left"><b>{money(order.total_toman)} تومان</b></div>
      </div>)}</div> : <p className="text-xs text-muted-foreground">هنوز سفارشی برای این حساب ثبت نشده است.</p>}
    </div>
    <button className="h-11 rounded-lg bg-gold-gradient text-sm font-bold text-ink ref-full" onClick={onClose}>ادامه خرید</button>
    <button className="flex h-10 items-center justify-center gap-2 rounded-lg border border-border text-xs" onClick={async()=>{await supabase.auth.signOut();setMessage('از حساب خارج شدید.')}}><LogOut size={15}/> خروج از حساب</button>
    {message&&<p className="ref-message">{message}</p>}
  </div>;

  return <form className="ref-auth-form" onSubmit={sent?verifyCode:sendCode}>
    <span className="eyebrow text-gold-deep">WELCOME TO MAHGOLD</span>
    <h3>ورود یا ایجاد حساب مشتری</h3>
    <p className="ref-auth-intro">برای ثبت سفارش و مشاهده امن وضعیت خرید، ابتدا حساب خود را با کد یک‌بارمصرف تأیید کنید.</p>
    <div className="ref-auth-tabs">
      <button type="button" className={authMode==='email'?'active':''} onClick={()=>{setAuthMode('email');setSent(false);setCode('');setMessage('');}}>ایمیل</button>
      <button type="button" className={authMode==='phone'?'active':''} onClick={()=>{setAuthMode('phone');setSent(false);setCode('');setMessage('');}}>شماره موبایل</button>
    </div>
    {authMode==='email'?<>
      {!sent&&<><label>نام و نام خانوادگی (برای حساب جدید)<input autoComplete="name" value={name} onChange={e=>setName(e.target.value)}/></label>
      <label>شماره موبایل تماس<input type="tel" autoComplete="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="09…"/></label>
      <label>ایمیل<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label></>}
      {sent&&<><label>کد تأیید ایمیل<input required inputMode="numeric" autoComplete="one-time-code" value={code} onChange={e=>setCode(e.target.value)} placeholder="کد ارسال‌شده"/></label>
      <button type="button" className="text-xs text-gold-deep underline" onClick={()=>{setSent(false);setCode('');setMessage('');}}>تغییر ایمیل یا ارسال دوباره کد</button></>}
      {message&&<p className="ref-message">{message}</p>}
      <button className="h-12 rounded-lg bg-gold-gradient text-sm font-bold text-ink ref-full" disabled={busy}>{busy?'در حال بررسی…':sent?'تأیید کد و ورود':'ارسال کد یک‌بارمصرف'}</button>
    </>:<>
      <label>شماره موبایل<input type="tel" autoComplete="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="09…"/></label>
      <p className="ref-message">ورود پیامکی در معماری آماده شده است، اما تا انتخاب و تنظیم سرویس پیامک فعال نمی‌شود.</p>
      <button type="button" disabled className="h-12 rounded-lg border border-border text-sm ref-full opacity-60">ارسال کد پیامکی — پس از اتصال سرویس</button>
    </>}
    <small className="ref-note">کد تأیید از سرویس احراز هویت Supabase ارسال می‌شود؛ گذرواژه‌ای در سایت ذخیره نمی‌شود.</small>
  </form>;
}
export default function App() {
  const [category,setCategory]=useState(()=>{const m=window.location.pathname.match(/^\/category\/([^/]+)\/?$/);return m?decodeURIComponent(m[1]):'همه محصولات';});
  const [categoryGroup,setCategoryGroup]=useState('طلای زینتی');
  const [catalogPage,setCatalogPage]=useState(()=>window.location.pathname==='/products'||/^\/category\//.test(window.location.pathname));
  const [query,setQuery]=useState('');
  const [sortMode,setSortMode]=useState('newest');
  const [cart,setCart]=useState(()=>{try{return JSON.parse(localStorage.getItem('mahgold_cart')||'[]');}catch{return [];}});
  const [cartOpen,setCartOpen]=useState(false);
  const [cartRefreshing,setCartRefreshing]=useState(false);
  const [accountOpen,setAccountOpen]=useState(false);
   const [accountNotice,setAccountNotice]=useState('');
  const [checkoutOpen,setCheckoutOpen]=useState(false);
  const [checkoutBusy,setCheckoutBusy]=useState(false);
  const [checkoutRequestKey,setCheckoutRequestKey]=useState(null);
  const [checkoutError,setCheckoutError]=useState('');
  const [orderResult,setOrderResult]=useState(null);
  const [selectedProduct,setSelectedProduct]=useState(null);
  const [zoomOpen,setZoomOpen]=useState(false);
  const [zoomScale,setZoomScale]=useState(1);
  const [zoomOffset,setZoomOffset]=useState({x:0,y:0});
  const zoomStageRef=useRef(null);
  const zoomPointersRef=useRef(new Map());
  const zoomGestureRef=useRef({distance:0,scale:1,x:0,y:0,midX:0,midY:0,startX:0,startY:0});
  const [cartToast,setCartToast]=useState('');
  const [customer,setCustomer]=useState({name:'',phone:'',email:'',address:'',city:'',postalCode:'',note:''});
  const [menuOpen,setMenuOpen]=useState(false);
  const [activeOffer,setActiveOffer]=useState(0);
  const [offerTransition,setOfferTransition]=useState(true);
  const [products,setProducts]=useState([]);
  const [dbCategories,setDbCategories]=useState([]);
  const [quote,setQuote]=useState(null);
  const [clockNow,setClockNow]=useState(()=>Date.now());
  const [siteContent,setSiteContent]=useState(null);
  const [dataStatus,setDataStatus]=useState(isSupabaseConfigured?'loading':'error');
  const [dataMessage,setDataMessage]=useState('در حال دریافت اطلاعات فروشگاه…');
  const [isAdminPage,setIsAdminPage]=useState(()=>forceAdminPreview||window.location.pathname==='/admin'||window.location.pathname==='/admin/'||window.location.hash==='#mahgold-control');

  const displayTiles=useMemo(()=>displayTileDefaults.map(tile=>({...tile,...((siteContent?.tiles||[]).find(item=>item.name===tile.name)||{})})).filter(Boolean),[siteContent]);
  const offerItems=useMemo(()=>{
    const excludedOfferItem=(category,title='')=>/شمش|آب\\s*شده|آبشده/.test(`${category||''} ${title||''}`.replace(/ي/g,'ی'));
    const current=products.filter(product=>Number(product.price_toman)>0&&!excludedOfferItem(product.category,product.name)).slice(0,5).map(product=>({
      id:product.id,title:product.name,category:product.category,
      image:product.image_url||tiles.find(tile=>tile.name===product.category)?.image||tiles[0].image,
      product
    }));
    const fallback=[
      ...slides.filter(slide=>!excludedOfferItem(slide.category,slide.title)).map(slide=>({title:slide.title,category:slide.category,image:slide.image,product:null})),
      ...tiles.filter(tile=>!excludedOfferItem(tile.name,tile.desc)).map(tile=>({title:tile.name,category:tile.name,image:tile.image,product:null}))
    ];
    return [...current,...fallback.slice(0,Math.max(0,5-current.length))].slice(0,5);
  },[products]);
  const offerTrackItems=useMemo(()=>[...offerItems,...offerItems.slice(0,3)],[offerItems]);
  useEffect(()=>{const timer=setInterval(()=>setClockNow(Date.now()),15000);return()=>clearInterval(timer);},[]);
  useEffect(()=>{
    if(!supabase)return;
    let active=true;
    const refreshGoldQuote=async()=>{
      const {data,error}=await supabase.from('market_quotes').select('symbol,title,price_toman,source,observed_at,provider_updated_at,is_live')
        .eq('symbol','gold_18k').order('observed_at',{ascending:false}).limit(1).maybeSingle();
      if(active&&!error)setQuote(data||null);
    };
    const timer=setInterval(refreshGoldQuote,60000);
    return()=>{active=false;clearInterval(timer);};
  },[]);
  useEffect(()=>{setActiveOffer(0);setOfferTransition(true);},[offerItems.length]);
  useEffect(()=>{
    if(offerItems.length<2)return;
    const timer=setInterval(()=>setActiveOffer(index=>index+1),3000);
    return()=>clearInterval(timer);
  },[offerItems.length]);
  useEffect(()=>{
    if(activeOffer<offerItems.length)return;
    const timer=setTimeout(()=>{
      setOfferTransition(false);setActiveOffer(0);
      requestAnimationFrame(()=>requestAnimationFrame(()=>setOfferTransition(true)));
    },750);
    return()=>clearTimeout(timer);
  },[activeOffer,offerItems.length]);
  useEffect(()=>{if(!supabase)return;let active=true;supabase.from('site_content').select('content').eq('id',1).maybeSingle().then(({data})=>{if(active&&data?.content)setSiteContent(data.content);});return()=>{active=false;};},[]);
  useEffect(()=>{
    const syncAdminRoute=()=>{
      if(forceAdminPreview){setIsAdminPage(true);return;}
      const path=window.location.pathname;
      setIsAdminPage(path==='/admin'||path==='/admin/'||window.location.hash==='#mahgold-control');
      const categoryMatch=path.match(/^\/category\/([^/]+)\/?$/);
      const productMatch=path.match(/^\/product\/([^/]+)\/?$/);
      if(categoryMatch){
        const next=decodeURIComponent(categoryMatch[1]);
        setCategory(next);setCategoryGroup(investmentCategories.has(next)?'سرمایه‌گذاری':jewelryProductCategories.has(next)?'طلای زینتی':'همه محصولات');
        setCatalogPage(true);setSelectedProduct(null);
      }else if(path==='/products'){
        setCategory('همه محصولات');setCategoryGroup('همه محصولات');setCatalogPage(true);setSelectedProduct(null);
      }else if(productMatch){
        const found=products.find(item=>String(item.id)===decodeURIComponent(productMatch[1]));
        if(found){setSelectedProduct(found);setCatalogPage(false);}
      }else if(path==='/'){
        setSelectedProduct(null);setCatalogPage(false);setCategory('همه محصولات');
      }
    };
    window.addEventListener('hashchange',syncAdminRoute);
    window.addEventListener('popstate',syncAdminRoute);
    syncAdminRoute();
    return()=>{
      window.removeEventListener('hashchange',syncAdminRoute);
      window.removeEventListener('popstate',syncAdminRoute);
    };
  },[products]);
  useEffect(()=>{
    const path=window.location.pathname;
    const canonicalUrl='https://mah-gold.ir'+(path==='/'?'/':path);
    const categoryMatch=path.match(/^\/category\/([^/]+)\/?$/);
    const productMatch=path.match(/^\/product\/([^/]+)\/?$/);
    let title='مه‌گلد | خرید آنلاین طلا، زیورآلات و سکه';
    let description='خرید آنلاین طلای زینتی و سکه از مه‌گلد؛ مجموعه‌ای از زیورآلات منتخب با طراحی ماندگار، اطلاعات شفاف و تجربه خرید آسان.';
    let robots='index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1';
    let structuredData={ '@context':'https://schema.org','@type':'OnlineStore',name:'مه‌گلد',url:'https://mah-gold.ir/' };
    if(isAdminPage){title='مدیریت فروشگاه | مه‌گلد';robots='noindex,nofollow';}
    else if(productMatch){
      const product=selectedProduct||products.find(item=>String(item.id)===decodeURIComponent(productMatch[1]));
      if(product){
        title=String(product.name||'محصول').trim()+' | خرید از مه‌گلد';
        description=String(product.description||('مشخصات، وزن و عیار '+(product.name||'محصول')+' در فروشگاه مه‌گلد.')).trim().slice(0,300);
        structuredData={ '@context':'https://schema.org','@type':'Product',name:product.name,description,image:product.image_url||undefined,sku:String(product.id),category:product.category,brand:{'@type':'Brand',name:'مه‌گلد'} };
      }
    }else if(categoryMatch){
      const name=decodeURIComponent(categoryMatch[1]);
      title='خرید '+name+' | مجموعه مه‌گلد';
      description='مشاهده و انتخاب محصولات '+name+' در فروشگاه مه‌گلد؛ بررسی مشخصات، وزن، عیار و قیمت ثبت‌شده محصولات.';
      structuredData={ '@context':'https://schema.org','@type':'CollectionPage',name:title,description,url:canonicalUrl };
    }else if(path==='/products'){
      title='تمام محصولات طلا و زیورآلات | مه‌گلد';
      description='جست‌وجو و مقایسه مجموعه محصولات مه‌گلد؛ طلای زینتی، سکه و انتخاب‌های ویژه.';
      structuredData={ '@context':'https://schema.org','@type':'CollectionPage',name:title,description,url:canonicalUrl };
    }
    document.title=title;
    const setMeta=(selector,attribute,value)=>{
      let node=document.head.querySelector(selector);
      if(!node){node=document.createElement('meta');if(selector.startsWith('meta[property='))node.setAttribute('property',attribute);else node.setAttribute('name',attribute);document.head.appendChild(node);}
      node.setAttribute('content',value);
    };
    setMeta('meta[name="description"]','description',description);
    setMeta('meta[name="robots"]','robots',robots);
    setMeta('meta[property="og:title"]','og:title',title);
    setMeta('meta[property="og:description"]','og:description',description);
    setMeta('meta[property="og:url"]','og:url',canonicalUrl);
    setMeta('meta[name="twitter:title"]','twitter:title',title);
    setMeta('meta[name="twitter:description"]','twitter:description',description);
    let canonical=document.head.querySelector('link[rel="canonical"]');
    if(!canonical){canonical=document.createElement('link');canonical.rel='canonical';document.head.appendChild(canonical);}
    canonical.href=canonicalUrl;
    let schema=document.getElementById('mahgold-route-schema');
    if(!schema){schema=document.createElement('script');schema.type='application/ld+json';schema.id='mahgold-route-schema';document.head.appendChild(schema);}
    schema.textContent=JSON.stringify(structuredData);
  },[category,catalogPage,selectedProduct,products,isAdminPage]);
  useEffect(()=>{
    if(!supabase){setDataStatus('error');setDataMessage('اتصال فروشگاه پیکربندی نشده است.');return;}
    let active=true;
    (async()=>{
      try{
        const [productResult,categoryResult,quoteResult]=await Promise.all([
          supabase.from('products').select('id,name,category,description,image_url,weight_grams,karat,price_toman,stock,is_active,created_at,tag,pricing_mode,labor_mode,labor_value,seller_profit_percent,commission_percent,vat_percent,attributes')
            .eq('is_active',true).order('created_at',{ascending:false}),
          supabase.from('categories').select('id,name,slug,sort_order,is_active')
            .eq('is_active',true).order('sort_order',{ascending:true}),
          supabase.from('market_quotes').select('symbol,title,price_toman,source,observed_at,provider_updated_at,is_live')
            .eq('symbol','gold_18k').order('observed_at',{ascending:false}).limit(1).maybeSingle()
        ]);
        if(!active)return;
        if(productResult.error){setDataStatus('error');setProducts([]);setDataMessage('دریافت محصولات ناموفق بود؛ برای جلوگیری از نمایش قیمت نادرست، اطلاعات نمونه نمایش داده نمی‌شود.');}
        else{
          const rows=(productResult.data||[]).filter(p=>Number(p.price_toman)>0&&!/شمش|آب\s*شده|آبشده/.test(String(p.category||'')+' '+String(p.name||'').replace(/ي/g,'ی')));
          setProducts(rows);setDataStatus('connected');
          setDataMessage(rows.length?'محصولات و قیمت‌ها مستقیماً از پایگاه داده مه‌گلد دریافت می‌شوند.':'اتصال برقرار است؛ هنوز محصول فعالی برای نمایش ثبت نشده است.');
        }
        if(!categoryResult.error)setDbCategories(categoryResult.data||[]);
        if(!quoteResult.error&&quoteResult.data)setQuote(quoteResult.data);
      }catch{
        if(!active)return;
        setDataStatus('error');setProducts([]);setDataMessage('ارتباط با پایگاه داده برقرار نشد.');
      }
    })();
    return()=>{active=false;};
  },[]);
  useEffect(()=>{try{localStorage.setItem('mahgold_cart',JSON.stringify(cart));}catch{}},[cart]);
  useEffect(()=>{if(!cartToast)return;const timer=setTimeout(()=>setCartToast(''),3200);return()=>clearTimeout(timer);},[cartToast]);
  useEffect(()=>{const syncProductRoute=()=>{const path=window.location.pathname;const match=path.match(/^\/product\/([^/]+)\/?$/);if(match){setCatalogPage(false);const product=products.find(p=>p.id===decodeURIComponent(match[1]));if(product)setSelectedProduct(product);return;}setSelectedProduct(null);const cat=path.match(/^\/category\/([^/]+)\/?$/);setCatalogPage(path==='/products'||!!cat);setCategory(cat?decodeURIComponent(cat[1]):'همه محصولات');};syncProductRoute();window.addEventListener('popstate',syncProductRoute);return()=>window.removeEventListener('popstate',syncProductRoute);},[products]);
  useEffect(()=>{setCheckoutRequestKey(null);},[cart,customer]);

  const categories=useMemo(()=>{
    const rows=dbCategories.map(row=>row.name).filter(Boolean);
    const extras=rows.filter(name=>!presetCategories.includes(name));
    return [...presetCategories,...extras];
  },[dbCategories]);
  const filtered=useMemo(()=>{
    // Products without a positive sale price are kept in Admin but never exposed for sale.
    const rows=products.filter(p=>
      Number(p.price_toman)>0&&
      (category==='همه محصولات'||(category==='طلای زینتی'?jewelryProductCategories.has(p.category):category==='سرمایه‌گذاری'?investmentCategories.has(p.category):p.category===category))&&
      (!query.trim()||p.name?.toLocaleLowerCase('fa').includes(query.trim().toLocaleLowerCase('fa')))
    );
    return rows.sort((a,b)=>{
      if(sortMode==='cheap')return Number(a.price_toman||0)-Number(b.price_toman||0);
      if(sortMode==='expensive')return Number(b.price_toman||0)-Number(a.price_toman||0);
      return new Date(b.created_at||0)-new Date(a.created_at||0);
    });
  },[products,category,query,sortMode]);
  const homeFeatured=[];
  const openCatalog=(nextCategory='همه محصولات')=>{setCategory(nextCategory);setCategoryGroup(investmentCategories.has(nextCategory)?'سرمایه‌گذاری':jewelryProductCategories.has(nextCategory)?'طلای زینتی':nextCategory==='سرمایه‌گذاری'?'سرمایه‌گذاری':'همه محصولات');setCatalogPage(true);const path=nextCategory==='همه محصولات'?'/products':'/category/'+encodeURIComponent(nextCategory);window.history.pushState({mahgoldCatalog:true},'',path);window.scrollTo({top:0,behavior:'auto'});};
  const showHome=()=>{setCatalogPage(false);setCategory('همه محصولات');window.history.pushState({},'','/');window.scrollTo({top:0,behavior:'smooth'});};
  const cartCount=cart.reduce((sum,item)=>sum+Number(item.qty||0),0);
  const cartTotal=cart.reduce((sum,item)=>sum+Number(item.price_toman||0)*Number(item.qty||0),0);
  const quoteFresh=isQuoteFresh(quote,clockNow);
  const cartNeedsFreshQuote=cart.some(item=>item.pricing_mode==='auto')&&!quoteFresh;

  const openProduct=product=>{setCatalogPage(false);setSelectedProduct(product);window.history.pushState({mahgoldProduct:true},'', '/product/'+encodeURIComponent(product.id));window.scrollTo({top:0,behavior:'auto'});};
  const closeProduct=()=>{setSelectedProduct(null);if(window.location.pathname.startsWith('/product/'))window.history.pushState({},'', '/category/'+encodeURIComponent(category==='همه محصولات'?'طلای زینتی':category));setCatalogPage(true);window.scrollTo({top:0,behavior:'auto'});};
  const addToCart=product=>{
    if(!supabase||dataStatus!=='connected'||!product.id){setCheckoutError('اتصال فروشگاه برقرار نیست.');return;}
    if(product.pricing_mode==='auto'&&!quoteFresh){setCheckoutError('نرخ معتبر طلای ۱۸ عیار در دسترس نیست؛ نرخ دستی یا خودکار باید در ۵ دقیقه اخیر ثبت شده باشد.');return;}
    const previous=cart.find(item=>item.id===product.id);
    const nextQty=Number(previous?.qty||0)+1;
    if(nextQty>Number(product.stock||0)){setCheckoutError('تعداد انتخاب‌شده از موجودی محصول بیشتر است.');return;}
    setCart(old=>previous?old.map(item=>item.id===product.id?{...item,qty:nextQty}:item):[...old,{...product,qty:1}]);
    setCheckoutError('');
    setCartToast('«'+product.name+'» به سبد خرید اضافه شد.');
  };
  const changeQuantity=(id,delta)=>{
    const current=cart.find(item=>item.id===id);
    if(!current)return;
    const nextQty=Number(current.qty||0)+delta;
    if(nextQty>Number(current.stock||0)){
      setCheckoutError('موجودی این محصول اجازه افزایش تعداد بیشتر را نمی‌دهد.');
      return;
    }
    setCart(old=>old.map(item=>item.id===id?{...item,qty:nextQty}:item).filter(item=>item.qty>0));
    setCheckoutError('');
  };
  const refreshCartBeforeCheckout=async()=>{
    if(!cart.length)return false;
    setCartRefreshing(true);
    try{
      const ids=cart.map(item=>item.id);
      const [productsResult,quoteResult]=await Promise.all([
        supabase.from('products').select('id,name,category,description,image_url,weight_grams,karat,price_toman,stock,is_active,pricing_mode,labor_mode,labor_value,seller_profit_percent,commission_percent,vat_percent,attributes').in('id',ids),
        supabase.from('market_quotes').select('symbol,title,price_toman,source,observed_at,provider_updated_at,is_live').eq('symbol','gold_18k').order('observed_at',{ascending:false}).limit(1).maybeSingle()
      ]);
      if(productsResult.error)throw productsResult.error;
      const byId=new Map((productsResult.data||[]).map(row=>[row.id,row]));
      for(const item of cart){
        const latest=byId.get(item.id);
        if(!latest||!latest.is_active)throw new Error('یکی از محصولات سبد دیگر فعال نیست.');
        if(Number(latest.price_toman)<=0)throw new Error('قیمت یکی از محصولات معتبر نیست؛ تا ثبت قیمت معتبر امکان ادامه وجود ندارد.');
        if(Number(latest.stock||0)<Number(item.qty||0))throw new Error('موجودی محصول «'+latest.name+'» برای تعداد انتخاب‌شده کافی نیست.');
      }
      const refreshedQuote=quoteResult.data;
      if(cart.some(item=>byId.get(item.id)?.pricing_mode==='auto')&&(quoteResult.error||!isQuoteFresh(refreshedQuote))){
        throw new Error('نرخ واقعی طلای ۱۸ عیار تازه نیست؛ قیمت و موجودی تازه‌سازی شد اما ادامه سفارش تا دریافت نرخ معتبر مسدود است.');
      }
      setCart(old=>old.map(item=>({...item,...byId.get(item.id),qty:item.qty})));
      if(refreshedQuote)setQuote(refreshedQuote);
      setCheckoutError('');
      return true;
    }catch(error){setCheckoutError(error?.message||'تازه‌سازی قیمت و موجودی سبد ناموفق بود.');return false;}
    finally{setCartRefreshing(false);}
  };
  const submitOrder=async event=>{
    event.preventDefault();setCheckoutError('');
    if(!supabase||!cart.length||checkoutBusy)return;
    const {data:authData}=await supabase.auth.getSession();
    if(!authData.session?.user){
      setCheckoutError('برای ثبت سفارش ابتدا حساب کاربری خود را با کد تأیید ایمیل فعال کنید.');
      setCheckoutOpen(false);
      setAccountNotice('برای ادامه سفارش، ابتدا وارد حساب شوید یا حساب جدید بسازید.');
      setAccountOpen(true);
      return;
    }
    setCheckoutBusy(true);
    const idempotencyKey=checkoutRequestKey||crypto.randomUUID();
    setCheckoutRequestKey(idempotencyKey);
    try{
      const {data,error}=await supabase.functions.invoke('mahgold-create-order',{
        body:{
          customer_name:customer.name,
          customer_phone:toLatinDigits(customer.phone),
          customer_email:authData.session.user.email||customer.email||null,
          shipping_address:[customer.city,customer.postalCode,customer.address].filter(Boolean).join(' · '),
          customer_note:customer.note||'',
          auth_method:'email',
          items:cart.map(item=>({product_id:item.id,quantity:item.qty,expected_price_toman:Number(item.price_toman)})),
          idempotency_key:idempotencyKey
        }
      });
      if(error){
        let message=error.message||'ثبت سفارش انجام نشد. در صورت خطای ارتباط، با همان اطلاعات دوباره تلاش کنید.';
        try{const detail=await error.context?.json();if(detail?.error)message=detail.error;}catch{}
        setCheckoutError(message);return;
      }
      const orderData=data?.data||data;
      if(!orderData?.order_id||!orderData?.order_number){setCheckoutError('پاسخ ثبت سفارش کامل نبود. لطفاً وضعیت سفارش را پیش از ارسال مجدد بررسی کنید.');return;}
      setOrderResult(orderData);setCart([]);setCheckoutRequestKey(null);setCheckoutOpen(false);setCartOpen(false);
    }catch(error){
      setCheckoutError(error?.message||'ارتباط با سرویس ثبت سفارش برقرار نشد. با همان اطلاعات دوباره تلاش کنید.');
    }finally{setCheckoutBusy(false);}
  };
  if(isAdminPage)return <Suspense fallback={<div className="min-h-screen grid place-items-center" dir="rtl">در حال بارگذاری پنل مدیریت…</div>}><AdminPanel/></Suspense>;

  return <div dir="rtl" className="min-h-screen bg-background text-foreground">
    {siteContent?.announcement?.active!==false&&<div className="ref-announcement">{siteContent?.announcement?.text||"ارسال امن و بسته‌بندی ویژه ✦ پشتیبانی مه‌گلد ✦ همراه انتخاب شما"}</div>}
    <header className="ref-site-header sticky top-0 z-40">
      <div className="ref-main-header mx-auto max-w-[1440px] px-4 md:px-6">
        <button aria-label="منو" className="ref-mobile-menu md:hidden" onClick={()=>setMenuOpen(v=>!v)}><Menu size={20}/></button>
        <a aria-label="مه‌گلد - صفحه اصلی" className="ref-brand ref-brand-redesigned" href="#home" onClick={showHome}>
          <img className="ref-header-logo-image" src={MAHGOLD_LOGO} alt="لوگوی اصلی مه‌گلد" />
        </a>
        <nav className="ref-primary-nav">
          <a className="active" href="#home" onClick={showHome}>خانه</a>
          <button type="button" onClick={()=>openCatalog('همه محصولات')}>همه محصولات</button>
          <button type="button" onClick={()=>setAccountOpen(true)}>پیگیری سفارش</button>
          <a href="/category/طلای%20زینتی" onClick={e=>{e.preventDefault();openCatalog('طلای زینتی');}}>طلای زینتی</a>
          <a href="/category/سکه" onClick={e=>{e.preventDefault();openCatalog('سکه');}}>سکه</a>
        </nav>
        <label className="ref-header-search"><Search size={16}/><input aria-label="جستجوی محصولات" value={query} onChange={e=>{setQuery(e.target.value);if(e.target.value.trim()&&!catalogPage)openCatalog("همه محصولات");}} placeholder="جستجو در محصولات..."/></label>
        <div className="ref-header-actions">
          <button aria-label="حساب کاربری" onClick={()=>setAccountOpen(true)}><UserRound size={20}/></button>
          <button aria-label="سبد خرید" className="ref-header-cart" onClick={()=>setCartOpen(true)}><ShoppingBag size={20}/>{cartCount>0&&<b>{money(cartCount)}</b>}</button>
        </div>
      </div>
      {menuOpen&&<nav className="ref-mobile-links flex flex-col gap-4 border-t border-border bg-background px-5 py-4 text-sm text-muted-foreground md:hidden">
        <button className="text-right" onClick={()=>{openCatalog('همه محصولات');setMenuOpen(false);}}>همه محصولات</button><a href="#categories" onClick={()=>setMenuOpen(false)}>دسته‌بندی‌ها</a><a href="#shop" onClick={()=>setMenuOpen(false)}>فروشگاه</a><a href="#story" onClick={()=>setMenuOpen(false)}>درباره مه‌گلد</a><button className="text-right" onClick={()=>{setAccountOpen(true);setMenuOpen(false);}}>پیگیری سفارش</button>
        <button className="text-right" onClick={()=>{setAccountOpen(true);setMenuOpen(false);}}>ورود / ثبت‌نام</button>
      </nav>}
    </header>

    <main className="min-h-[60vh]" id="home">
      {!catalogPage&&<section aria-label="پیشنهادات مه‌گلد" aria-roledescription="carousel" className="ref-offers-section">
        <div className="ref-offers-heading">
          <div>
            <span className="ref-offers-eyebrow">MAHGOLD SELECTION</span>
            <h1>طلای زینتی و سکه؛ انتخاب مه‌گلد</h1>
            <p>انتخاب‌هایی چشم‌نواز از مجموعه مه‌گلد</p>
          </div>
          <span className="ref-offers-count">۰۵ انتخاب منتخب</span>
        </div>
        <div className="ref-offers-viewport">
          <div className="ref-offers-track" style={{transform:`translateX(-${activeOffer*(window.innerWidth<=767?window.innerWidth*.82+11:Math.min(window.innerWidth*.31,390)+16)}px)`,transition:offerTransition?'transform 720ms cubic-bezier(.22,.75,.25,1)':'none'}}>
            {offerTrackItems.map((item,index)=><button type="button" key={index} className="ref-offer-card" onClick={()=>{
              if(item.product){openProduct(item.product);return;}
              openCatalog(item.category||'همه محصولات');
            }}>
              <img src={optimizeUnsplashImage(item.image,640)} srcSet={unsplashResponsiveSrcSet(item.image)} sizes="(max-width: 767px) 82vw, (max-width: 1200px) 31vw, 390px" alt={item.title} loading={index===0?'eager':'lazy'} decoding="async" fetchPriority={index===0?'high':'low'}/>
              <span className="ref-offer-shade"/>
              <span className="ref-offer-copy">
                <small>{item.category||'منتخب مه‌گلد'}</small>
                <b>{item.title}</b>
                <em>{item.product?'مشاهده جزئیات محصول':'مشاهده مجموعه'} <ArrowLeft size={14}/></em>
              </span>
            </button>)}
          </div>
        </div>
        <div className="ref-offers-footer"><span>حرکت خودکار · هر ۳ ثانیه</span><span className="ref-offers-dots">{offerItems.map((item,index)=><i key={index} className={activeOffer%offerItems.length===index?'active':''}/>)}</span></div>
      </section>}

      {!catalogPage&&<section className="ref-home-new-arrivals mx-auto max-w-7xl px-4 py-8 md:px-7 md:py-12" aria-label="جدیدترین محصولات">
        <div className="ref-home-shelf-heading"><div><span className="eyebrow text-gold-deep">JUST ARRIVED · MAHGOLD</span><h2>جدیدترین محصولات</h2><p>تازه‌ترین انتخاب‌های ثبت‌شده در فروشگاه</p></div><button type="button" onClick={()=>openCatalog('همه محصولات')}>مشاهده همه <ArrowLeft size={15}/></button></div>
        {(()=>{const arrivals=products.filter(p=>Number(p.price_toman)>0).slice().sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0)).slice(0,4);return arrivals.length?<div className="ref-home-arrivals-grid">{arrivals.map(product=><article className="ref-product-card ref-home-arrival-card" key={product.id}>
          <button type="button" className="ref-home-arrival-image" onClick={()=>openProduct(product)} aria-label={'مشاهده '+product.name}><ProductImage product={product}/></button>
          <div className="ref-product-body"><span className="ref-home-arrival-category">{product.category}</span><button type="button" className="ref-product-name" onClick={()=>openProduct(product)}>{product.name}</button><div className="ref-home-arrival-meta">{product.weight_grams?gram(product.weight_grams):'طلای منتخب مه‌گلد'}{product.karat?' · '+money(product.karat)+' عیار':''}</div>
            <div className="ref-product-bottom"><strong>{money(product.price_toman)} <small>تومان</small></strong><button type="button" aria-label={'افزودن '+product.name+' به سبد'} className="ref-add-button" disabled={Number(product.stock||0)<1||dataStatus!=='connected'||(product.pricing_mode==='auto'&&!quoteFresh)} onClick={()=>addToCart(product)}><Plus size={17}/></button></div><div className={Number(product.stock||0)>0?'ref-home-stock':'ref-home-stock is-empty'}>{Number(product.stock||0)>0?'موجود برای سفارش':'ناموجود'}</div>
          </div></article>)}</div>:<div className="ref-home-arrivals-empty">{dataStatus==='loading'?'در حال دریافت محصولات…':'محصول جدیدی برای نمایش ثبت نشده است.'}</div>})()}
      </section>}

      {catalogPage&&<section className="ref-catalog-heading mx-auto max-w-7xl px-4 py-6 md:px-7"><button onClick={showHome} className="ref-catalog-back">← بازگشت به صفحه اصلی</button><div className="ref-catalog-heading-layout"><div><span className="eyebrow text-gold-deep">MAHGOLD CATALOG</span><h1>{category==='همه محصولات'?'همه محصولات مه‌گلد':'محصولات '+category}</h1><p>مجموعه کامل محصولات این بخش، همراه با جست‌وجو و مرتب‌سازی</p></div><img className="ref-catalog-category-image" src={optimizeUnsplashImage(editorialImageFor(category)||displayTiles.find(t=>t.name===category)?.image||tiles[0].image,640)} srcSet={unsplashResponsiveSrcSet(editorialImageFor(category)||displayTiles.find(t=>t.name===category)?.image||tiles[0].image)} sizes="(max-width: 767px) 90vw, 420px" alt={'تصویر دسته '+category} loading="eager" decoding="async" fetchPriority="high"/></div></section>}

                {!catalogPage&&<div className="ref-quote-strip">
          <div className="ref-quote-title"><span className="ref-quote-bars">▥</span><div><b>قیمت لحظه‌ای طلای ۱۸ عیار</b><small>{quoteFresh?(quoteIsManual?'نرخ دستی معتبر':'به‌روزرسانی لحظه‌ای'):quoteIsManual?'نرخ دستی منقضی‌شده':quote?.is_live?'نرخ قدیمی · قیمت‌گذاری خودکار متوقف':'در انتظار نرخ معتبر'}</small></div></div>
          <strong>{quote?money(quote.price_toman)+' تومان':'— تومان'}</strong>
          <span className="ref-quote-live"><i/> {quoteFresh?'نرخ معتبر':'بدون نرخ تازه'}</span>
        </div>}

      {!catalogPage&&(
      <section className="mx-auto max-w-7xl scroll-mt-20 px-4 py-5 md:px-7 md:py-6" id="categories">
        <div className="mb-8 flex items-end justify-between gap-5">
          <div><div className="eyebrow text-gold-deep">DISCOVER MAHGOLD</div><h2 className="mt-3 text-2xl font-semibold md:text-3xl">از میان مجموعه‌ها انتخاب کنید</h2></div>
          <p className="hidden text-xs text-muted-foreground md:block">جزئیاتی برای سلیقه‌های خاص</p>
        </div>
        <div className="ref-category-grid ref-category-grid-collections">
          {[
            ...displayTiles.filter(tile=>tile.name!=='طلای زینتی'),
            {name:'انگشتر',desc:'انگشترهای ظریف و خاص',image:'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=900&q=85'},
            {name:'گردنبند',desc:'گردنبندهای درخشان',image:'https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=900&q=85'},
            {name:'دستبند',desc:'دستبندهای طلایی',image:'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=900&q=85'},
            {name:'النگو',desc:'النگوهای کلاسیک و مدرن',image:'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&q=85'},
            {name:'گوشواره',desc:'جزئیاتی برای درخشش',image:'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=85'},
            {name:'آویز و پلاک',desc:'آویزهای دوست‌داشتنی',image:'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=85'},
            {name:'زنجیر',desc:'زنجیرهای طلایی',image:'https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=900&q=85'},
            {name:'پابند',desc:'زیور ظریف پا',image:'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=900&q=85'},
            {name:'سرویس طلا',desc:'هماهنگی در یک انتخاب',image:'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&q=85'},
            {name:'سایر زیورآلات',desc:'انتخاب‌های متفاوت مه‌گلد',image:'https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=900&q=85'}
          ].map(tile=>{
            return <button key={tile.name} className="ref-category-card" onClick={()=>openCatalog(tile.name)} aria-label={'مشاهده مجموعه '+tile.name}>
              <img src={optimizeUnsplashImage(tile.image,720)} srcSet={unsplashResponsiveSrcSet(tile.image)} sizes="(max-width: 767px) 46vw, (max-width: 1200px) 30vw, 260px" alt={'تصویر الهام‌بخش مجموعه '+tile.name} loading="lazy" decoding="async"/><span className="ref-category-shade"/>
              <span className="ref-category-text"><b>{tile.name}</b><small>{tile.desc}</small><em>مشاهده مجموعه <ArrowLeft size={12}/></em></span>
            </button>;
          })}
        </div>
        <div className="ref-service-grid">
          <article className="ref-service-card"><ShieldCheck/><div><b>اصالت و شفافیت</b><small>اطلاعات روشن برای انتخاب آگاهانه</small></div></article>
          <article className="ref-service-card"><Gift/><div><b>بسته‌بندی ویژه</b><small>تجربه‌ای شایسته هدیه دادن</small></div></article>
          <article className="ref-service-card"><Headphones/><div><b>همراهی تا انتخاب</b><small>پشتیبانی در مسیر خرید</small></div></article>
        </div>
      </section>

      )}

      <section className={'ref-shop-section scroll-mt-16 py-5 md:py-7 '+(catalogPage?'ref-catalog-full':'')} id="shop">
        <div className="mx-auto max-w-7xl px-4 md:px-7">
        <div className="ref-shop-heading"><span className="eyebrow text-gold-deep">{catalogPage?'COMPLETE COLLECTION':'THE CURATED EDIT'}</span><h2 className="mt-1 text-xl font-semibold md:text-2xl">{catalogPage?(category==='همه محصولات'?'همه محصولات':'تمام محصولات '+category):'منتخب‌های مه‌گلد'}</h2>{!catalogPage&&<p className="mt-2 text-xs text-muted-foreground">چند انتخاب ویژه؛ برای دیدن کل مجموعه وارد فروشگاه شوید.</p>}</div>
        {!catalogPage&&<button className="ref-all-products-link" onClick={()=>openCatalog('همه محصولات')}>مشاهده همه محصولات <ArrowLeft size={15}/></button>}
        <div className="ref-shop-tools">
            <label className="flex h-10 w-full items-center gap-2 rounded-full border border-border bg-card px-4 text-muted-foreground md:w-72">
              <Search size={16}/><input aria-label="جست‌وجوی محصول" className="w-full bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground" value={query} onChange={e=>setQuery(e.target.value)} placeholder="نام محصول را جستجو کنید..."/>
            </label>
          </div>
          <div className="mb-7 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {catalogPage&&category==='همه محصولات'&&<div className="ref-collection-image-grid" aria-label="مجموعه‌های فروشگاه">
              {(categoryGroup==='همه محصولات'?[
                {name:'طلای زینتی',desc:'زیورآلات و مجموعه‌های ظریف',image:displayTiles.find(t=>t.name==='طلای زینتی')?.image},
                {name:'سکه',desc:'مجموعه سکه‌های طلا',image:displayTiles.find(t=>t.name==='سکه')?.image}
              ]:catalogCategoryGroups.find(group=>group.name===categoryGroup)?.items.map(name=>({name,desc:'مشاهده محصولات '+name,image:editorialImageFor(name)}))||[]).map(tile=><button type="button" key={tile.name} className="ref-collection-image-card" onClick={()=>openCatalog(tile.name)}>
                <img src={tile.image||displayTiles[0].image} alt={tile.name} loading="lazy"/><span className="ref-collection-image-shade"/><span className="ref-collection-image-label"><b>{tile.name}</b><small>دیدن مجموعه <ArrowLeft size={12}/></small></span>
              </button>)}
            </div>}
            <label className="ref-sort shrink-0"><span>مرتب‌سازی</span><select aria-label="مرتب‌سازی" value={sortMode} onChange={e=>setSortMode(e.target.value)}>
              <option value="newest">جدیدترین</option><option value="cheap">ارزان‌ترین</option><option value="expensive">گران‌ترین</option>
            </select></label>
          </div>
          {catalogPage&&<div className="ref-product-grid">
            {filtered.map(product=><article className="ref-product-card group" key={product.id}>
              <button className="block w-full overflow-hidden text-right" onClick={()=>openProduct(product)} aria-label={'مشاهده '+product.name}>
                <ProductImage product={product}/>
              </button>
              <div className="ref-product-body">
                <span className="text-[10px] text-muted-foreground md:text-[11px]">{product.category}</span>
                <button className="ref-product-name line-clamp-1 text-right" onClick={()=>openProduct(product)}>{product.name}</button>
                <div className="mt-0.5 text-[11px] text-muted-foreground">{[product.weight_grams?gram(product.weight_grams):null,product.karat?money(product.karat)+' عیار':null].filter(Boolean).join(' · ')}</div>
                <div className="ref-product-bottom">
                  <strong>{money(product.price_toman)} <small>تومان</small></strong>
                  <button aria-label={'افزودن '+product.name+' به سبد'} className="ref-add-button" disabled={Number(product.stock||0)<1||dataStatus!=='connected'||(product.pricing_mode==='auto'&&!quoteFresh)} onClick={()=>addToCart(product)}><Plus size={17}/></button>
                </div>
              </div>
            </article>)}
          </div>}
          {catalogPage&&dataStatus==='loading'&&<div className="ref-state">در حال دریافت محصولات مه‌گلد…</div>}
          {dataStatus==='error'&&<div className="ref-state">{dataMessage}</div>}
          {catalogPage&&dataStatus==='connected'&&filtered.length===0&&<div className="ref-state">محصولی با این مشخصات پیدا نشد.</div>}
          <p className="ref-shop-note">{dataStatus==='connected'?'قیمت‌ها و موجودی بر اساس آخرین اطلاعات فروشگاه مه‌گلد نمایش داده می‌شوند.':'قیمت‌ها و موجودی پس از برقراری اتصال نمایش داده می‌شوند.'}</p>
        </div>
      </section>

      {!catalogPage&&<section className="grid scroll-mt-16 bg-ink text-ink-foreground md:min-h-[440px] md:grid-cols-2" id="story">
        <div className="h-64 overflow-hidden md:h-auto"><img alt="جزئیات زیورآلات مه‌گلد" className="h-full w-full object-cover" loading="lazy" src={siteContent?.story_image||storyImage}/></div>
        <div className="flex flex-col justify-center px-6 py-14 md:px-[10%]">
          <div className="eyebrow text-gold-light">A Story of Elegance</div>
          <h2 className="mt-3 text-3xl font-normal leading-[1.5] md:text-4xl">زیبایی‌ای که<br/>از مد عبور می‌کند.</h2>
          <p className="mt-4 max-w-md text-sm leading-8 text-ink-muted">در مه‌گلد، هر انتخاب فرصتی‌ست برای بیان سلیقه شخصی. ما به طراحی ماندگار، جزئیات دقیق و تجربه‌ای ساده و دلنشین باور داریم.</p>
          <div><button className="mt-8 h-12 rounded-lg bg-gold-gradient px-7 text-sm font-bold text-ink shadow-gold transition-all hover:-translate-y-0.5 hover:brightness-110" onClick={()=>document.getElementById('shop')?.scrollIntoView({behavior:'smooth'})}>مشاهده محصولات</button></div>
        </div>
      </section>}
    </main>

    <footer className="ref-lux-footer" aria-label="پاورقی مه‌گلد">
      <div className="ref-footer-frame">
        <nav className="ref-footer-links" aria-label="پیوندهای سایت">
          <a href="#home">خانه</a><a href="#categories">دسته‌بندی‌ها</a><a href="#shop">فروشگاه</a><a href="#story">درباره ما</a>
        </nav>
        <div className="ref-footer-contact">
          <span><Phone size={14}/> پشتیبانی مه‌گلد</span>
          <span className="ref-footer-social-label">شبکه‌های ارتباطی</span>
          <div className="ref-footer-social-icons">
            <span title="واتس‌اپ" aria-label="واتس‌اپ" className="ref-footer-wa"><svg viewBox="0 0 32 32" width="21" height="21" role="img"><path fill="currentColor" d="M16 3.2A12.6 12.6 0 0 0 5.2 23.9L3.5 29l5.3-1.7A12.6 12.6 0 1 0 16 3.2Zm0 22.8a10.1 10.1 0 0 1-5.1-1.4l-.4-.2-3.1 1 1-3-.3-.4A10.1 10.1 0 1 1 16 26Zm5.6-7.6c-.3-.2-1.8-.9-2.1-1s-.5-.2-.7.2-.8 1-1 1.1-.4.2-.7 0a8.3 8.3 0 0 1-2.5-1.5 9.3 9.3 0 0 1-1.7-2.1c-.2-.4 0-.5.2-.7l.5-.6.2-.5a.6.6 0 0 0 0-.5c0-.2-.7-1.7-.9-2.3s-.5-.5-.7-.5h-.6a1.2 1.2 0 0 0-.9.4 3.7 3.7 0 0 0-1.2 2.8 6.4 6.4 0 0 0 1.3 3.4 14.6 14.6 0 0 0 5.6 4.9c.7.3 1.3.5 1.8.6.8.3 1.5.2 2.1.1.7-.1 1.8-.7 2-1.4s.3-1.3.2-1.4-.3-.2-.6-.4Z"/></svg></span>
            <span title="بله" aria-label="بله" className="ref-footer-bale"><svg viewBox="0 0 32 32" width="21" height="21" role="img"><circle cx="16" cy="16" r="15" fill="#168de2"/><path d="M7.5 15.2 23.8 8.8c.8-.3 1.5.2 1.2 1.2l-2.8 13.1c-.2 1-.8 1.2-1.6.7l-4.4-3.2-2.2 2.1c-.3.3-.6.5-1 .4l.4-4.8 8.7-7.8-10.7 6.7-4.5-1.4c-1-.3-1-1 .6-1.6Z" fill="#fff"/></svg></span>
          </div>
        </div>
        <div className="ref-footer-copy">© ۱۴۰۵ مه‌گلد · زیورآلات طلا</div>
      </div>
    </footer>

    <nav className="ref-mobile-nav fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-background/95 px-2 pt-1 backdrop-blur-xl md:hidden">
      <button className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium" onClick={()=>setAccountOpen(true)}><Headphones size={21}/>پشتیبانی</button>
      <a className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium" href="#categories"><Gift size={21}/>اصالت کالا</a>
      <button className="relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium" onClick={()=>setCartOpen(true)}><ShieldCheck size={21}/>خرید امن{cartCount>0&&<b className="absolute right-1/2 top-0 translate-x-5 rounded-full bg-gold px-1 text-[9px] text-ink">{money(cartCount)}</b>}</button>
    </nav>

    {accountOpen&&<div className="ref-overlay" onClick={()=>setAccountOpen(false)}>
      <section className="ref-dialog" onClick={e=>e.stopPropagation()}>
        <div className="ref-dialog-head"><div><div className="eyebrow text-gold-deep">MAHGOLD</div><h2>حساب کاربری مه‌گلد</h2></div><button className="ref-close" aria-label="بستن" onClick={()=>setAccountOpen(false)}><X/></button></div>
        <AccountContent notice={accountNotice} onAuthenticated={()=>{setAccountOpen(false);setAccountNotice('');setCartOpen(true);}} onClose={()=>{setAccountOpen(false);setAccountNotice('');}}/>
      </section>
    </div>}

    {cartOpen&&<div className="ref-overlay" onClick={()=>setCartOpen(false)}>
      <aside className="ref-drawer" onClick={e=>e.stopPropagation()}>
        <div className="ref-drawer-head"><div><div className="eyebrow text-gold-deep">YOUR SELECTION</div><h2>سبد خرید <small className="text-sm text-muted-foreground">({money(cartCount)})</small></h2></div><button className="ref-close" aria-label="بستن" onClick={()=>setCartOpen(false)}><X/></button></div>
        {cart.length===0?<div className="ref-empty"><ShoppingBag size={38}/><h3>سبد خرید شما خالی است</h3><p>از میان مجموعه‌های مه‌گلد انتخاب کنید.</p><button className="mt-4 h-11 rounded-lg bg-gold-gradient px-7 text-xs font-bold text-ink" onClick={()=>{setCartOpen(false);document.getElementById('shop')?.scrollIntoView({behavior:'smooth'});}}>مشاهده محصولات</button></div>:
          <>
            <div>{cart.map(item=><div className="ref-cart-line" key={item.id}>
              <ProductImage product={item}/>
              <div><h4>{item.name}</h4><strong>{item.pricing_mode==='auto'&&!quoteFresh?'نرخ معتبر نیست':money(item.price_toman)+' تومان'}</strong>
              {item.pricing_mode==='auto'&&quoteFresh&&(()=>{const b=priceBreakdown(item,quote);return <details className="mahgold-cart-breakdown mt-2 text-[11px] leading-6"><summary>ریز محاسبات قیمت</summary><span>اصل طلا: {money(b.base)} تومان</span><span>اجرت ساخت: {money(b.labor)} تومان</span><span>سود فروشنده: {money(b.profit)} تومان</span><span>کمیسیون: {money(b.commission)} تومان</span><span>مالیات ارزش افزوده: {money(b.tax)} تومان</span><b>جمع هر واحد: {money(b.total)} تومان</b></details>;})()}
              <div className="ref-qty">
                <button aria-label="کاهش تعداد" onClick={()=>changeQuantity(item.id,-1)}><Minus size={13}/></button><span className="text-xs">{money(item.qty)}</span><button aria-label="افزایش تعداد" onClick={()=>changeQuantity(item.id,1)}><Plus size={13}/></button>
              </div></div>
              <button className="ref-remove" aria-label="حذف محصول" onClick={()=>setCart(old=>old.filter(p=>p.id!==item.id))}><X size={15}/></button>
            </div>)}</div>
            <div className="ref-cart-summary"><span>جمع سبد خرید</span><b>{cartNeedsFreshQuote?'پس از دریافت نرخ معتبر':money(cartTotal)+' تومان'}</b></div>
            <p className="mb-4 text-[11px] leading-7 text-muted-foreground">مبلغ نهایی و موجودی هنگام ثبت سفارش در سرور دوباره بررسی می‌شود.</p>
            <button className="h-12 rounded-lg bg-gold-gradient text-sm font-bold text-ink ref-full" onClick={async()=>{const ready=await refreshCartBeforeCheckout();if(!ready)return;const {data}=await supabase.auth.getSession();if(!data.session?.user){setAccountNotice('برای ثبت سفارش ابتدا حساب کاربری بسازید یا وارد شوید.');setAccountOpen(true);setCartOpen(false);}else setCheckoutOpen(true);}} disabled={cartRefreshing}>{cartRefreshing?'در حال تازه‌سازی قیمت و موجودی…':'ادامه و ثبت سفارش'} <ArrowLeft className="mr-2 inline" size={16}/></button>
          </>}
      </aside>
    </div>}

    {checkoutOpen&&<div className="ref-overlay" onClick={()=>setCheckoutOpen(false)}>
      <form className="ref-drawer ref-checkout-form" onClick={e=>e.stopPropagation()} onSubmit={submitOrder}>
        <div className="ref-drawer-head"><div><div className="eyebrow text-gold-deep">SECURE CHECKOUT</div><h2>اطلاعات سفارش</h2></div><button type="button" className="ref-close" aria-label="بستن" onClick={()=>setCheckoutOpen(false)}><X/></button></div>
        <label>نام و نام خانوادگی<input required minLength="2" value={customer.name} onChange={e=>setCustomer({...customer,name:e.target.value})}/></label>
        <label>شماره تماس<input required type="tel" minLength="8" value={customer.phone} onChange={e=>setCustomer({...customer,phone:e.target.value})}/></label>
        <label>ایمیل (اختیاری)<input type="email" value={customer.email} onChange={e=>setCustomer({...customer,email:e.target.value})}/></label>
        <label>شهر<input required value={customer.city} onChange={e=>setCustomer({...customer,city:e.target.value})}/></label>
        <label>کد پستی<input value={customer.postalCode} onChange={e=>setCustomer({...customer,postalCode:e.target.value})}/></label>
        <label>نشانی کامل ارسال<textarea required rows="3" value={customer.address} onChange={e=>setCustomer({...customer,address:e.target.value})}/></label>
        <label>توضیحات سفارش<textarea rows="2" value={customer.note} onChange={e=>setCustomer({...customer,note:e.target.value})}/></label>
        <div className="ref-cart-summary"><span>جمع سبد خرید</span><b>{money(cartTotal)} تومان</b></div>
        {checkoutError&&<p className="ref-message">{checkoutError}</p>}
        <button className="h-12 rounded-lg bg-gold-gradient text-sm font-bold text-ink ref-full" disabled={checkoutBusy}>{checkoutBusy?'در حال ثبت…':'ثبت سفارش و رزرو موجودی'}</button>
        <small className="ref-note">ثبت سفارش به معنی پرداخت نیست. پرداخت آنلاین تا اتصال درگاه فعال نخواهد بود.</small>
      </form>
    </div>}

    {selectedProduct&&<div className="ref-product-page">
      <div className="ref-product-page-top"><button className="ref-product-back" onClick={closeProduct}><ArrowLeft size={17}/> بازگشت به فروشگاه</button><span className="eyebrow text-gold-deep">MAHGOLD · PRODUCT DETAILS</span></div>
      <div className="ref-product-page-grid">
        <ProductImage product={selectedProduct} className="ref-product-page-image" onClick={()=>{setZoomScale(1);setZoomOffset({x:0,y:0});zoomPointersRef.current.clear();setZoomOpen(true);}}/>
        <section className="ref-product-specs-wrap" aria-label="جدول مشخصات محصول">
          <div className="ref-product-specs-title">مشخصات محصول</div>
          <div className="ref-product-specs" role="table">
            <div role="row"><span role="cell">وزن</span><b role="cell">{gram(selectedProduct.weight_grams)}</b></div>
            <div role="row"><span role="cell">عیار</span><b role="cell">{money(selectedProduct.karat||18)}</b></div>
            <div role="row"><span role="cell">موجودی</span><b role="cell">{money(selectedProduct.stock||0)} عدد</b></div>
            {Object.entries(selectedProduct.attributes||{}).filter(([key,value])=>!hiddenProductAttributeKeys.has(String(key).trim())&&String(key).trim()&&String(value??'').trim()).map(([key,value])=><div role="row" key={key}><span role="cell">{String(key).trim()}</span><b role="cell">{String(value)}</b></div>)}
          </div>
        </section>
        <div className="ref-product-page-copy">
          <span className="text-xs text-muted-foreground">{selectedProduct.category}</span>
          <h1>{selectedProduct.name}</h1>
          <p>{selectedProduct.description||'جزئیاتی ظریف و انتخابی ماندگار از مجموعه مه‌گلد.'}</p>
          <strong className="ref-product-page-price">{selectedProduct.pricing_mode==='auto'&&!quoteFresh?'نرخ معتبر در دسترس نیست':<>{money(selectedProduct.price_toman)} <small>تومان</small></>}</strong>
          {selectedProduct.pricing_mode==='auto'&&quoteFresh&&(()=>{const b=priceBreakdown(selectedProduct,quote);return <div className="mahgold-product-price-breakdown mt-4 rounded-2xl border border-gold/20 bg-card/60 p-4 text-sm"><h3 className="mb-2 font-semibold">ریز محاسبات قیمت</h3><div className="flex justify-between py-1"><span>اصل طلا</span><b>{money(b.base)} تومان</b></div><div className="flex justify-between py-1"><span>اجرت ساخت</span><b>{money(b.labor)} تومان</b></div><div className="flex justify-between py-1"><span>سود فروشنده</span><b>{money(b.profit)} تومان</b></div><div className="flex justify-between py-1"><span>کمیسیون</span><b>{money(b.commission)} تومان</b></div><div className="flex justify-between py-1"><span>مالیات ارزش افزوده</span><b>{money(b.tax)} تومان</b></div><div className="mt-2 flex justify-between border-t border-gold/20 pt-3 font-semibold"><span>قیمت نهایی</span><b>{money(b.total)} تومان</b></div></div>;})()}
          <button className="h-12 rounded-lg bg-gold-gradient text-sm font-bold text-ink ref-full" disabled={Number(selectedProduct.stock||0)<1||(selectedProduct.pricing_mode==='auto'&&!quoteFresh)} onClick={()=>addToCart(selectedProduct)}>افزودن به سبد خرید <ShoppingBag className="mr-2 inline" size={16}/></button>
          {checkoutError&&<p className="ref-message">{checkoutError}</p>}
        </div>
      </div>
    </div>}

    {zoomOpen&&selectedProduct&&<div className="ref-product-zoom" role="dialog" aria-modal="true" aria-label="گالری بزرگ‌نمایی تصویر محصول" onClick={()=>setZoomOpen(false)}>
      <button className="ref-product-zoom-close" aria-label="بستن گالری" onClick={()=>setZoomOpen(false)}><X/></button>
      <div className="ref-product-zoom-tools" onClick={e=>e.stopPropagation()}>
        <button aria-label="کوچک‌نمایی" onClick={()=>{setZoomScale(v=>{const next=Math.max(1,v-.25);if(next===1)setZoomOffset({x:0,y:0});return next;});}}><ZoomOut/></button>
        <span aria-live="polite">{Math.round(zoomScale*100)}٪</span>
        <button aria-label="بزرگ‌نمایی" onClick={()=>setZoomScale(v=>Math.min(3,v+.25))}><ZoomIn/></button>
        <button aria-label="بازگشت به اندازه اصلی" className="ref-zoom-reset" onClick={()=>{setZoomScale(1);setZoomOffset({x:0,y:0});}}>۱۰۰٪</button>
      </div>
      <div ref={zoomStageRef} className="ref-product-zoom-stage" onClick={e=>e.stopPropagation()}
        onPointerDown={e=>{e.currentTarget.setPointerCapture?.(e.pointerId);zoomPointersRef.current.set(e.pointerId,{x:e.clientX,y:e.clientY});const pts=[...zoomPointersRef.current.values()];if(pts.length===1){zoomGestureRef.current={...zoomGestureRef.current,startX:e.clientX,startY:e.clientY,x:zoomOffset.x,y:zoomOffset.y};}else if(pts.length===2){const dx=pts[0].x-pts[1].x,dy=pts[0].y-pts[1].y;zoomGestureRef.current={...zoomGestureRef.current,distance:Math.hypot(dx,dy),scale:zoomScale,midX:(pts[0].x+pts[1].x)/2,midY:(pts[0].y+pts[1].y)/2,x:zoomOffset.x,y:zoomOffset.y};}}}
        onPointerMove={e=>{if(!zoomPointersRef.current.has(e.pointerId))return;zoomPointersRef.current.set(e.pointerId,{x:e.clientX,y:e.clientY});const pts=[...zoomPointersRef.current.values()];if(pts.length===2&&zoomGestureRef.current.distance){const dx=pts[0].x-pts[1].x,dy=pts[0].y-pts[1].y;setZoomScale(Math.min(3,Math.max(1,zoomGestureRef.current.scale*Math.hypot(dx,dy)/zoomGestureRef.current.distance)));}else if(pts.length===1&&zoomScale>1){setZoomOffset({x:Math.max(-260,Math.min(260,zoomGestureRef.current.x+e.clientX-zoomGestureRef.current.startX)),y:Math.max(-300,Math.min(300,zoomGestureRef.current.y+e.clientY-zoomGestureRef.current.startY))});}}}
        onPointerUp={e=>{zoomPointersRef.current.delete(e.pointerId);if(zoomPointersRef.current.size===1){const p=[...zoomPointersRef.current.values()][0];zoomGestureRef.current={...zoomGestureRef.current,startX:p.x,startY:p.y,x:zoomOffset.x,y:zoomOffset.y,distance:0};}else zoomGestureRef.current.distance=0;}}
        onPointerCancel={e=>{zoomPointersRef.current.delete(e.pointerId);zoomGestureRef.current.distance=0;}}>
        <img className="ref-product-zoom-image" src={selectedProduct.image_url||tiles.find(t=>t.name===selectedProduct.category)?.image||tiles[0].image} alt={selectedProduct.name} draggable="false" style={{transform: `translate3d(${zoomOffset.x}px,${zoomOffset.y}px,0) scale(${zoomScale})`}} onWheel={e=>{e.preventDefault();setZoomScale(v=>Math.min(3,Math.max(1,v+(e.deltaY<0?.2:-.2))));}} onDoubleClick={()=>{setZoomScale(v=>v>1?1:2);if(zoomScale>1)setZoomOffset({x:0,y:0});}}/>
      </div>
      <p className="ref-zoom-hint">برای جزئیات، دو انگشت را باز کنید · برای حرکت روی عکس، آن را بکشید</p>
    </div>}

    {cartToast&&<div className="ref-cart-toast" role="status"><span className="ref-cart-toast-check">✓</span><span>{cartToast}</span><button onClick={()=>setCartOpen(true)}>مشاهده سبد</button><button aria-label="بستن پیام" onClick={()=>setCartToast('')}>×</button></div>}

    {orderResult&&<div className="ref-overlay">
      <section className="ref-dialog text-center">
        <div className="ref-dialog-head"><span className="eyebrow text-gold-deep">MAHGOLD ORDER</span><button className="ref-close" aria-label="بستن" onClick={()=>setOrderResult(null)}><X/></button></div>
        <PackageCheck size={46} className="mx-auto text-gold-deep"/>
        <h2 className="my-4 text-xl font-semibold">درخواست سفارش ثبت شد</h2>
        <p className="mb-2 text-sm">شماره سفارش: <b>{money(orderResult.order_number)}</b></p>
        <p className="mb-6 text-sm">مبلغ: <b>{money(orderResult.total_toman)} تومان</b></p>
        <button className="h-11 rounded-lg bg-gold-gradient text-sm font-bold text-ink ref-full" onClick={()=>setOrderResult(null)}>متوجه شدم</button>
      </section>
    </div>}
  </div>;
}
