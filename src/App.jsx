import { MAHGOLD_LOGO } from './mahgold-brand';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search, ShoppingBag, Menu, X, ArrowLeft, ChevronLeft, ChevronRight, ChevronDown,
  ShieldCheck, Clock3, Gift, Headphones, Plus, Minus, UserRound, LogOut,
  House, LayoutGrid, Phone, MapPin, PackageCheck
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import AdminPanel, { AdminErrorBoundary } from './Admin.jsx';

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
const storyImage = 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1200&q=85';
const money = value => new Intl.NumberFormat('fa-IR').format(Math.round(Number(value || 0)));
const isJewelryCategory = category => ['طلای زینتی','انگشتر','گردنبند','دستبند','النگو','گوشواره','آویز و پلاک','زنجیر','پابند','سرویس طلا','سایر زیورآلات'].includes(category);
const priceBreakdown = (p,q) => {const base=Number(p.weight_grams||0)*Number(q?.price_toman||0)*(Number(p.karat||18)/18);const mode=p.labor_mode||'percent',v=Number(p.labor_value||0);const labor=mode==='per_gram'?Number(p.weight_grams||0)*v:mode==='fixed'?v:base*v/100;const profit=(base+labor)*Number(p.seller_profit_percent??7)/100;const commission=(base+labor+profit)*Number(p.commission_percent||0)/100;const tax=(labor+profit+commission)*0.10;return {base,labor,profit,commission,tax,total:Math.round(base+labor+profit+commission+tax)};};
const isFreshLiveQuote = q => {const t=q?.observed_at?Date.parse(q.observed_at):NaN;return q?.is_live===true&&Number.isFinite(t)&&Date.now()-t<=5*60*1000&&t<=Date.now()+60*1000&&Number(q?.price_toman)>0;};
const gram = value => new Intl.NumberFormat('fa-IR',{maximumFractionDigits:3}).format(Number(value || 0)) + ' گرم';
const toLatinDigits = value => value.replace(/[۰-۹٠-٩]/g, d => {
  const fa='۰۱۲۳۴۵۶۷۸۹', ar='٠١٢٣٤٥٦٧٨٩';
  return String(fa.indexOf(d)>=0 ? fa.indexOf(d) : ar.indexOf(d));
});


function getProductSpecRows(product){
  const category=String(product?.category||'').toLowerCase();
  const name=String(product?.name||'').toLowerCase();
  const has=(...terms)=>terms.some(term=>category.includes(term)||name.includes(term));
  const rows=[];
  if(has('انگشتر')) rows.push(['نوع محصول','انگشتر']);
  else if(has('گردنبند')) rows.push(['نوع محصول','گردنبند']);
  else if(has('دستبند')) rows.push(['نوع محصول','دستبند']);
  else if(has('النگو')) rows.push(['نوع محصول','النگو']);
  else if(has('گوشواره')) rows.push(['نوع محصول','گوشواره']);
  else if(has('زنجیر')) rows.push(['نوع محصول','زنجیر']);
  else if(has('پابند')) rows.push(['نوع محصول','پابند']);
  else if(has('سرویس')) rows.push(['نوع محصول','سرویس طلا']);
  else if(has('سکه')) rows.push(['نوع محصول','سکه']);
  else if(has('شمش')) rows.push(['نوع محصول','شمش']);
  else if(has('آب‌شده','آبشده')) rows.push(['نوع محصول','طلای آب‌شده']);
  if(Number(product?.weight_grams)>0) rows.push([has('سکه')?'وزن سکه':'وزن',gram(product.weight_grams)]);
  if(Number(product?.karat)>0) rows.push([has('سکه')?'عیار سکه':'عیار',money(product.karat)]);
  if(product?.tag?.trim()) rows.push(['ویژگی',product.tag.trim()]);
  if(product?.attributes&&typeof product.attributes==='object'&&!Array.isArray(product.attributes)){
    const privateKeys=new Set(['variant_sku','parent_product_id','variant_model_name','internal_sku','admin_note']);
    const labels={ring_size:'سایز انگشتر',variant_size:'سایز',chain_length:'طول زنجیر',bracelet_length:'طول دستبند',lock_type:'نوع قفل',stone_type:'نوع سنگ',stone_weight:'وزن سنگ',model:'مدل',finish:'نوع پرداخت',color:'رنگ',certificate:'گواهی'};
    Object.entries(product.attributes).forEach(([label,value])=>{
      const key=String(label||'').trim();
      const val=typeof value==='string'||typeof value==='number'?String(value).trim():'';
      if(key&&val&&!privateKeys.has(key))rows.push([labels[key]||key.replaceAll('_',' '),val]);
    });
  }
  if(Number(product?.stock)>=0) rows.push(['وضعیت موجودی',Number(product.stock)>0?'موجود':'ناموجود']);
  return rows;
}

function ProductImage({product, className=''}) {
  const [failed,setFailed] = useState(false);
  const primarySrc = product.image_url || '';
  const fallbackSrc = tiles.find(t=>t.name===product.category)?.image || tiles[0].image;
  useEffect(()=>setFailed(false),[product.id,primarySrc]);
  const src = !failed && primarySrc ? primarySrc : fallbackSrc;
  return <div className={'ref-product-image ' + className}>
    <img src={src} alt={product.name || 'محصول مه‌گلد'} loading="lazy" decoding="async" onError={()=>setFailed(true)}/>
  </div>;
}

function AccountContent({onClose}) {
  const [session,setSession]=useState(null);
  const [mode,setMode]=useState('login');
  const [name,setName]=useState('');
  const [phone,setPhone]=useState('');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  const [orders,setOrders]=useState([]);

  useEffect(()=>{
    if(!supabase)return;
    supabase.auth.getSession().then(({data})=>setSession(data.session));
    const {data:listener}=supabase.auth.onAuthStateChange((_event,next)=>setSession(next));
    return ()=>listener.subscription.unsubscribe();
  },[]);

  useEffect(()=>{
    if(!supabase || !session?.user?.id){setOrders([]);return;}
    let active=true;
    supabase.from('orders').select('id,order_number,status,total_toman,created_at')
      .eq('customer_id',session.user.id).order('created_at',{ascending:false}).limit(5)
      .then(({data})=>{if(active)setOrders(data||[]);});
    return ()=>{active=false;};
  },[session?.user?.id]);

  const submit=async event=>{
    event.preventDefault();
    if(!supabase){setMessage('اتصال حساب کاربری در دسترس نیست.');return;}
    setBusy(true);setMessage('');
    const result=mode==='signup'
      ? await supabase.auth.signUp({email,password,options:{data:{full_name:name,phone}}})
      : await supabase.auth.signInWithPassword({email,password});
    setBusy(false);
    if(result.error)setMessage(result.error.message);
    else if(mode==='signup'&&!result.data.session)setMessage('ثبت‌نام انجام شد. برای فعال‌سازی حساب، ایمیل خود را تأیید کنید.');
    else setMessage(mode==='signup'?'حساب مشتری ایجاد شد.':'با موفقیت وارد شدید.');
  };

  if(session)return <div className="ref-account-panel">
    <span className="eyebrow text-gold-deep">MAHGOLD ACCOUNT</span>
    <h3>حساب کاربری شما</h3>
    <p className="text-sm text-muted-foreground">{session.user.email}</p>
    <div className="mt-3 border-t border-border pt-4">
      <div className="mb-3 flex items-center justify-between text-sm"><b>آخرین سفارش‌ها</b><span className="text-muted-foreground">{money(orders.length)} مورد</span></div>
      {orders.length ? <div className="ref-order-list">{orders.map(order=><div className="ref-order-item" key={order.id}>
        <div><b>سفارش {order.order_number||'—'}</b><small>{new Date(order.created_at).toLocaleDateString('fa-IR')}</small></div>
        <div className="text-left"><b>{money(order.total_toman)} تومان</b><small>{({pending:"در انتظار بررسی",awaiting_payment:"در انتظار پرداخت",paid:"پرداخت‌شده",processing:"در حال آماده‌سازی",shipped:"ارسال‌شده",completed:"تکمیل‌شده",cancelled:"لغوشده",payment_failed:"پرداخت ناموفق"})[order.status]||order.status}</small></div>
      </div>)}</div> : <p className="text-xs text-muted-foreground">هنوز سفارشی برای این حساب ثبت نشده است.</p>}
    </div>
    <button className="h-11 rounded-lg bg-gold-gradient text-sm font-bold text-ink ref-full" onClick={onClose}>ادامه خرید</button>
    <button className="flex h-10 items-center justify-center gap-2 rounded-lg border border-border text-xs" onClick={async()=>{await supabase.auth.signOut();setMessage('از حساب خارج شدید.')}}><LogOut size={15}/> خروج از حساب</button>
    {message&&<p className="ref-message">{message}</p>}
  </div>;

  return <form className="ref-auth-form" onSubmit={submit}>
    <span className="eyebrow text-gold-deep">WELCOME TO MAHGOLD</span>
    <h3>{mode==='login'?'به مه‌گلد خوش آمدید':'ایجاد حساب مشتری'}</h3>
    <p className="ref-auth-intro">برای پیگیری سفارش‌ها و تجربه خرید آسان‌تر وارد حساب خود شوید.</p>
    <div className="ref-auth-tabs">
      <button type="button" className={mode==='login'?'active':''} onClick={()=>{setMode('login');setMessage('');}}>ورود</button>
      <button type="button" className={mode==='signup'?'active':''} onClick={()=>{setMode('signup');setMessage('');}}>ایجاد حساب</button>
    </div>
    {mode==='signup'&&<>
      <label>نام و نام خانوادگی<input required minLength="2" autoComplete="name" value={name} onChange={e=>setName(e.target.value)}/></label>
      <label>شماره موبایل<input required type="tel" autoComplete="tel" value={phone} onChange={e=>setPhone(e.target.value)}/></label>
    </>}
    <label>ایمیل<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label>
    <label>گذرواژه<input required minLength="6" type="password" autoComplete={mode==='login'?'current-password':'new-password'} value={password} onChange={e=>setPassword(e.target.value)}/></label>
    {message&&<p className="ref-message">{message}</p>}
    <button className="h-12 rounded-lg bg-gold-gradient text-sm font-bold text-ink ref-full" disabled={busy}>{busy?'در حال بررسی…':mode==='login'?'ورود به حساب':'ایجاد حساب مشتری'}</button>
  </form>;
}

export default function App() {
  const [category,setCategory]=useState('همه محصولات');
  const [query,setQuery]=useState('');
  const [sortMode,setSortMode]=useState('newest');
  const [cart,setCart]=useState(()=>{try{return JSON.parse(localStorage.getItem('mahgold_cart')||'[]');}catch{return [];}});
  const [cartOpen,setCartOpen]=useState(false);
  const [cartNotice,setCartNotice]=useState('');
  const [cartRefreshing,setCartRefreshing]=useState(false);
  const [accountOpen,setAccountOpen]=useState(false);
  const [checkoutOpen,setCheckoutOpen]=useState(false);
  const [checkoutBusy,setCheckoutBusy]=useState(false);
  const orderIdempotencyKeyRef=useRef(null);
  const [checkoutError,setCheckoutError]=useState('');
  const [orderResult,setOrderResult]=useState(null);
  const [selectedProduct,setSelectedProduct]=useState(null);
  const [customer,setCustomer]=useState({name:'',phone:'',email:'',address:'',city:'',postalCode:'',note:''});
  const [menuOpen,setMenuOpen]=useState(false);
  const [activeSlide,setActiveSlide]=useState(0);
  const [products,setProducts]=useState([]);
  const [dbCategories,setDbCategories]=useState([]);
  const [quote,setQuote]=useState(null);
  const [coinQuotes,setCoinQuotes]=useState([]);
  const [coinsOpen,setCoinsOpen]=useState(false);
  const [siteContent,setSiteContent]=useState(null);
  const [dataStatus,setDataStatus]=useState(isSupabaseConfigured?'loading':'error');
  const [dataMessage,setDataMessage]=useState('در حال دریافت اطلاعات فروشگاه…');
  const [isAdminPage,setIsAdminPage]=useState(()=>forceAdminPreview||window.location.pathname==='/admin'||window.location.pathname==='/admin/'||window.location.hash==='#mahgold-control');

  const openProduct=(product)=>{
    if(!product?.id)return;
    // Render the detail view first. Local file previews and some embedded browsers
    // reject History API URL changes; that must never block the product page.
    setSelectedProduct(product);
    try{
      const params=new URLSearchParams(window.location.search);
      params.set('product',String(product.id));
      window.history.pushState({...(window.history.state||{}),mahgoldProductId:String(product.id)},'','?'+params.toString());
    }catch(error){console.warn('Product route history is unavailable in this preview:',error);}
    window.scrollTo({top:0,behavior:'smooth'});
  };
  const closeProduct=()=>{
    setSelectedProduct(null);
    try{
      if(new URLSearchParams(window.location.search).has('product'))window.history.back();
    }catch(error){console.warn('Product route history is unavailable in this preview:',error);}
  };
  useEffect(()=>{
    const syncProductRoute=()=>{
      const id=new URLSearchParams(window.location.search).get('product');
      if(id&&!window.history.state?.mahgoldProductId){
        const productUrl=window.location.pathname+window.location.search+window.location.hash;
        const baseParams=new URLSearchParams(window.location.search);baseParams.delete('product');
        const baseUrl=window.location.pathname+(baseParams.toString()?'?'+baseParams.toString():'')+window.location.hash;
        window.history.replaceState({...(window.history.state||{}),mahgoldProductId:null},'',baseUrl);
        window.history.pushState({...(window.history.state||{}),mahgoldProductId:String(id)},'',productUrl);
      }
      setSelectedProduct(id?products.find(item=>String(item.id)===id)||null:null);
    };
    const onProductKeyDown=event=>{if(event.key==='Escape'&&new URLSearchParams(window.location.search).has('product'))closeProduct();};
    window.addEventListener('popstate',syncProductRoute);
    window.addEventListener('keydown',onProductKeyDown);
    syncProductRoute();
    return()=>{window.removeEventListener('popstate',syncProductRoute);window.removeEventListener('keydown',onProductKeyDown);};
  },[products]);

  const displaySlides=useMemo(()=>{const source=Array.isArray(siteContent?.slides)?siteContent.slides:(Array.isArray(siteContent?.specials)?siteContent.specials.map(s=>({active:true,eyebrow:s?.kicker||'',title:s?.title||'',description:s?.sub||'',button:'مشاهده محصولات',image:s?.image||'',category:s?.category||'طلای زینتی'})):[]);const rows=source.filter(s=>s&&s.active!==false&&s.image&&s.title);return rows.length?rows:slides;},[siteContent]);
  const displayTiles=useMemo(()=>{const saved=Array.isArray(siteContent?.tiles)?siteContent.tiles:[];const legacyImages=siteContent?.categoryImages&&typeof siteContent.categoryImages==='object'&&!Array.isArray(siteContent.categoryImages)?siteContent.categoryImages:{};return displayTileDefaults.map(tile=>{const savedTile=saved.find(item=>item&&item.name===tile.name)||{};return {...tile,...savedTile,image:savedTile.image||legacyImages[tile.name]||tile.image};});},[siteContent]);
  useEffect(()=>{setActiveSlide(index=>Math.min(index,displaySlides.length-1));},[displaySlides.length]);
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
          supabase.from('products').select('id,name,category,description,image_url,weight_grams,karat,price_toman,pricing_mode,labor_mode,labor_value,seller_profit_percent,commission_percent,vat_percent,stock,is_active,created_at,tag,attributes')
            .eq('is_active',true).order('created_at',{ascending:false}),
          supabase.from('categories').select('id,name,slug,sort_order,is_active')
            .eq('is_active',true).order('sort_order',{ascending:true}),
          supabase.from('market_quotes').select('symbol,title,price_toman,source,observed_at,is_live')
            .in('symbol',['gold_18k','coin_emami','coin_bahar','coin_nim','coin_rob','coin_gerami'])
            .order('observed_at',{ascending:false})
        ]);
        if(!active)return;
        if(productResult.error){setDataStatus('error');setProducts([]);setDataMessage('دریافت محصولات ناموفق بود؛ برای جلوگیری از نمایش قیمت نادرست، اطلاعات نمونه نمایش داده نمی‌شود.');}
        else{
          const rows=productResult.data||[];
          setProducts(rows);setDataStatus('connected');
          setDataMessage(rows.length?'محصولات مه‌گلد آماده مشاهده و خرید هستند.':'در حال حاضر محصولی برای نمایش وجود ندارد.');
        }
        if(!categoryResult.error)setDbCategories(categoryResult.data||[]);
        if(!quoteResult.error){
          const marketRows=quoteResult.data||[];
          setQuote(marketRows.find(row=>row.symbol==='gold_18k')||null);
          setCoinQuotes(marketRows.filter(row=>row.symbol!=='gold_18k'));
        }
      }catch{
        if(!active)return;
        setDataStatus('error');setProducts([]);setDataMessage('بارگذاری فروشگاه با مشکل روبه‌رو شد. لطفاً دوباره تلاش کنید.');
      }
    })();
    return()=>{active=false;};
  },[]);
  useEffect(()=>{
    if(!supabase)return;
    let active=true;
    const refreshMarketData=async()=>{
      const [quoteResult,productResult]=await Promise.all([
        supabase.from('market_quotes').select('symbol,title,price_toman,source,observed_at,is_live')
          .in('symbol',['gold_18k','coin_emami','coin_bahar','coin_nim','coin_rob','coin_gerami']).order('observed_at',{ascending:false}),
        supabase.from('products').select('id,name,category,description,image_url,weight_grams,karat,price_toman,pricing_mode,labor_mode,labor_value,seller_profit_percent,commission_percent,vat_percent,stock,is_active,created_at,tag,attributes')
          .eq('is_active',true).order('created_at',{ascending:false})
      ]);
      if(!active)return;
      const marketRows=quoteResult.error?[]:quoteResult.data||[];
      setQuote(marketRows.find(row=>row.symbol==='gold_18k')||null);
      setCoinQuotes(marketRows.filter(row=>row.symbol!=='gold_18k'));
      if(!productResult.error)setProducts(productResult.data||[]);
    };
    const timer=setInterval(refreshMarketData,60000);
    return()=>{active=false;clearInterval(timer);};
  },[]);
  useEffect(()=>{try{localStorage.setItem('mahgold_cart',JSON.stringify(cart));}catch{}},[cart]);
  useEffect(()=>{if(!cartNotice)return;const timer=setTimeout(()=>setCartNotice(''),2600);return()=>clearTimeout(timer);},[cartNotice]);

  const categories=useMemo(()=>{
    const rows=dbCategories.map(row=>row.name).filter(Boolean);
    const extras=rows.filter(name=>!presetCategories.includes(name));
    return [...presetCategories,...extras];
  },[dbCategories]);
  const filtered=useMemo(()=>{
    const rows=products.filter(p=>
      (category==='همه محصولات'||p.category===category||p.name?.includes(category))&&
      (!query.trim()||p.name?.toLocaleLowerCase('fa').includes(query.trim().toLocaleLowerCase('fa')))
    );
    return rows.sort((a,b)=>{
      if(sortMode==='cheap')return Number(a.price_toman||0)-Number(b.price_toman||0);
      if(sortMode==='expensive')return Number(b.price_toman||0)-Number(a.price_toman||0);
      return new Date(b.created_at||0)-new Date(a.created_at||0);
    });
  },[products,category,query,sortMode]);
  const newArrivals=useMemo(()=>products.slice(0,4),[products]);
  const cartCount=cart.reduce((sum,item)=>sum+Number(item.qty||0),0);
  const cartTotal=cart.reduce((sum,item)=>sum+Number(item.price_toman||0)*Number(item.qty||0),0);
  const cartNeedsFreshQuote=cart.some(item=>item.pricing_mode==='auto')&&!isFreshLiveQuote(quote);

  const refreshCartPrices=async()=>{
    if(!cart.length)return true;
    if(!supabase){setCheckoutError('اتصال فروشگاه برقرار نیست؛ قیمت‌ها قابل به‌روزرسانی نیستند.');return false;}
    setCartRefreshing(true);
    try{
      const ids=cart.map(item=>item.id);
      const [productResult,quoteResult]=await Promise.all([
        supabase.from('products').select('id,name,category,description,image_url,weight_grams,karat,price_toman,pricing_mode,labor_mode,labor_value,seller_profit_percent,commission_percent,vat_percent,stock,is_active,attributes').in('id',ids),
        supabase.from('market_quotes').select('symbol,title,price_toman,source,observed_at,is_live').eq('symbol','gold_18k').order('observed_at',{ascending:false}).limit(1).maybeSingle()
      ]);
      if(productResult.error)throw productResult.error;
      const rows=productResult.data||[];
      const byId=new Map(rows.map(row=>[row.id,row]));
      for(const item of cart){
        const latest=byId.get(item.id);
        if(!latest||!latest.is_active)throw new Error('محصول «'+item.name+'» دیگر برای فروش موجود نیست.');
        if(Number(latest.stock||0)<Number(item.qty||0))throw new Error('موجودی محصول «'+item.name+'» برای تعداد انتخاب‌شده کافی نیست.');
        if(Number(latest.price_toman||0)<=0)throw new Error('قیمت محصول «'+item.name+'» معتبر نیست.');
      }
      if(cart.some(item=>byId.get(item.id)?.pricing_mode==='auto')){
        const quote=quoteResult.data;
        const observedAt=quote?.observed_at?Date.parse(quote.observed_at):NaN;
        if(quoteResult.error||!quote||quote.is_live!==true||!Number.isFinite(observedAt)||Date.now()-observedAt>5*60*1000||observedAt>Date.now()+60*1000){
          throw new Error('نرخ زنده و تازه طلای ۱۸ عیار در دسترس نیست؛ تا دریافت نرخ معتبر، سفارش طلای قیمت‌گذاری خودکار پذیرفته نمی‌شود.');
        }
      }
      setCart(old=>old.map(item=>({...item,...byId.get(item.id),qty:item.qty})));
      if(quoteResult.data)setQuote(quoteResult.data);
      setCheckoutError('');
      return true;
    }catch(error){
      setCheckoutError(error?.message||'به‌روزرسانی قیمت سبد خرید ناموفق بود.');
      return false;
    }finally{setCartRefreshing(false);}
  };

  const addToCart=product=>{
    if(!supabase||dataStatus!=='connected'||!product.id){setCheckoutError('اتصال فروشگاه برقرار نیست.');return;}
    if(product.pricing_mode==='auto'&&!isFreshLiveQuote(quote)){setCheckoutError('قیمت این محصول فعلاً قابل تأیید نیست؛ نرخ زنده طلای ۱۸ عیار تازه نیست.');return;}
    setCart(old=>{
      const previous=old.find(item=>item.id===product.id);
      const nextQty=(previous?.qty||0)+1;
      if(nextQty>Number(product.stock||0)){setCheckoutError('تعداد انتخاب‌شده از موجودی محصول بیشتر است.');return old;}
      return previous?old.map(item=>item.id===product.id?{...item,qty:nextQty}:item):[...old,{...product,qty:1}];
    });
    setCheckoutError('');
    setCartNotice('«'+product.name+'» به سبد خرید اضافه شد.');
  };
  const changeQuantity=(id,delta)=>{
    const current=cart.find(item=>item.id===id);
    if(!current)return;
    const nextQty=Number(current.qty||0)+delta;
    if(nextQty>Number(current.stock||0)){setCheckoutError('موجودی «'+current.name+'» برای تعداد بیشتر کافی نیست.');return;}
    setCheckoutError('');
    setCart(old=>old.map(item=>item.id===id?{...item,qty:nextQty}:item).filter(item=>item.qty>0));
  };
  const submitOrder=async event=>{
    event.preventDefault();
    if(checkoutBusy)return;
    setCheckoutError('');
    if(!supabase||!cart.length)return;
    setCheckoutBusy(true);
    try{
      const orderPayload={
        customer_name:customer.name,
        customer_phone:toLatinDigits(customer.phone),
        customer_email:customer.email||null,
        shipping_address:[customer.city,customer.postalCode,customer.address].filter(Boolean).join(' · '),
        customer_note:customer.note||'',
        items:cart.map(item=>({product_id:item.id,quantity:item.qty,expected_price_toman:item.price_toman}))
      };
      const payloadFingerprint=JSON.stringify(orderPayload);
      if(!orderIdempotencyKeyRef.current||orderIdempotencyKeyRef.current.fingerprint!==payloadFingerprint){
        if(!globalThis.crypto?.randomUUID)throw new Error('مرورگر شما از ثبت امن سفارش پشتیبانی نمی‌کند؛ صفحه را در مرورگر به‌روز باز کنید.');
        orderIdempotencyKeyRef.current={fingerprint:payloadFingerprint,key:globalThis.crypto.randomUUID()};
      }
      const {data,error}=await supabase.functions.invoke('mahgold-create-order',{
        body:{...orderPayload,idempotency_key:orderIdempotencyKeyRef.current.key}
      });
      if(error)throw error;
      if(!data?.data)throw new Error(data?.error||'پاسخ معتبری از سرور دریافت نشد؛ وضعیت سفارش را بررسی کنید.');
      setOrderResult(data.data);
      orderIdempotencyKeyRef.current=null;
      setCart([]);
      setCheckoutOpen(false);
      setCartOpen(false);
    }catch(error){
      setCheckoutError(error?.message||'ارتباط با سرور برقرار نشد. سفارش ثبت‌شده تلقی نمی‌شود؛ پیش از تلاش مجدد، وضعیت سفارش را بررسی کنید.');
    }finally{
      setCheckoutBusy(false);
    }
  };
  if(isAdminPage)return <AdminErrorBoundary><AdminPanel/></AdminErrorBoundary>;

  return <div dir="rtl" className="min-h-screen bg-background text-foreground">
    {cartNotice&&<div className="mahgold-cart-toast" role="status"><span>✓</span>{cartNotice}<button onClick={()=>{setCartNotice('');setCartOpen(true);}}>مشاهده سبد</button></div>}
    {siteContent?.announcement?.active!==false&&(siteContent?.announcement&&typeof siteContent.announcement.text==='string'?(siteContent.announcement.text.trim()&&<div className="ref-announcement">{siteContent.announcement.text}</div>):<div className="ref-announcement">{[siteContent?.top1,siteContent?.top2].filter(Boolean).join('  ✦  ')||"ارسال امن و بسته‌بندی ویژه ✦ پشتیبانی مه‌گلد ✦ همراه انتخاب شما"}</div>)}

    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl transition-shadow">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:h-[72px] md:px-7">
        <button aria-label="منو" className="ref-mobile-menu md:hidden" onClick={()=>setMenuOpen(v=>!v)}><Menu size={20}/></button>
        <a aria-label="مه‌گلد - صفحه اصلی" className="ref-brand" href="#home">
          <img src={siteContent?.logo_url||MAHGOLD_LOGO} alt=""/>
        </a>
        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          <a className="transition-colors hover:text-gold-deep" href="#categories" onClick={()=>setMenuOpen(false)}>دسته‌بندی‌ها</a>
          <a className="transition-colors hover:text-gold-deep" href="#shop" onClick={()=>setMenuOpen(false)}>فروشگاه</a>
          <a className="transition-colors hover:text-gold-deep" href="#market-rates" onClick={()=>setMenuOpen(false)}>تابلو نرخ آنلاین</a>
          <a className="transition-colors hover:text-gold-deep" href="#story" onClick={()=>setMenuOpen(false)}>درباره مه‌گلد</a>
        </nav>
        <div className="flex items-center gap-2">
          <button className="hidden h-10 items-center justify-center rounded-full border border-input bg-background px-5 text-xs font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground md:inline-flex" onClick={()=>setAccountOpen(true)}>ورود / ثبت‌نام</button>
          <button aria-label="سبد خرید" className="relative hidden h-10 items-center justify-center gap-2 rounded-full bg-ink px-3 text-xs font-semibold text-ink-foreground transition-all hover:bg-gold-deep md:inline-flex md:px-5" onClick={()=>setCartOpen(true)}>
            <ShoppingBag size={16}/><span className="hidden md:inline">سبد خرید</span>{cartCount>0&&<span className="absolute -left-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-ink">{money(cartCount)}</span>}
          </button>
        </div>
      </div>
      {menuOpen&&<nav className="ref-mobile-links flex flex-col gap-4 border-t border-border bg-background px-5 py-4 text-sm text-muted-foreground md:hidden">
        <a href="#categories" onClick={()=>setMenuOpen(false)}>دسته‌بندی‌ها</a><a href="#shop" onClick={()=>setMenuOpen(false)}>فروشگاه</a><a href="#market-rates" onClick={()=>setMenuOpen(false)}>تابلو نرخ آنلاین</a><a href="#story" onClick={()=>setMenuOpen(false)}>درباره مه‌گلد</a>
        <button className="text-right" onClick={()=>{setAccountOpen(true);setMenuOpen(false);}}>ورود / ثبت‌نام</button>
      </nav>}
      <section aria-label="تابلو نرخ آنلاین طلا و سکه" className="mahgold-glass-market" id="market-rates">
        <div className="mahgold-glass-inner">
          <div className="mahgold-glass-gold">
            <span className="mahgold-glass-live" aria-hidden="true"/>
            <span className="mahgold-glass-label">طلای ۱۸ عیار</span>
            <strong>{quote?.price_toman&&Number(quote.price_toman)>0?money(quote.price_toman):'—'} <small>تومان</small></strong>
            <span className={isFreshLiveQuote(quote)?'mahgold-glass-state live':'mahgold-glass-state'}>{isFreshLiveQuote(quote)?'زنده':'آخرین نرخ'}</span>
          </div>
          <button type="button" className={'mahgold-coins-toggle '+(coinsOpen?'is-open':'')} aria-expanded={coinsOpen} aria-controls="mahgold-coins-panel" onClick={()=>setCoinsOpen(v=>!v)}>
            <span>قیمت سکه‌ها</span><ChevronDown size={15}/>
          </button>
        </div>
        {coinsOpen&&<div className="mahgold-coins-panel" id="mahgold-coins-panel">
          {[
            ['coin_emami','سکه امامی'],
            ['coin_bahar','سکه بهار آزادی'],
            ['coin_nim','نیم‌سکه'],
            ['coin_rob','ربع‌سکه'],
            ['coin_gerami','سکه گرمی']
          ].map(([symbol,label])=>{
            const item=coinQuotes.find(row=>row.symbol===symbol);
            const fresh=isFreshLiveQuote(item);
            return <div className="mahgold-coin-item" key={symbol}>
              <span>{label}</span>
              <strong>{item?.price_toman&&Number(item.price_toman)>0?money(item.price_toman):'—'} <small>تومان</small></strong>
              <em className={fresh?'live':''}>{fresh?'زنده':item?'آخرین نرخ':'دریافت نشده'}</em>
            </div>;
          })}
          <div className="mahgold-coins-foot">نرخ‌ها به تومان · منبع: ارزهاام · به‌روزرسانی خودکار</div>
        </div>}
      </section>
    </header>



    <main className="min-h-[60vh]" id="home">
      <section aria-label="اسلایدهای مه‌گلد" aria-roledescription="carousel" className="relative h-[560px] overflow-hidden bg-ink text-ink-foreground md:h-[640px]">
        {displaySlides.map((slide,index)=><div key={slide.image} aria-hidden={activeSlide!==index} className={'absolute inset-0 transition-opacity duration-1000 '+(activeSlide===index?'z-10 opacity-100':'pointer-events-none z-0 opacity-0')}>
          <img alt={slide.title} className="h-full w-full object-cover transition-transform duration-[7000ms] ease-out" src={slide.image} loading={index===0?'eager':'lazy'} style={{transform:activeSlide===index?'scale(1.05)':'scale(1)'}}/>
          <div className="slide-shade absolute inset-0"/>
          <div className="absolute inset-0 mx-auto flex max-w-7xl flex-col justify-end px-6 pb-20 md:justify-center md:px-10 md:pb-0">
            <div className="max-w-xl">
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



      <section className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 md:px-7 md:py-24" id="categories">
        <div className="mb-8 flex items-end justify-between gap-5">
          <div><div className="eyebrow text-gold-deep">DISCOVER MAHGOLD</div><h2 className="mt-3 text-2xl font-semibold md:text-3xl">از میان مجموعه‌ها انتخاب کنید</h2><p className="mt-2 text-xs leading-7 text-muted-foreground">هر دسته را انتخاب کنید تا محصولات همان مجموعه را ببینید؛ تعداد محصولات از موجودی فعال فروشگاه محاسبه می‌شود.</p></div>
          <p className="hidden text-xs text-muted-foreground md:block">مجموعه‌های مه‌گلد</p>
        </div>
        <div className="ref-category-grid">
          {displayTiles.map(tile=><button key={tile.name} className="ref-category-card" onClick={()=>{setCategory(tile.name);document.getElementById('shop')?.scrollIntoView({behavior:'smooth'});}}>
            <img src={tile.image} alt={tile.name} loading="lazy"/><span className="ref-category-shade"/>
            <span className="ref-category-text"><b>{tile.name}</b><small>{tile.desc}</small><span className="mahgold-category-count">{dataStatus==='connected'?money(products.filter(product=>product.category===tile.name||product.name?.includes(tile.name)).length)+' محصول فعال':dataStatus==='loading'?'در حال دریافت…':'اتصال در دسترس نیست'}</span><em>مشاهده محصولات <ArrowLeft size={12}/></em></span>
          </button>)}
        </div>
        <div className="ref-service-grid">
          <article className="ref-service-card"><ShieldCheck/><div><b>اصالت و شفافیت</b><small>اطلاعات روشن برای انتخاب آگاهانه</small></div></article>
          <article className="ref-service-card"><Gift/><div><b>بسته‌بندی ویژه</b><small>تجربه‌ای شایسته هدیه دادن</small></div></article>
          <article className="ref-service-card"><Headphones/><div><b>همراهی تا انتخاب</b><small>پشتیبانی در مسیر خرید</small></div></article>
        </div>
      </section>

      <section className="mahgold-arrivals-section" aria-label="جدیدترین محصولات">
        <div className="mx-auto max-w-7xl px-4 md:px-7">
          <div className="mahgold-section-heading">
            <div><span className="eyebrow text-gold-deep">JUST ARRIVED</span><h2>تازه‌های مه‌گلد</h2><p>جدیدترین انتخاب‌هایی که به مجموعه اضافه شده‌اند</p></div>
            <button onClick={()=>{setCategory('همه محصولات');setSortMode('newest');document.getElementById('shop')?.scrollIntoView({behavior:'smooth'});}}>مشاهده همه محصولات <ArrowLeft size={15}/></button>
          </div>
          {dataStatus==='loading'?<div className="mahgold-arrivals-empty">در حال دریافت محصولات…</div>:newArrivals.length>0?<div className="mahgold-arrivals-grid">
            {newArrivals.map(product=><article className="mahgold-arrival-card" key={product.id}>
              <button className="mahgold-arrival-image" onClick={()=>openProduct(product)} aria-label={'مشاهده '+product.name}><ProductImage product={product}/></button>
              <div className="mahgold-arrival-info"><span>{product.category}</span><button onClick={()=>openProduct(product)}>{product.name}</button><small>{product.weight_grams?gram(product.weight_grams):'جزئیات محصول'}</small><div><strong>{product.pricing_mode==='auto'&&!isFreshLiveQuote(quote)?'نیازمند نرخ معتبر':<>{money(product.price_toman)} <small>تومان</small></>}</strong><button aria-label={'افزودن '+product.name+' به سبد'} disabled={Number(product.stock||0)<1||dataStatus!=='connected'||(product.pricing_mode==='auto'&&!isFreshLiveQuote(quote))} onClick={()=>addToCart(product)}><Plus size={16}/></button></div></div>
            </article>)}
          </div>:<div className="mahgold-arrivals-empty">{dataStatus==='error'?'برای نمایش محصولات، اتصال فروشگاه را بررسی کنید.':'محصول تازه‌ای برای نمایش ثبت نشده است.'}</div>}
        </div>
      </section>

      <section className="scroll-mt-16 bg-sand-gradient py-16 md:py-24" id="shop">
        <div className="mx-auto max-w-7xl px-4 md:px-7">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div><div className="eyebrow text-gold-deep">THE CURATED EDIT</div><h2 className="mt-2 text-2xl font-semibold md:text-3xl">منتخب‌های مه‌گلد</h2>{quote&&<p className="mt-2 text-xs text-muted-foreground">{quote.title||'آخرین نرخ ثبت‌شده طلا'}: <b className="text-gold-deep">{money(quote.price_toman)} تومان</b> <span className="mr-1 text-[10px]">{isFreshLiveQuote(quote)?'نرخ زنده و به‌روز':quote.is_live?'آخرین نرخ · قدیمی':'ثبت دستی · غیرزنده'}</span></p>}</div>
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
            {filtered.map((product,index)=><article className="ref-product-card ref-product-select-card group" key={product.id} style={{'--card-order':index}}>
              <button className="ref-product-card-visual" onClick={()=>openProduct(product)} aria-label={'مشاهده '+product.name}>
                <ProductImage product={product}/>
                <span className="ref-product-visual-shade"/>
                <span className="ref-product-quickview">مشاهده جزئیات <ArrowLeft size={13}/></span>
                <span className="ref-product-stock-tag">{Number(product.stock||0)>0?'موجود':'ناموجود'}</span>
                <span className="ref-product-image-sparkle" aria-hidden="true">✦</span>
              </button>
              <div className="ref-product-body ref-product-select-body">
                <div className="ref-product-card-meta"><span>{product.category||'مجموعه مه‌گلد'}</span><span className="ref-product-weight">{product.weight_grams?gram(product.weight_grams):'طلای منتخب'}</span></div>
                <button className="ref-product-name line-clamp-1 text-right" onClick={()=>openProduct(product)}>{product.name}</button>
                <div className="ref-product-karat">{product.karat?money(product.karat)+' عیار':'جزئیات و مشخصات محصول'}</div>
                <div className="ref-product-bottom ref-product-select-bottom">
                  <div className="ref-product-price-wrap"><small>قیمت محصول</small><strong>{product.pricing_mode==='auto'&&!isFreshLiveQuote(quote)?'در انتظار نرخ':<>{money(product.price_toman)} <small>تومان</small></>}</strong></div>
                  <button aria-label={'افزودن '+product.name+' به سبد'} className="ref-add-button ref-product-add-glow" disabled={Number(product.stock||0)<1||dataStatus!=='connected'||(product.pricing_mode==='auto'&&!isFreshLiveQuote(quote))} onClick={()=>addToCart(product)}><Plus size={18}/></button>
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
      <img alt="مه‌گلد" className="mx-auto mb-4 h-36 w-auto" height="630" loading="lazy" src={siteContent?.logo_url||MAHGOLD_LOGO} width="525"/>
      <div>{siteContent?.slogan||"طلایی به زیباییِ لحظه‌های تو"}</div>
      <div className="mt-3 flex flex-col items-center gap-1 md:flex-row md:justify-center md:gap-6">
        <span className="inline-flex items-center gap-1.5"><Phone className="size-3.5 text-gold"/> {siteContent?.phone||"شماره تماس: به‌زودی"}</span>
        <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5 text-gold"/> {siteContent?.address||"نشانی: به‌زودی اعلام می‌شود"}</span>
      </div>
      <div className="mt-3 text-[11px] opacity-60">© ۱۴۰۵ {siteContent?.storeName||"فروشگاه آنلاین مه‌گلد"} · {siteContent?.footer||"زیورآلات طلا"}</div>
    </footer>

    <nav className="ref-mobile-nav fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-background/95 px-2 pt-1 backdrop-blur-xl md:hidden">
      <a className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium text-gold-deep" href="#home"><House size={20}/>خانه</a>
      <a className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium text-muted-foreground" href="#shop"><LayoutGrid size={20}/>فروشگاه</a>
      <button className="relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium text-muted-foreground" onClick={()=>setCartOpen(true)}><ShoppingBag size={20}/>سبد{cartCount>0&&<b className="absolute right-1/2 top-0 translate-x-5 rounded-full bg-gold px-1 text-[9px] text-ink">{money(cartCount)}</b>}</button>
      <button className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium text-muted-foreground" onClick={()=>setAccountOpen(true)}><UserRound size={20}/>ورود</button>
    </nav>

    {accountOpen&&<div className="ref-overlay" onClick={()=>setAccountOpen(false)}>
      <section className="ref-dialog" onClick={e=>e.stopPropagation()}>
        <div className="ref-dialog-head"><div><div className="eyebrow text-gold-deep">MAHGOLD</div><h2>حساب کاربری مه‌گلد</h2></div><button className="ref-close" aria-label="بستن" onClick={()=>setAccountOpen(false)}><X/></button></div>
        <AccountContent onClose={()=>setAccountOpen(false)}/>
      </section>
    </div>}

    {cartOpen&&<div className="ref-overlay" onClick={()=>setCartOpen(false)}>
      <aside className="ref-drawer" onClick={e=>e.stopPropagation()}>
        <div className="ref-drawer-head"><div><div className="eyebrow text-gold-deep">YOUR SELECTION</div><h2>سبد خرید <small className="text-sm text-muted-foreground">({money(cartCount)})</small></h2></div><button className="ref-close" aria-label="بستن" onClick={()=>setCartOpen(false)}><X/></button></div>
        {cart.length===0?<div className="ref-empty"><ShoppingBag size={38}/><h3>سبد خرید شما خالی است</h3><p>از میان مجموعه‌های مه‌گلد انتخاب کنید.</p><button className="mt-4 h-11 rounded-lg bg-gold-gradient px-7 text-xs font-bold text-ink" onClick={()=>{setCartOpen(false);document.getElementById('shop')?.scrollIntoView({behavior:'smooth'});}}>مشاهده محصولات</button></div>:
          <>
            <div>{cart.map(item=><div className="ref-cart-line" key={item.id}>
              <ProductImage product={item}/>
              <div><h4>{item.name}</h4><strong>{item.pricing_mode==='auto'&&!isFreshLiveQuote(quote)?'نیازمند نرخ معتبر':<>{money(item.price_toman)} تومان</>}</strong><div className="ref-qty">
                <button aria-label="کاهش تعداد" onClick={()=>changeQuantity(item.id,-1)}><Minus size={13}/></button><span className="text-xs">{money(item.qty)}</span><button aria-label="افزایش تعداد" onClick={()=>changeQuantity(item.id,1)}><Plus size={13}/></button>
              </div></div>
              <button className="ref-remove" aria-label="حذف محصول" onClick={()=>setCart(old=>old.filter(p=>p.id!==item.id))}><X size={15}/></button>
            </div>)}</div>
            <div className="ref-cart-trust"><div><ShieldCheck size={16}/><span>بررسی قیمت و موجودی پیش از ثبت سفارش</span></div><div><Clock3 size={16}/><span>رزرو موجودی پس از ثبت سفارش، به مدت ۱۵ دقیقه</span></div></div>
            <div className="ref-cart-summary"><span>جمع سبد خرید</span><b>{cartNeedsFreshQuote?'پس از دریافت نرخ معتبر':money(cartTotal)+' تومان'}</b></div>
            <p className="mb-4 text-[11px] leading-7 text-muted-foreground">قیمت نهایی پیش از ثبت سفارش بررسی می‌شود.</p>
            <button type="button" className="h-12 rounded-lg bg-gold-gradient text-sm font-bold text-ink ref-full mahgold-premium-action" disabled={cartRefreshing} onClick={async()=>{const ready=await refreshCartPrices();if(ready)setCheckoutOpen(true);}}>{cartRefreshing?'در حال به‌روزرسانی قیمت‌ها…':'ادامه و ثبت سفارش'} <ArrowLeft className="mr-2 inline" size={16}/></button>
          </>}
      </aside>
    </div>}

    {checkoutOpen&&<div className="ref-overlay" onClick={()=>{if(!checkoutBusy)setCheckoutOpen(false);}}>
      <form className="ref-drawer ref-checkout-form" onClick={e=>e.stopPropagation()} onSubmit={submitOrder}>
        <div className="ref-drawer-head"><div><div className="eyebrow text-gold-deep">SECURE CHECKOUT</div><h2>اطلاعات سفارش</h2></div><button type="button" className="ref-close" aria-label="بستن" onClick={()=>{if(!checkoutBusy)setCheckoutOpen(false);}}><X/></button></div><div className="ref-checkout-steps"><span>۱ · سبد خرید</span><b>۲ · اطلاعات ارسال</b><span>۳ · رزرو موجودی</span></div>
        <label>نام و نام خانوادگی<input required minLength="2" value={customer.name} onChange={e=>setCustomer({...customer,name:e.target.value})}/></label>
        <label>شماره تماس<input required type="tel" minLength="8" value={customer.phone} onChange={e=>setCustomer({...customer,phone:e.target.value})}/></label>
        <label>ایمیل (اختیاری)<input type="email" value={customer.email} onChange={e=>setCustomer({...customer,email:e.target.value})}/></label>
        <label>شهر<input required value={customer.city} onChange={e=>setCustomer({...customer,city:e.target.value})}/></label>
        <label>کد پستی<input value={customer.postalCode} onChange={e=>setCustomer({...customer,postalCode:e.target.value})}/></label>
        <label>نشانی کامل ارسال<textarea required rows="3" value={customer.address} onChange={e=>setCustomer({...customer,address:e.target.value})}/></label>
        <label>توضیحات سفارش<textarea rows="2" value={customer.note} onChange={e=>setCustomer({...customer,note:e.target.value})}/></label>
        <div className="ref-checkout-items"><strong>خلاصه اقلام سفارش</strong>{cart.map(item=><div key={item.id}><span>{item.name} × {money(item.qty)}</span><b>{money(Number(item.price_toman||0)*Number(item.qty||0))} تومان</b></div>)}</div>
        <div className="ref-cart-summary"><span>جمع سبد خرید</span><b>{money(cartTotal)} تومان</b></div>
        {checkoutError&&<p className="ref-message">{checkoutError}</p>}
        <button className="h-12 rounded-lg bg-gold-gradient text-sm font-bold text-ink ref-full mahgold-premium-action mahgold-finalize-action" disabled={checkoutBusy}>{checkoutBusy?'در حال ثبت…':'ثبت سفارش و رزرو موجودی'}</button>
        <small className="ref-note">ثبت سفارش به معنی پرداخت نیست. پرداخت آنلاین تا اتصال درگاه فعال نخواهد بود.</small>
      </form>
    </div>}

    {selectedProduct&&<main className="mahgold-product-page" dir="rtl" aria-labelledby="mahgold-product-detail-title">
      <div className="mahgold-product-page-glow" aria-hidden="true"/>
      <header className="mahgold-product-page-head">
        <button type="button" className="mahgold-page-back" onClick={closeProduct}><ArrowLeft size={19}/> بازگشت به فروشگاه</button>
        <span className="mahgold-product-brand">MAHGOLD <i>✦</i></span>
        <button type="button" className="mahgold-page-cart" onClick={()=>setCartOpen(true)}><ShoppingBag size={18}/> سبد خرید {cart.length>0&&<b>{money(cart.reduce((n,item)=>n+Number(item.qty||0),0))}</b>}</button>
      </header>
      <section className="mahgold-product-page-content">
        <div className="mahgold-product-page-gallery">
          <div className="mahgold-product-page-image"><ProductImage product={selectedProduct} className="mahgold-product-page-photo"/></div>
          <span className={'ref-stock-pill '+(Number(selectedProduct.stock||0)>0?'available':'unavailable')}>{Number(selectedProduct.stock||0)>0?'موجود در انبار':'ناموجود'}</span>
        </div>
        <div className="mahgold-product-page-info">
          <span className="ref-product-category">{selectedProduct.category||'محصول مه‌گلد'}</span>
          <h1 id="mahgold-product-detail-title">{selectedProduct.name}</h1>
          {selectedProduct.description&&<p className="mahgold-product-description">{selectedProduct.description}</p>}
          <div className="mahgold-product-price-panel">
            <small>قیمت محصول</small>
            <strong>{selectedProduct.pricing_mode==='auto'&&!isFreshLiveQuote(quote)?'قیمت روز در حال به‌روزرسانی است':<>{money(selectedProduct.price_toman)} <small>تومان</small></>}</strong>
            <span>قیمت نهایی پیش از ثبت سفارش بررسی می‌شود.</span>
          </div>
          <div className="mahgold-product-spec-panel">
            <div className="mahgold-spec-heading"><h2>مشخصات محصول</h2><span>جزئیات همین کالا</span></div>
            <table className="mahgold-product-spec-table"><tbody>
              {getProductSpecRows(selectedProduct).map(([label,value])=><tr key={label}><th>{label}</th><td>{value}</td></tr>)}
            </tbody></table>
          </div>
          <div className="mahgold-product-page-actions">
            <button type="button" className="mahgold-premium-action mahgold-finalize-action" disabled={Number(selectedProduct.stock||0)<1||dataStatus!=='connected'||(selectedProduct.pricing_mode==='auto'&&!isFreshLiveQuote(quote))} onClick={()=>{addToCart(selectedProduct);closeProduct();setCartOpen(true);}}>
              <ShoppingBag size={19}/> افزودن به سبد خرید
            </button>
            <span><ShieldCheck size={15}/> ثبت سفارش با بررسی قیمت و موجودی</span>
          </div>
        </div>
      </section>
    </main>}

    {orderResult&&<div className="ref-overlay">
      <section className="ref-dialog text-center">
        <div className="ref-dialog-head"><span className="eyebrow text-gold-deep">MAHGOLD ORDER</span><button className="ref-close" aria-label="بستن" onClick={()=>setOrderResult(null)}><X/></button></div>
        <PackageCheck size={46} className="mx-auto text-gold-deep"/>
        <h2 className="my-4 text-xl font-semibold">درخواست سفارش ثبت شد</h2>
        <p className="mb-2 text-sm">شماره سفارش: <b>{money(orderResult.order_number)}</b></p>
        <p className="mb-3 text-sm">مبلغ: <b>{money(orderResult.total_toman)} تومان</b></p>
        {Array.isArray(orderResult.items) && orderResult.items.length > 0 && (
          <div className="mb-5 max-h-64 overflow-y-auto rounded-xl border border-gold/20 p-3 text-right text-xs">
            <b className="mb-2 block">خلاصه سفارش</b>
            {orderResult.items.map((item,index) => (
              <div key={index} className="mb-3 flex items-center justify-between gap-3 border-b border-gold/10 pb-3 last:mb-0 last:border-0">
                <strong>{item.product_name} × {money(item.quantity)}</strong>
                <b>{money(item.line_total_toman)} تومان</b>
              </div>
            ))}
          </div>
        )}
        <button className="h-11 rounded-lg bg-gold-gradient text-sm font-bold text-ink ref-full" onClick={()=>setOrderResult(null)}>متوجه شدم</button>
      </section>
    </div>}
  </div>;
}
