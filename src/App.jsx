import { MAHGOLD_LOGO } from './mahgold-brand';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search, ShoppingBag, Menu, X, ArrowLeft, ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
  ShieldCheck, Gift, Headphones, Plus, Minus, UserRound, LogOut,
  House, LayoutGrid, Phone, MapPin, PackageCheck
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import AdminPanel from './Admin.jsx';

const forceAdminPreview = import.meta.env.VITE_ADMIN_PREVIEW === 'true';
const BASE = 'https://growth-and-advancement-garden.lovable.app/assets/';
const slides = [
  {
    eyebrow: 'MAHGOLD · FINE JEWELRY',
    title: 'درخششِ طلا، امضایِ استایلِ شما',
    description: 'زیبایی در سادگی‌ست؛ انتخاب‌هایی ظریف و ماندگار برای لحظه‌هایی که ارزش، معنا پیدا می‌کند.',
    button: 'کشف مجموعه مه‌گلد',
    image: BASE + 'slide-necklace-Bn1Ooa9V.jpg',
    category: 'طلای زینتی'
  },
  {
    eyebrow: 'A GIFT TO REMEMBER',
    title: 'هدیه‌ای که همیشه می‌ماند',
    description: 'انگشترها و زیورآلات منتخب، با بسته‌بندی ویژه مه‌گلد.',
    button: 'مشاهده طلای زینتی',
    image: BASE + 'slide-gift-CrjacK5c.jpg',
    category: 'طلای زینتی'
  },
  {
    eyebrow: 'INVEST IN GOLD',
    title: 'سکه و شمش، انتخابی مطمئن',
    description: 'سرمایه‌ای آشنا با خلوص و ارزش ماندگار.',
    button: 'مشاهده سکه و شمش',
    image: BASE + 'slide-invest-CIEhMTDg.jpg',
    category: 'سکه'
  }
];
const tiles = [
  {name:'طلای زینتی',desc:'زیورآلات برای هر روز و هر occasion',image:BASE+'jewelry-CwLx7kUY.jpg'},
  {name:'طلای آب‌شده',desc:'انتخابی برای نگاه سرمایه‌ای',image:BASE+'melted-nOWRYhbE.jpg'},
  {name:'سکه',desc:'ارزش آشنا، انتخاب مطمئن',image:BASE+'coin-CsyrnHPB.jpg'},
  {name:'شمش',desc:'خلوص در ساده‌ترین شکل',image:BASE+'bar-B0yyIRPP.jpg'}
];
const displayTileDefaults = tiles;
const presetCategories = [
  'همه محصولات','طلای زینتی','طلای آب‌شده','سکه','شمش','انگشتر','گردنبند',
  'دستبند','النگو','گوشواره','آویز و پلاک','زنجیر','پابند','سرویس طلا','سایر زیورآلات'
];
const jewelryProductCategories = new Set(['طلای زینتی','انگشتر','گردنبند','دستبند','النگو','گوشواره','آویز و پلاک','زنجیر','پابند','سرویس طلا','سایر زیورآلات']);
const hiddenProductAttributeKeys = new Set(['has_stone','stone_labor_percent','market_quote_symbol','parent_product_id','variant_model_name','variant_size','variant_sku']);
const storyImage = 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1200&q=85';
const money = value => new Intl.NumberFormat('fa-IR').format(Number(value || 0));
const gram = value => new Intl.NumberFormat('fa-IR',{maximumFractionDigits:3}).format(Number(value || 0)) + ' گرم';
const toLatinDigits = value => value.replace(/[۰-۹٠-٩]/g, d => {
  const fa='۰۱۲۳۴۵۶۷۸۹', ar='٠١٢٣٤٥٦٧٨٩';
  return String(fa.indexOf(d)>=0 ? fa.indexOf(d) : ar.indexOf(d));
});

function ProductImage({product, className='', onClick}) {
  const [failed,setFailed] = useState(false);
  const src = !failed && product.image_url ? product.image_url : tiles.find(t=>t.name===product.category)?.image || tiles[0].image;
  return <div className={'ref-product-image ' + className} onClick={onClick} role={onClick?'button':undefined} tabIndex={onClick?0:undefined} onKeyDown={onClick?(e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onClick();}}):undefined}>
    <img src={src} alt={product.name || 'محصول مه‌گلد'} loading="lazy" onError={()=>setFailed(true)}/>
  </div>;
}


function ProductDetailImage({product,onClick}) {
  const [failed,setFailed]=useState(false);
  const [lens,setLens]=useState(null);
  const imageBox=useRef(null);
  const touchGesture=useRef(false);
  const src=!failed&&product.image_url?product.image_url:tiles.find(t=>t.name===product.category)?.image||tiles[0].image;
  const updateLens=event=>{
    const touch=event.touches?.[0];
    const box=imageBox.current;
    if(!touch||!box)return;
    const rect=box.getBoundingClientRect();
    const x=Math.max(0,Math.min(rect.width,touch.clientX-rect.left));
    const y=Math.max(0,Math.min(rect.height,touch.clientY-rect.top));
    setLens({x,y,px:rect.width?x/rect.width*100:50,py:rect.height?y/rect.height*100:50,width:rect.width,height:rect.height});
  };
  const startTouch=event=>{touchGesture.current=true;updateLens(event);};
  const endTouch=()=>{setLens(null);window.setTimeout(()=>{touchGesture.current=false;},450);};
  const handleClick=()=>{if(touchGesture.current)return;onClick?.();};
  const lensLeft=lens?Math.max(8,Math.min(lens.width-158,lens.x-79)):0;
  const lensTop=lens?Math.max(8,lens.y-184):0;
  return <div ref={imageBox} className="ref-product-image ref-product-page-image ref-product-touch-image" onClick={handleClick} onTouchStart={startTouch} onTouchMove={updateLens} onTouchEnd={endTouch} onTouchCancel={endTouch} role="button" tabIndex={0} aria-label="برای مشاهده جزئیات تصویر، انگشت را روی آن حرکت دهید" onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onClick?.();}}}>
    <img src={src} alt={product.name||'محصول مه‌گلد'} onError={()=>setFailed(true)} draggable="false"/>
    <span className="ref-product-touch-hint">با حرکت انگشت، جزئیات طلا را بزرگ‌نمایی کنید</span>
    {lens&&<span className="ref-product-touch-lens" style={{left:lensLeft,top:lensTop,backgroundImage:`url("${src}")`,backgroundPosition:`${lens.px}% ${lens.py}%`}} aria-hidden="true"/>}
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
  const [category,setCategory]=useState('همه محصولات');
  const [query,setQuery]=useState('');
  const [sortMode,setSortMode]=useState('newest');
  const [cart,setCart]=useState(()=>{try{return JSON.parse(localStorage.getItem('mahgold_cart')||'[]');}catch{return [];}});
  const [cartOpen,setCartOpen]=useState(false);
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
  const [cartToast,setCartToast]=useState('');
  const [customer,setCustomer]=useState({name:'',phone:'',email:'',address:'',city:'',postalCode:'',note:''});
  const [menuOpen,setMenuOpen]=useState(false);
  const [activeSlide,setActiveSlide]=useState(0);
  const [products,setProducts]=useState([]);
  const [dbCategories,setDbCategories]=useState([]);
  const [quote,setQuote]=useState(null);
  const [clockNow,setClockNow]=useState(()=>Date.now());
  const [siteContent,setSiteContent]=useState(null);
  const [dataStatus,setDataStatus]=useState(isSupabaseConfigured?'loading':'error');
  const [dataMessage,setDataMessage]=useState('در حال دریافت اطلاعات فروشگاه…');
  const [isAdminPage,setIsAdminPage]=useState(()=>forceAdminPreview||window.location.pathname==='/admin'||window.location.pathname==='/admin/'||window.location.hash==='#mahgold-control');

  const displaySlides=useMemo(()=>{const rows=(siteContent?.slides||[]).filter(s=>s&&s.active!==false&&s.image&&s.title);return rows.length?rows:slides;},[siteContent]);
  const displayTiles=useMemo(()=>displayTileDefaults.map(tile=>({...tile,...((siteContent?.tiles||[]).find(item=>item.name===tile.name)||{})})),[siteContent]);
  useEffect(()=>{setActiveSlide(index=>Math.min(index,displaySlides.length-1));},[displaySlides.length]);
  useEffect(()=>{const timer=setInterval(()=>setClockNow(Date.now()),15000);return()=>clearInterval(timer);},[]);
  useEffect(()=>{
    if(!supabase)return;
    let active=true;
    const refreshGoldQuote=async()=>{
      const {data,error}=await supabase.from('market_quotes').select('symbol,title,price_toman,source,observed_at,is_live')
        .eq('symbol','gold_18k').order('observed_at',{ascending:false}).limit(1).maybeSingle();
      if(active&&!error)setQuote(data||null);
    };
    const timer=setInterval(refreshGoldQuote,60000);
    return()=>{active=false;clearInterval(timer);};
  },[]);
  useEffect(()=>{const timer=setInterval(()=>setActiveSlide(n=>(n+1)%displaySlides.length),6000);return()=>clearInterval(timer);},[displaySlides.length]);
  useEffect(()=>{if(!supabase)return;let active=true;supabase.from('site_content').select('content').eq('id',1).maybeSingle().then(({data})=>{if(active&&data?.content)setSiteContent(data.content);});return()=>{active=false;};},[]);
  useEffect(()=>{
    const syncAdminRoute=()=>{
      if(forceAdminPreview){setIsAdminPage(true);return;}
      setIsAdminPage(
      window.location.pathname==='/admin'||
      window.location.pathname==='/admin/'||
      window.location.hash==='#mahgold-control'
    );
    };
    window.addEventListener('hashchange',syncAdminRoute);
    window.addEventListener('popstate',syncAdminRoute);
    syncAdminRoute();
    return()=>{
      window.removeEventListener('hashchange',syncAdminRoute);
      window.removeEventListener('popstate',syncAdminRoute);
    };
  },[]);
  useEffect(()=>{
    if(!supabase){setDataStatus('error');setDataMessage('اتصال فروشگاه پیکربندی نشده است.');return;}
    let active=true;
    (async()=>{
      try{
        const [productResult,categoryResult,quoteResult]=await Promise.all([
          supabase.from('products').select('id,name,category,description,image_url,weight_grams,karat,price_toman,stock,is_active,created_at,tag,pricing_mode,attributes')
            .eq('is_active',true).order('created_at',{ascending:false}),
          supabase.from('categories').select('id,name,slug,sort_order,is_active')
            .eq('is_active',true).order('sort_order',{ascending:true}),
          supabase.from('market_quotes').select('symbol,title,price_toman,source,observed_at,is_live')
            .eq('symbol','gold_18k').order('observed_at',{ascending:false}).limit(1).maybeSingle()
        ]);
        if(!active)return;
        if(productResult.error){setDataStatus('error');setProducts([]);setDataMessage('دریافت محصولات ناموفق بود؛ برای جلوگیری از نمایش قیمت نادرست، اطلاعات نمونه نمایش داده نمی‌شود.');}
        else{
          const rows=productResult.data||[];
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
  useEffect(()=>{const syncProductRoute=()=>{const match=window.location.pathname.match(/^\/product\/([^/]+)\/?$/);if(!match){setSelectedProduct(null);return;}const product=products.find(p=>p.id===decodeURIComponent(match[1]));if(product)setSelectedProduct(product);};syncProductRoute();window.addEventListener('popstate',syncProductRoute);return()=>window.removeEventListener('popstate',syncProductRoute);},[products]);
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
      (category==='همه محصولات'||(category==='طلای زینتی'?jewelryProductCategories.has(p.category):p.category===category)||p.name?.includes(category))&&
      (!query.trim()||p.name?.toLocaleLowerCase('fa').includes(query.trim().toLocaleLowerCase('fa')))
    );
    return rows.sort((a,b)=>{
      if(sortMode==='cheap')return Number(a.price_toman||0)-Number(b.price_toman||0);
      if(sortMode==='expensive')return Number(b.price_toman||0)-Number(a.price_toman||0);
      return new Date(b.created_at||0)-new Date(a.created_at||0);
    });
  },[products,category,query,sortMode]);
  const cartCount=cart.reduce((sum,item)=>sum+Number(item.qty||0),0);
  const cartTotal=cart.reduce((sum,item)=>sum+Number(item.price_toman||0)*Number(item.qty||0),0);
  const quoteObservedAt=quote?.observed_at?Date.parse(quote.observed_at):NaN;
  const quoteIsManual=quote?.source==='manual'&&quote?.is_live===false;
  const quoteFresh=(quote?.is_live===true||quoteIsManual)&&Number.isFinite(quoteObservedAt)&&quoteObservedAt<=clockNow+60000&&clockNow-quoteObservedAt<=300000;

  const openProduct=product=>{setSelectedProduct(product);window.history.pushState({mahgoldProduct:true},'', '/product/'+encodeURIComponent(product.id));window.scrollTo({top:0,behavior:'auto'});};
  const closeProduct=()=>{setSelectedProduct(null);if(window.location.pathname.startsWith('/product/'))window.history.pushState({},'', '/');};
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
  if(isAdminPage)return <AdminPanel/>;

  return <div dir="rtl" className="min-h-screen bg-background text-foreground">
    {siteContent?.announcement?.active!==false&&<div className="ref-announcement">{siteContent?.announcement?.text||"ارسال امن و بسته‌بندی ویژه ✦ پشتیبانی مه‌گلد ✦ همراه انتخاب شما"}</div>}
    <div className="ref-brand-masthead" aria-label="مه‌گلد"><img src="/mahgold-brand-masthead.jpg" alt="مه‌گلد؛ نشان هلال و الماس طلایی روی مخمل سبز زمردی" fetchPriority="high"/></div>

    <header className="ref-site-header sticky top-0 z-40">
      <div className="ref-main-header mx-auto max-w-[1440px] px-4 md:px-6">
        <button aria-label="منو" className="ref-mobile-menu md:hidden" onClick={()=>setMenuOpen(v=>!v)}><Menu size={20}/></button>
        <a aria-label="مه‌گلد - صفحه اصلی" className="ref-brand" href="#home">
          <img src={siteContent?.logo_url||MAHGOLD_LOGO} alt="لوگوی مه‌گلد"/>
          <span>مه‌گلد</span>
        </a>
        <nav className="ref-primary-nav">
          <a className="active" href="#home">خانه</a>
          <button type="button" onClick={()=>setAccountOpen(true)}>پیگیری سفارش</button>
          <a href="#categories" onClick={()=>setCategory('طلای زینتی')}>طلای زینتی</a>
          <a href="#categories" onClick={()=>setCategory('طلای آب‌شده')}>طلای آب‌شده</a>
          <a href="#categories" onClick={()=>setCategory('سکه')}>سکه</a>
          <a href="#categories" onClick={()=>setCategory('شمش')}>شمش</a>
        </nav>
        <label className="ref-header-search"><Search size={16}/><input aria-label="جستجوی محصولات" value={query} onChange={e=>setQuery(e.target.value)} placeholder="جستجو در محصولات..."/></label>
        <div className="ref-header-actions">
          <button aria-label="حساب کاربری" onClick={()=>setAccountOpen(true)}><UserRound size={20}/></button>
          <button aria-label="سبد خرید" className="ref-header-cart" onClick={()=>setCartOpen(true)}><ShoppingBag size={20}/>{cartCount>0&&<b>{money(cartCount)}</b>}</button>
        </div>
      </div>
      {menuOpen&&<nav className="ref-mobile-links flex flex-col gap-4 border-t border-border bg-background px-5 py-4 text-sm text-muted-foreground md:hidden">
        <a href="#categories" onClick={()=>setMenuOpen(false)}>دسته‌بندی‌ها</a><a href="#shop" onClick={()=>setMenuOpen(false)}>فروشگاه</a><a href="#story" onClick={()=>setMenuOpen(false)}>درباره مه‌گلد</a><button className="text-right" onClick={()=>{setAccountOpen(true);setMenuOpen(false);}}>پیگیری سفارش</button>
        <button className="text-right" onClick={()=>{setAccountOpen(true);setMenuOpen(false);}}>ورود / ثبت‌نام</button>
      </nav>}
    </header>

    <main className="min-h-[60vh]" id="home">
      <section aria-label="اسلایدهای مه‌گلد" aria-roledescription="carousel" className="ref-hero relative h-[330px] overflow-hidden bg-ink text-ink-foreground md:h-[390px]">
        {displaySlides.map((slide,index)=><div key={slide.image} aria-hidden={activeSlide!==index} className={'absolute inset-0 transition-opacity duration-1000 '+(activeSlide===index?'z-10 opacity-100':'pointer-events-none z-0 opacity-0')}>
          <img alt={slide.title} className="h-full w-full object-cover transition-transform duration-[7000ms] ease-out" src={slide.image} loading={index===0?'eager':'lazy'} style={{transform:activeSlide===index?'scale(1.05)':'scale(1)'}}/>
          <div className="slide-shade absolute inset-0"/>
          <div className="ref-hero-copy absolute inset-0 mx-auto flex max-w-7xl flex-col justify-center px-6 py-8 md:px-10">
            <div className="max-w-[560px] text-right">
              <div className="eyebrow animate-rise text-gold-light">{slide.eyebrow||'MAHGOLD'}</div>
              <h1 className="animate-rise mt-3 text-[2.1rem] font-medium leading-[1.45] [animation-delay:120ms] md:text-6xl md:leading-[1.4]">{slide.title}</h1>
              <p className="animate-rise mt-4 max-w-md text-sm leading-8 text-ink-muted [animation-delay:240ms] md:text-[15px]">{slide.description||''}</p>
              <button className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-gold-gradient px-7 text-sm font-bold text-ink shadow-gold transition-all hover:-translate-y-0.5 hover:brightness-110" onClick={()=>{setCategory(slide.category);document.getElementById('shop')?.scrollIntoView({behavior:'smooth'});}}>
                {slide.button||'مشاهده محصولات'}<ArrowLeft size={16}/>
              </button>
            </div>
          </div>
        </div>)}
        <div className="absolute inset-x-0 bottom-7 z-20 flex justify-center gap-2">
          {displaySlides.map((slide,index)=><button key={slide.image} aria-label={'اسلاید '+(index+1)} aria-current={activeSlide===index} className={'relative h-1.5 overflow-hidden rounded-full bg-ink-foreground/30 transition-all duration-500 '+(activeSlide===index?'w-10':'w-4 hover:bg-ink-foreground/60')} onClick={()=>setActiveSlide(index)}>
            {activeSlide===index&&<span className="absolute inset-y-0 right-0 bg-gold" style={{width:'100%'}}/>}
          </button>)}
        </div>
        <div className="absolute bottom-6 left-8 z-20 hidden gap-2 md:flex">
          <button aria-label="اسلاید قبلی" className="flex size-11 items-center justify-center rounded-full border border-ink-foreground/30 bg-ink/30 backdrop-blur transition hover:border-gold hover:text-gold-light" onClick={()=>setActiveSlide(i=>(i+displaySlides.length-1)%displaySlides.length)}><ChevronRight size={18}/></button>
          <button aria-label="اسلاید بعدی" className="flex size-11 items-center justify-center rounded-full border border-ink-foreground/30 bg-ink/30 backdrop-blur transition hover:border-gold hover:text-gold-light" onClick={()=>setActiveSlide(i=>(i+1)%displaySlides.length)}><ChevronLeft size={18}/></button>
        </div>
      </section>

                <div className="ref-quote-strip">
          <div className="ref-quote-title"><span className="ref-quote-bars">▥</span><div><b>قیمت لحظه‌ای طلای ۱۸ عیار</b><small>{quoteFresh?(quoteIsManual?'نرخ دستی معتبر':'به‌روزرسانی لحظه‌ای'):quoteIsManual?'نرخ دستی منقضی‌شده':quote?.is_live?'نرخ قدیمی · قیمت‌گذاری خودکار متوقف':'در انتظار نرخ معتبر'}</small></div></div>
          <strong>{quote?money(quote.price_toman)+' تومان':'— تومان'}</strong>
          <span className="ref-quote-live"><i/> {quoteFresh?'نرخ معتبر':'بدون نرخ تازه'}</span>
        </div>

      <section className="mx-auto max-w-7xl scroll-mt-20 px-4 py-5 md:px-7 md:py-6" id="categories">
        <div className="mb-8 flex items-end justify-between gap-5">
          <div><div className="eyebrow text-gold-deep">DISCOVER MAHGOLD</div><h2 className="mt-3 text-2xl font-semibold md:text-3xl">از میان مجموعه‌ها انتخاب کنید</h2></div>
          <p className="hidden text-xs text-muted-foreground md:block">جزئیاتی برای سلیقه‌های خاص</p>
        </div>
        <div className="ref-category-grid">
          {displayTiles.map(tile=><button key={tile.name} className="ref-category-card" onClick={()=>{setCategory(tile.name);document.getElementById('shop')?.scrollIntoView({behavior:'smooth'});}}>
            <img src={tile.image} alt={tile.name} loading="lazy"/><span className="ref-category-shade"/>
            <span className="ref-category-text"><b>{tile.name}</b><small>{tile.desc}</small><em>مشاهده <ArrowLeft size={12}/></em></span>
          </button>)}
        </div>
        <div className="ref-service-grid">
          <article className="ref-service-card"><ShieldCheck/><div><b>اصالت و شفافیت</b><small>اطلاعات روشن برای انتخاب آگاهانه</small></div></article>
          <article className="ref-service-card"><Gift/><div><b>بسته‌بندی ویژه</b><small>تجربه‌ای شایسته هدیه دادن</small></div></article>
          <article className="ref-service-card"><Headphones/><div><b>همراهی تا انتخاب</b><small>پشتیبانی در مسیر خرید</small></div></article>
        </div>
      </section>

      <section className="ref-shop-section scroll-mt-16 py-5 md:py-7" id="shop">
        <div className="mx-auto max-w-7xl px-4 md:px-7">
        <div className="ref-shop-heading"><span className="eyebrow text-gold-deep">THE CURATED EDIT</span><h2 className="mt-1 text-xl font-semibold md:text-2xl">منتخب‌های مه‌گلد</h2></div>
        <div className="ref-shop-tools">
            <label className="flex h-10 w-full items-center gap-2 rounded-full border border-border bg-card px-4 text-muted-foreground md:w-72">
              <Search size={16}/><input aria-label="جست‌وجوی محصول" className="w-full bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground" value={query} onChange={e=>setQuery(e.target.value)} placeholder="نام محصول را جستجو کنید..."/>
            </label>
          </div>
          <div className="mb-7 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map(item=><button key={item} className={'shrink-0 rounded-full border px-4 py-2 text-xs font-medium transition-all '+(category===item?'border-ink bg-ink text-ink-foreground shadow-soft':'border-input bg-card text-muted-foreground hover:border-gold hover:text-gold-deep')} onClick={()=>setCategory(item)}>{item}</button>)}
            </div>
            <label className="ref-sort shrink-0"><span>مرتب‌سازی</span><select aria-label="مرتب‌سازی" value={sortMode} onChange={e=>setSortMode(e.target.value)}>
              <option value="newest">جدیدترین</option><option value="cheap">ارزان‌ترین</option><option value="expensive">گران‌ترین</option>
            </select></label>
          </div>
          <div className="ref-product-grid">
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
          </div>
          {dataStatus==='loading'&&<div className="ref-state">در حال دریافت محصولات مه‌گلد…</div>}
          {dataStatus==='error'&&<div className="ref-state">{dataMessage}</div>}
          {dataStatus==='connected'&&filtered.length===0&&<div className="ref-state">محصولی با این مشخصات پیدا نشد.</div>}
          <p className="ref-shop-note">{dataStatus==='connected'?'قیمت‌ها و موجودی بر اساس آخرین اطلاعات فروشگاه مه‌گلد نمایش داده می‌شوند.':'قیمت‌ها و موجودی پس از برقراری اتصال نمایش داده می‌شوند.'}</p>
        </div>
      </section>

      <section className="grid scroll-mt-16 bg-ink text-ink-foreground md:min-h-[440px] md:grid-cols-2" id="story">
        <div className="h-64 overflow-hidden md:h-auto"><img alt="جزئیات زیورآلات مه‌گلد" className="h-full w-full object-cover" loading="lazy" src={siteContent?.story_image||storyImage}/></div>
        <div className="flex flex-col justify-center px-6 py-14 md:px-[10%]">
          <div className="eyebrow text-gold-light">A Story of Elegance</div>
          <h2 className="mt-3 text-3xl font-normal leading-[1.5] md:text-4xl">زیبایی‌ای که<br/>از مد عبور می‌کند.</h2>
          <p className="mt-4 max-w-md text-sm leading-8 text-ink-muted">در مه‌گلد، هر انتخاب فرصتی‌ست برای بیان سلیقه شخصی. ما به طراحی ماندگار، جزئیات دقیق و تجربه‌ای ساده و دلنشین باور داریم.</p>
          <div><button className="mt-8 h-12 rounded-lg bg-gold-gradient px-7 text-sm font-bold text-ink shadow-gold transition-all hover:-translate-y-0.5 hover:brightness-110" onClick={()=>document.getElementById('shop')?.scrollIntoView({behavior:'smooth'})}>مشاهده محصولات</button></div>
        </div>
      </section>
    </main>

    <footer className="bg-ink px-6 pb-28 pt-14 text-center text-xs leading-8 text-ink-muted md:pb-14">
      <div className="ref-footer-brand"><img alt="نشان اصلی مه‌گلد؛ هلال و الماس طلایی" loading="lazy" src="/mahgold-brand-masthead.jpg"/></div>
      <div>طلایی به زیباییِ لحظه‌های تو</div>
      <div className="mt-3 flex flex-col items-center gap-1 md:flex-row md:justify-center md:gap-6">
        <span className="inline-flex items-center gap-1.5"><Phone className="size-3.5 text-gold"/> شماره تماس: به‌زودی</span>
        <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5 text-gold"/> نشانی: به‌زودی اعلام می‌شود</span>
      </div>
      <div className="mt-3 text-[11px] opacity-60">© ۱۴۰۵ فروشگاه آنلاین مه‌گلد · زیورآلات طلا</div>
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
              <div><h4>{item.name}</h4><strong>{money(item.price_toman)} تومان</strong><div className="ref-qty">
                <button aria-label="کاهش تعداد" onClick={()=>changeQuantity(item.id,-1)}><Minus size={13}/></button><span className="text-xs">{money(item.qty)}</span><button aria-label="افزایش تعداد" onClick={()=>changeQuantity(item.id,1)}><Plus size={13}/></button>
              </div></div>
              <button className="ref-remove" aria-label="حذف محصول" onClick={()=>setCart(old=>old.filter(p=>p.id!==item.id))}><X size={15}/></button>
            </div>)}</div>
            <div className="ref-cart-summary"><span>جمع سبد خرید</span><b>{money(cartTotal)} تومان</b></div>
            <p className="mb-4 text-[11px] leading-7 text-muted-foreground">مبلغ نهایی و موجودی هنگام ثبت سفارش در سرور دوباره بررسی می‌شود.</p>
            <button className="h-12 rounded-lg bg-gold-gradient text-sm font-bold text-ink ref-full" onClick={async()=>{const {data}=await supabase.auth.getSession();if(!data.session?.user){setAccountNotice('برای ثبت سفارش ابتدا حساب کاربری بسازید یا وارد شوید.');setAccountOpen(true);setCartOpen(false);}else setCheckoutOpen(true);}}>ادامه و ثبت سفارش <ArrowLeft className="mr-2 inline" size={16}/></button>
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
        <ProductDetailImage product={selectedProduct} onClick={()=>{setZoomScale(1);setZoomOpen(true);}}/>
        <div className="ref-product-page-copy">
          <div className="ref-product-detail-heading">
            <span className="ref-product-detail-kicker">MAHGOLD · SELECTED PIECE</span>
            <span className="ref-product-detail-category">{selectedProduct.category}</span>
          </div>
          <h1>{selectedProduct.name}</h1>
          <p>{selectedProduct.description||'جزئیاتی ظریف و انتخابی ماندگار از مجموعه مه‌گلد.'}</p>
          <div className="ref-product-specs-wrap">
            <h2 className="ref-product-specs-title">مشخصات محصول</h2>
            <div className="ref-product-specs">
              <div><span>وزن</span><b>{gram(selectedProduct.weight_grams)}</b></div>
              <div><span>عیار</span><b>{money(selectedProduct.karat||18)}</b></div>
              <div><span>موجودی</span><b>{money(selectedProduct.stock||0)} عدد</b></div>
              {Object.entries(selectedProduct.attributes||{}).filter(([key,value])=>!hiddenProductAttributeKeys.has(String(key).trim())&&String(key).trim()&&String(value??'').trim()).map(([key,value])=><div key={key}><span>{String(key).trim()}</span><b>{Array.isArray(value)?value.filter(Boolean).join('، '):typeof value==='object'?Object.entries(value).map(([k,v])=>k+': '+v).join(' · '):String(value)}</b></div>)}
            </div>
          </div>
          <strong className="ref-product-page-price">{money(selectedProduct.price_toman)} <small>تومان</small></strong>
          <button className="h-12 rounded-lg bg-gold-gradient text-sm font-bold text-ink ref-full" disabled={Number(selectedProduct.stock||0)<1||(selectedProduct.pricing_mode==='auto'&&!quoteFresh)} onClick={()=>addToCart(selectedProduct)}>افزودن به سبد خرید <ShoppingBag className="mr-2 inline" size={16}/></button>
          {checkoutError&&<p className="ref-message">{checkoutError}</p>}
        </div>
      </div>
    </div>}

    {zoomOpen&&selectedProduct&&<div className="ref-product-zoom" role="dialog" aria-modal="true" aria-label="نمایش بزرگ تصویر محصول" onClick={()=>setZoomOpen(false)}><button className="ref-product-zoom-close" aria-label="بستن بزرگ‌نمایی" onClick={()=>setZoomOpen(false)}><X/></button><div className="ref-product-zoom-tools" onClick={e=>e.stopPropagation()}><button aria-label="کوچک‌نمایی" onClick={()=>setZoomScale(v=>Math.max(1,v-.25))}><ZoomOut/></button><span>{Math.round(zoomScale*100)}٪</span><button aria-label="بزرگ‌نمایی" onClick={()=>setZoomScale(v=>Math.min(3,v+.25))}><ZoomIn/></button></div><div className="ref-product-zoom-stage" onClick={e=>e.stopPropagation()}><ProductImage product={selectedProduct} className="ref-product-zoom-image"/><img src={selectedProduct.image_url||tiles.find(t=>t.name===selectedProduct.category)?.image||tiles[0].image} alt={selectedProduct.name} style={{transform:`scale(${zoomScale})`}}/></div></div>}

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
