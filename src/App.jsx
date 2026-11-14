import { useEffect, useMemo, useState } from 'react';
import {
  Search, ShoppingBag, Menu, X, ArrowLeft, ChevronLeft, ChevronRight,
  ShieldCheck, Gift, Headphones, Plus, Minus, UserRound, LogOut,
  House, LayoutGrid, Phone, MapPin, PackageCheck
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import AdminPanel from './Admin.jsx';

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
const presetCategories = [
  'همه محصولات','طلای زینتی','طلای آب‌شده','سکه','شمش','انگشتر','گردنبند',
  'دستبند','النگو','گوشواره','آویز و پلاک','زنجیر','پابند','سرویس طلا','سایر زیورآلات'
];
const storyImage = 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1200&q=85';
const money = value => new Intl.NumberFormat('fa-IR').format(Number(value || 0));
const gram = value => new Intl.NumberFormat('fa-IR',{maximumFractionDigits:3}).format(Number(value || 0)) + ' گرم';
const toLatinDigits = value => value.replace(/[۰-۹٠-٩]/g, d => {
  const fa='۰۱۲۳۴۵۶۷۸۹', ar='٠١٢٣٤٥٦٧٨٩';
  return String(fa.indexOf(d)>=0 ? fa.indexOf(d) : ar.indexOf(d));
});

function ProductImage({product, className=''}) {
  const [failed,setFailed] = useState(false);
  const src = !failed && product.image_url ? product.image_url : tiles.find(t=>t.name===product.category)?.image || tiles[0].image;
  return <div className={'ref-product-image ' + className}>
    <img src={src} alt={product.name || 'محصول مه‌گلد'} loading="lazy" onError={()=>setFailed(true)}/>
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
    if(mode==='signup' && import.meta.env.VITE_PREVIEW_READONLY==='true'){
      setMessage('ایجاد حساب جدید در پیش‌نمایش غیرفعال است؛ ورود به حساب‌های موجود فعال است.');
      return;
    }
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
        <div className="text-left"><b>{money(order.total_toman)} تومان</b><small>{order.status}</small></div>
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
    <small className="ref-note">اطلاعات حساب از طریق سرویس امن Supabase مدیریت می‌شود.</small>
  </form>;
}

export default function App() {
  const [category,setCategory]=useState('همه محصولات');
  const [query,setQuery]=useState('');
  const [sortMode,setSortMode]=useState('newest');
  const [cart,setCart]=useState(()=>{try{return JSON.parse(localStorage.getItem('mahgold_cart')||'[]');}catch{return [];}});
  const [cartOpen,setCartOpen]=useState(false);
  const [accountOpen,setAccountOpen]=useState(false);
  const [checkoutOpen,setCheckoutOpen]=useState(false);
  const [checkoutBusy,setCheckoutBusy]=useState(false);
  const [checkoutError,setCheckoutError]=useState('');
  const [orderResult,setOrderResult]=useState(null);
  const [selectedProduct,setSelectedProduct]=useState(null);
  const [customer,setCustomer]=useState({name:'',phone:'',email:'',address:'',city:'',postalCode:'',note:''});
  const [menuOpen,setMenuOpen]=useState(false);
  const [activeSlide,setActiveSlide]=useState(0);
  const [products,setProducts]=useState([]);
  const [dbCategories,setDbCategories]=useState([]);
  const [dataStatus,setDataStatus]=useState(isSupabaseConfigured?'loading':'error');
  const [dataMessage,setDataMessage]=useState('در حال دریافت اطلاعات فروشگاه…');
  const [isAdminPage,setIsAdminPage]=useState(()=>window.location.hash==='#admin'||window.location.pathname.startsWith('/admin'));

  useEffect(()=>{const timer=setInterval(()=>setActiveSlide(n=>(n+1)%slides.length),6000);return()=>clearInterval(timer);},[]);
  useEffect(()=>{
    const onHash=()=>setIsAdminPage(window.location.hash==='#admin'||window.location.pathname.startsWith('/admin'));
    window.addEventListener('hashchange',onHash);
    return()=>window.removeEventListener('hashchange',onHash);
  },[]);
  useEffect(()=>{
    if(!supabase){setDataStatus('error');setDataMessage('اتصال فروشگاه پیکربندی نشده است.');return;}
    let active=true;
    (async()=>{
      try{
        const [productResult,categoryResult]=await Promise.all([
          supabase.from('products').select('id,name,category,description,image_url,weight_grams,karat,price_toman,stock,is_active,created_at,tag')
            .eq('is_active',true).order('created_at',{ascending:false}),
          supabase.from('categories').select('id,name,slug,sort_order,is_active')
            .eq('is_active',true).order('sort_order',{ascending:true})
        ]);
        if(!active)return;
        if(productResult.error){setDataStatus('error');setProducts([]);setDataMessage('دریافت محصولات ناموفق بود؛ برای جلوگیری از نمایش قیمت نادرست، اطلاعات نمونه نمایش داده نمی‌شود.');}
        else{
          const rows=productResult.data||[];
          setProducts(rows);setDataStatus('connected');
          setDataMessage(rows.length?'محصولات و قیمت‌ها مستقیماً از پایگاه داده مه‌گلد دریافت می‌شوند.':'اتصال برقرار است؛ هنوز محصول فعالی برای نمایش ثبت نشده است.');
        }
        if(!categoryResult.error)setDbCategories(categoryResult.data||[]);
      }catch{
        if(!active)return;
        setDataStatus('error');setProducts([]);setDataMessage('ارتباط با پایگاه داده برقرار نشد.');
      }
    })();
    return()=>{active=false;};
  },[]);
  useEffect(()=>{try{localStorage.setItem('mahgold_cart',JSON.stringify(cart));}catch{}},[cart]);

  const categories=useMemo(()=>{
    const rows=dbCategories.map(row=>row.name).filter(Boolean);
    return ['همه محصولات',...(rows.length?[...new Set(rows)]:presetCategories.slice(1))];
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
  const cartCount=cart.reduce((sum,item)=>sum+Number(item.qty||0),0);
  const cartTotal=cart.reduce((sum,item)=>sum+Number(item.price_toman||0)*Number(item.qty||0),0);

  const addToCart=product=>{
    if(!supabase||dataStatus!=='connected'||!product.id){setCheckoutError('اتصال فروشگاه برقرار نیست.');return;}
    setCart(old=>{
      const previous=old.find(item=>item.id===product.id);
      const nextQty=(previous?.qty||0)+1;
      if(nextQty>Number(product.stock||0)){setCheckoutError('تعداد انتخاب‌شده از موجودی محصول بیشتر است.');return old;}
      return previous?old.map(item=>item.id===product.id?{...item,qty:nextQty}:item):[...old,{...product,qty:1}];
    });
    setCheckoutError('');
  };
  const changeQuantity=(id,delta)=>setCart(old=>old.map(item=>item.id===id?{...item,qty:item.qty+delta}:item).filter(item=>item.qty>0&&item.qty<=Number(item.stock||0)));
  const submitOrder=async event=>{
    event.preventDefault();setCheckoutError('');
    if(import.meta.env.VITE_PREVIEW_READONLY==='true'){
      setCheckoutError('پیش‌نمایش به پایگاه داده متصل است، اما ثبت سفارش واقعی برای جلوگیری از تغییر اطلاعات غیرفعال شده است.');
      return;
    }
    if(!supabase||!cart.length)return;
    setCheckoutBusy(true);
    const {data,error}=await supabase.rpc('mahgold_create_order',{
      p_customer_name:customer.name,
      p_customer_phone:toLatinDigits(customer.phone),
      p_customer_email:customer.email||null,
      p_shipping_address:[customer.city,customer.postalCode,customer.address].filter(Boolean).join(' · '),
      p_customer_note:customer.note||'',
      p_items:cart.map(item=>({product_id:item.id,quantity:item.qty}))
    });
    setCheckoutBusy(false);
    if(error){setCheckoutError(error.message||'ثبت سفارش انجام نشد.');return;}
    setOrderResult(data);setCart([]);setCheckoutOpen(false);setCartOpen(false);
  };
  const openAdmin=()=>{window.location.hash='admin';setIsAdminPage(true);setMenuOpen(false);};

  if(isAdminPage)return <AdminPanel/>;

  return <div dir="rtl" className="min-h-screen bg-background text-foreground">
    <div className="ref-announcement">ارسال امن و بسته‌بندی ویژه <span className="text-gold">✦</span> پشتیبانی مه‌گلد <span className="text-gold">✦</span> همراه انتخاب شما</div>

    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl transition-shadow">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:h-[72px] md:px-7">
        <button aria-label="منو" className="ref-mobile-menu md:hidden" onClick={()=>setMenuOpen(v=>!v)}><Menu size={20}/></button>
        <a aria-label="مه‌گلد - صفحه اصلی" className="ref-brand" href="#home">
          <img src={BASE+'mahgold-mark-B9IfGU60.png'} alt=""/>
          <span>مه‌گلد</span>
        </a>
        <nav className={(menuOpen?'flex':'hidden')+' ref-mobile-links md:flex md:items-center md:gap-8 text-sm font-medium text-muted-foreground'}>
          <a className="transition-colors hover:text-gold-deep" href="#categories" onClick={()=>setMenuOpen(false)}>دسته‌بندی‌ها</a>
          <a className="transition-colors hover:text-gold-deep" href="#shop" onClick={()=>setMenuOpen(false)}>فروشگاه</a>
          <a className="transition-colors hover:text-gold-deep" href="#story" onClick={()=>setMenuOpen(false)}>درباره مه‌گلد</a>
        </nav>
        <div className="flex items-center gap-2">
          <button className="hidden h-10 items-center justify-center rounded-full border border-input bg-background px-5 text-xs font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground md:inline-flex" onClick={()=>setAccountOpen(true)}>ورود / ثبت‌نام</button>
          <button aria-label="سبد خرید" className="relative inline-flex h-10 items-center justify-center gap-2 rounded-full bg-ink px-3 text-xs font-semibold text-ink-foreground transition-all hover:bg-gold-deep md:px-5" onClick={()=>setCartOpen(true)}>
            <ShoppingBag size={16}/><span className="hidden md:inline">سبد خرید</span>{cartCount>0&&<span className="absolute -left-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-ink">{money(cartCount)}</span>}
          </button>
        </div>
      </div>
      {menuOpen&&<nav className="ref-mobile-links flex flex-col gap-4 border-t border-border bg-background px-5 py-4 text-sm text-muted-foreground md:hidden">
        <a href="#categories" onClick={()=>setMenuOpen(false)}>دسته‌بندی‌ها</a><a href="#shop" onClick={()=>setMenuOpen(false)}>فروشگاه</a><a href="#story" onClick={()=>setMenuOpen(false)}>درباره مه‌گلد</a>
        <button className="text-right" onClick={()=>{setAccountOpen(true);setMenuOpen(false);}}>ورود / ثبت‌نام</button>
      </nav>}
    </header>

    <main className="min-h-[60vh]" id="home">
      <section aria-label="اسلایدهای مه‌گلد" aria-roledescription="carousel" className="relative h-[560px] overflow-hidden bg-ink text-ink-foreground md:h-[640px]">
        {slides.map((slide,index)=><div key={slide.image} aria-hidden={activeSlide!==index} className={'absolute inset-0 transition-opacity duration-1000 '+(activeSlide===index?'z-10 opacity-100':'pointer-events-none z-0 opacity-0')}>
          <img alt={slide.title} className="h-full w-full object-cover transition-transform duration-[7000ms] ease-out" src={slide.image} loading={index===0?'eager':'lazy'} style={{transform:activeSlide===index?'scale(1.05)':'scale(1)'}}/>
          <div className="slide-shade absolute inset-0"/>
          <div className="absolute inset-0 mx-auto flex max-w-7xl flex-col justify-end px-6 pb-20 md:justify-center md:px-10 md:pb-0">
            <div className="max-w-xl">
              <div className="eyebrow animate-rise text-gold-light">{slide.eyebrow}</div>
              <h1 className="animate-rise mt-3 text-[2.1rem] font-medium leading-[1.45] [animation-delay:120ms] md:text-6xl md:leading-[1.4]">{slide.title}</h1>
              <p className="animate-rise mt-4 max-w-md text-sm leading-8 text-ink-muted [animation-delay:240ms] md:text-[15px]">{slide.description}</p>
              <button className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-gold-gradient px-7 text-sm font-bold text-ink shadow-gold transition-all hover:-translate-y-0.5 hover:brightness-110" onClick={()=>{setCategory(slide.category);document.getElementById('shop')?.scrollIntoView({behavior:'smooth'});}}>
                {slide.button}<ArrowLeft size={16}/>
              </button>
            </div>
          </div>
        </div>)}
        <div className="absolute inset-x-0 bottom-7 z-20 flex justify-center gap-2">
          {slides.map((slide,index)=><button key={slide.image} aria-label={'اسلاید '+(index+1)} aria-current={activeSlide===index} className={'relative h-1.5 overflow-hidden rounded-full bg-ink-foreground/30 transition-all duration-500 '+(activeSlide===index?'w-10':'w-4 hover:bg-ink-foreground/60')} onClick={()=>setActiveSlide(index)}>
            {activeSlide===index&&<span className="absolute inset-y-0 right-0 bg-gold" style={{width:'100%'}}/>}
          </button>)}
        </div>
        <div className="absolute bottom-6 left-8 z-20 hidden gap-2 md:flex">
          <button aria-label="اسلاید قبلی" className="flex size-11 items-center justify-center rounded-full border border-ink-foreground/30 bg-ink/30 backdrop-blur transition hover:border-gold hover:text-gold-light" onClick={()=>setActiveSlide(i=>(i+slides.length-1)%slides.length)}><ChevronRight size={18}/></button>
          <button aria-label="اسلاید بعدی" className="flex size-11 items-center justify-center rounded-full border border-ink-foreground/30 bg-ink/30 backdrop-blur transition hover:border-gold hover:text-gold-light" onClick={()=>setActiveSlide(i=>(i+1)%slides.length)}><ChevronLeft size={18}/></button>
        </div>
      </section>

      <section className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 md:px-7 md:py-24" id="categories">
        <div className="mb-8 flex items-end justify-between gap-5">
          <div><div className="eyebrow text-gold-deep">DISCOVER MAHGOLD</div><h2 className="mt-3 text-2xl font-semibold md:text-3xl">از میان مجموعه‌ها انتخاب کنید</h2></div>
          <p className="hidden text-xs text-muted-foreground md:block">جزئیاتی برای سلیقه‌های خاص</p>
        </div>
        <div className="ref-category-grid">
          {tiles.map(tile=><button key={tile.name} className="ref-category-card" onClick={()=>{setCategory(tile.name);document.getElementById('shop')?.scrollIntoView({behavior:'smooth'});}}>
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

      <section className="scroll-mt-16 bg-sand-gradient py-16 md:py-24" id="shop">
        <div className="mx-auto max-w-7xl px-4 md:px-7">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div><div className="eyebrow text-gold-deep">THE CURATED EDIT</div><h2 className="mt-2 text-2xl font-semibold md:text-3xl">منتخب‌های مه‌گلد</h2></div>
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
              <button className="block w-full overflow-hidden text-right" onClick={()=>setSelectedProduct(product)} aria-label={'مشاهده '+product.name}>
                <ProductImage product={product}/>
              </button>
              <div className="ref-product-body">
                <span className="text-[10px] text-muted-foreground md:text-[11px]">{product.category}</span>
                <button className="ref-product-name line-clamp-1 text-right" onClick={()=>setSelectedProduct(product)}>{product.name}</button>
                <div className="mt-0.5 text-[11px] text-muted-foreground">{[product.weight_grams?gram(product.weight_grams):null,product.karat?money(product.karat)+' عیار':null].filter(Boolean).join(' · ')}</div>
                <div className="ref-product-bottom">
                  <strong>{money(product.price_toman)} <small>تومان</small></strong>
                  <button aria-label={'افزودن '+product.name+' به سبد'} className="ref-add-button" disabled={Number(product.stock||0)<1||dataStatus!=='connected'} onClick={()=>addToCart(product)}><Plus size={17}/></button>
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
        <div className="h-64 overflow-hidden md:h-auto"><img alt="جزئیات زیورآلات مه‌گلد" className="h-full w-full object-cover" loading="lazy" src={storyImage}/></div>
        <div className="flex flex-col justify-center px-6 py-14 md:px-[10%]">
          <div className="eyebrow text-gold-light">A Story of Elegance</div>
          <h2 className="mt-3 text-3xl font-normal leading-[1.5] md:text-4xl">زیبایی‌ای که<br/>از مد عبور می‌کند.</h2>
          <p className="mt-4 max-w-md text-sm leading-8 text-ink-muted">در مه‌گلد، هر انتخاب فرصتی‌ست برای بیان سلیقه شخصی. ما به طراحی ماندگار، جزئیات دقیق و تجربه‌ای ساده و دلنشین باور داریم.</p>
          <div><button className="mt-8 h-12 rounded-lg bg-gold-gradient px-7 text-sm font-bold text-ink shadow-gold transition-all hover:-translate-y-0.5 hover:brightness-110" onClick={()=>document.getElementById('shop')?.scrollIntoView({behavior:'smooth'})}>مشاهده محصولات</button></div>
        </div>
      </section>
    </main>

    <footer className="bg-ink px-6 pb-28 pt-14 text-center text-xs leading-8 text-ink-muted md:pb-14">
      <img alt="مه‌گلد" className="mx-auto mb-4 h-36 w-auto" height="630" loading="lazy" src={BASE+'mahgold-logo-CEBRsLr5.png'} width="525"/>
      <div>طلایی به زیباییِ لحظه‌های تو</div>
      <div className="mt-3 flex flex-col items-center gap-1 md:flex-row md:justify-center md:gap-6">
        <span className="inline-flex items-center gap-1.5"><Phone className="size-3.5 text-gold"/> شماره تماس: به‌زودی</span>
        <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5 text-gold"/> نشانی: به‌زودی اعلام می‌شود</span>
      </div>
      <div className="mt-3 text-[11px] opacity-60">© ۱۴۰۵ فروشگاه آنلاین مه‌گلد · زیورآلات طلا</div>
      <button className="mt-3 text-xs text-gold-light underline-offset-4 hover:underline" onClick={openAdmin}>ورود مدیریت</button>
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
              <div><h4>{item.name}</h4><strong>{money(item.price_toman)} تومان</strong><div className="ref-qty">
                <button aria-label="کاهش تعداد" onClick={()=>changeQuantity(item.id,-1)}><Minus size={13}/></button><span className="text-xs">{money(item.qty)}</span><button aria-label="افزایش تعداد" onClick={()=>changeQuantity(item.id,1)}><Plus size={13}/></button>
              </div></div>
              <button className="ref-remove" aria-label="حذف محصول" onClick={()=>setCart(old=>old.filter(p=>p.id!==item.id))}><X size={15}/></button>
            </div>)}</div>
            <div className="ref-cart-summary"><span>جمع سبد خرید</span><b>{money(cartTotal)} تومان</b></div>
            <p className="mb-4 text-[11px] leading-7 text-muted-foreground">مبلغ نهایی و موجودی هنگام ثبت سفارش در سرور دوباره بررسی می‌شود.</p>
            <button className="h-12 rounded-lg bg-gold-gradient text-sm font-bold text-ink ref-full" onClick={()=>setCheckoutOpen(true)}>ادامه و ثبت سفارش <ArrowLeft className="mr-2 inline" size={16}/></button>
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

    {selectedProduct&&<div className="ref-overlay" onClick={()=>setSelectedProduct(null)}>
      <section className="ref-dialog ref-dialog-wide" onClick={e=>e.stopPropagation()}>
        <div className="ref-dialog-head"><span className="eyebrow text-gold-deep">MAHGOLD · PRODUCT DETAILS</span><button className="ref-close" aria-label="بستن" onClick={()=>setSelectedProduct(null)}><X/></button></div>
        <div className="grid gap-6 md:grid-cols-2">
          <ProductImage product={selectedProduct} className="ref-product-modal-image"/>
          <div className="ref-product-modal-copy">
            <span className="text-xs text-muted-foreground">{selectedProduct.category}</span>
            <h2>{selectedProduct.name}</h2>
            <p>{selectedProduct.description||'جزئیاتی ظریف و انتخابی ماندگار از مجموعه مه‌گلد.'}</p>
            <div className="grid gap-2 text-xs text-muted-foreground"><span>وزن: {gram(selectedProduct.weight_grams)}</span><span>عیار: {money(selectedProduct.karat||18)}</span><span>موجودی: {money(selectedProduct.stock||0)}</span></div>
            <strong className="ref-detail-price">{money(selectedProduct.price_toman)} تومان</strong>
            <button className="h-12 rounded-lg bg-gold-gradient text-sm font-bold text-ink ref-full" disabled={Number(selectedProduct.stock||0)<1} onClick={()=>{addToCart(selectedProduct);setSelectedProduct(null);setCartOpen(true);}}>افزودن به سبد خرید <ShoppingBag className="mr-2 inline" size={16}/></button>
          </div>
        </div>
      </section>
    </div>}

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
