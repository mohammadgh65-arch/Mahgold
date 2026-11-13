import { useEffect, useMemo, useState } from 'react';
import { Search, ShoppingBag, Menu, X, ArrowLeft, Sparkles, ShieldCheck, Gem, Truck, Heart, Plus, Minus } from 'lucide-react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import AdminPanel from './Admin.jsx';

const categories = ['همه محصولات', 'طلای زینتی', 'طلای آب‌شده', 'سکه', 'شمش', 'انگشتر', 'گردنبند', 'دستبند', 'گوشواره'];
const demoProducts = [
  { id: 'demo-1', name: 'گردنبند ظریف ماه', category: 'گردنبند', weight_grams: 1.2, price_toman: 18950000, mark: '✧', tone: 'rose' },
  { id: 'demo-2', name: 'انگشتر مینیمال آوا', category: 'انگشتر', weight_grams: 1.6, price_toman: 24600000, mark: '◇', tone: 'sand' },
  { id: 'demo-3', name: 'دستبند زنجیری نور', category: 'دستبند', weight_grams: 2.1, price_toman: 31200000, mark: '⌁', tone: 'blue' },
  { id: 'demo-4', name: 'گوشواره مروارید', category: 'گوشواره', weight_grams: 1.4, price_toman: 22800000, mark: '❋', tone: 'plum' }
];
const money = value => new Intl.NumberFormat('fa-IR').format(Number(value || 0));
const weight = value => `${new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 3 }).format(Number(value || 0))} گرم`;

function ProductArt({ product }) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(product.image_url) && !imageFailed;
  return <div className={`product-art art-${product.tone || 'sand'}`} aria-label={product.name}>
    {showImage ? <img className="real-product-image" src={product.image_url} alt={product.name} loading="lazy" onError={() => setImageFailed(true)} /> : <>
      <div className="art-orbit"></div><span className="art-symbol">{product.mark || '✧'}</span><span className="art-glint">✦</span>
    </>}
  </div>;
}

export default function App() {
  const [category, setCategory] = useState('همه محصولات');
  const [query, setQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [orderResult, setOrderResult] = useState(null);
  const [customer, setCustomer] = useState({name:'',phone:'',email:'',address:'',note:''});
  const [menuOpen, setMenuOpen] = useState(false);
  const [products, setProducts] = useState(demoProducts);
  const [quote, setQuote] = useState(null);
  const [dataStatus, setDataStatus] = useState(isSupabaseConfigured ? 'loading' : 'demo');
  const [dataMessage, setDataMessage] = useState('قیمت‌ها و محصولات این نسخه صرفاً نمایشی هستند');

  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    (async () => {
      try {
        const [productResult, quoteResult] = await Promise.all([
          supabase.from('products').select('id,name,category,description,image_url,weight_grams,karat,price_toman,stock,is_active').eq('is_active', true).order('created_at', { ascending: false }),
          supabase.from('market_quotes').select('symbol,title,price_toman,source,observed_at,is_live').order('observed_at', { ascending: false }).limit(1).maybeSingle()
        ]);
        if (!alive) return;
        if (productResult.error) {
          setDataStatus('error');
          setProducts([]);
          setDataMessage('دریافت محصولات ناموفق بود؛ برای جلوگیری از نمایش قیمت نادرست، اطلاعات نمونه پنهان شده‌اند.');
        } else {
          const rows = productResult.data || [];
          setProducts(rows.map((p, i) => ({ ...p, mark: ['✧','◇','⌁','❋'][i % 4], tone: ['rose','sand','blue','plum'][i % 4] })));
          setDataStatus('connected');
          setDataMessage(rows.length
            ? 'محصولات فعال مستقیماً از پایگاه داده فروشگاه دریافت می‌شوند.'
            : 'اتصال به پایگاه داده برقرار است، اما محصول فعالی برای نمایش پیدا نشد.');
        }
        if (!quoteResult.error && quoteResult.data) setQuote(quoteResult.data);
      } catch {
        if (!alive) return;
        setDataStatus('error');
        setProducts([]);
        setDataMessage('ارتباط با پایگاه داده برقرار نشد؛ سفارش‌گیری موقتاً غیرفعال است.');
      }
    })();
    return () => { alive = false; };
  }, []);

  const filtered = useMemo(() => products.filter(p =>
    (category === 'همه محصولات' || p.category === category || p.name.includes(category)) && p.name.includes(query.trim())
  ), [category, query]);
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  const add = product => {
    if (!supabase || dataStatus !== 'connected' || String(product.id).startsWith('demo-')) { setDataMessage('برای ثبت سفارش، اتصال فروشگاه باید برقرار باشد.'); return; }
    setCart(old => {
      const found = old.find(x => x.id === product.id);
      const nextQty = (found?.qty || 0) + 1;
      if (nextQty > Number(product.stock || 0)) { setCheckoutError('تعداد انتخاب‌شده از موجودی محصول بیشتر است.'); return old; }
      return found ? old.map(x => x.id === product.id ? { ...x, qty: nextQty } : x) : [...old, { ...product, qty: 1 }];
    });
  };
  const submitOrder = async e => {
    e.preventDefault(); setCheckoutError('');
    if (!supabase || !cart.length) return;
    setCheckoutBusy(true);
    const {data,error}=await supabase.rpc('mahgold_create_order',{p_customer_name:customer.name,p_customer_phone:customer.phone,p_customer_email:customer.email,p_shipping_address:customer.address,p_customer_note:customer.note,p_items:cart.map(x=>({product_id:x.id,quantity:x.qty}))});
    setCheckoutBusy(false);
    if(error){setCheckoutError(error.message || 'ثبت سفارش انجام نشد.');return;}
    setOrderResult(data);setCart([]);setCheckoutOpen(false);
  };
  const changeQty = (id, delta) => setCart(old => old.map(x => x.id === id ? { ...x, qty: x.qty + delta } : x).filter(x => x.qty > 0));

  if (window.location.pathname.startsWith('/admin')) return <AdminPanel />;

  return <div className="site-shell">
    <div className="announcement"><span>درخششِ ماندگار، انتخابی از جنس سلیقه</span><span>مشاوره خرید: به‌زودی</span></div>
    <header className="site-header">
      <button className="icon-btn mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="منو"><Menu size={21}/></button>
      <nav className={`main-nav ${menuOpen ? 'nav-open' : ''}`}>
        <a href="#home" onClick={() => setMenuOpen(false)}>خانه</a><a href="#collections" onClick={() => setMenuOpen(false)}>دسته‌بندی‌ها</a><a href="#featured" onClick={() => setMenuOpen(false)}>منتخب مه‌گلد</a><a href="#story" onClick={() => setMenuOpen(false)}>داستان ما</a>
      </nav>
      <a className="brand" href="#home"><span className="brand-mark">م</span><span><strong>مه‌گلد</strong><small>MAHGOLD GALLERY</small></span></a>
      <div className="header-actions">
        <label className="search-box"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="جست‌وجوی محصول"/></label>
        <button className="icon-btn bag-btn" onClick={() => setCartOpen(true)} aria-label="سبد خرید"><ShoppingBag size={19}/>{count > 0 && <b>{count}</b>}</button>
      </div>
    </header>
    <main id="home">
      <section className="hero">
        <div className="hero-copy"><span className="eyebrow"><Sparkles size={14}/> انتخابی برای لحظه‌های خاص</span>
          <h1>زیبایی، در جزئیاتی<br/><em>که ماندگار می‌شوند</em></h1>
          <p>در مه‌گلد، هر قطعه روایت ظریفی از سلیقه و درخشش است؛ مجموعه‌ای از زیورآلات طلا برای لحظه‌هایی که ارزش به‌یادماندن دارند.</p>
          <div className="hero-actions"><a className="primary-btn" href="#featured">مشاهده محصولات <ArrowLeft size={17}/></a><a className="text-link" href="#story">داستان مه‌گلد</a></div>
          <div className="hero-caption"><span></span> ظرافتی که در نگاه اول دیده می‌شود</div>
        </div>
        <div className="hero-visual" aria-label="ترکیب هنری طلای زینتی"><div className="hero-halo"></div><div className="hero-pendant">م</div><div className="hero-chain"></div><span className="hero-stamp">MAH<br/>GOLD</span><span className="hero-side-note">THE ART OF GOLD</span></div>
        <div className="hero-index"><span>۰۱</span><i></i><span>۰۳</span></div>
      </section>
      <section className="trust-row"><div><Gem/><span><b>انتخاب بااصالت</b><small>توجه به کیفیت و جزئیات</small></span></div><div><ShieldCheck/><span><b>اطلاعات شفاف</b><small>جزئیات پیش از ثبت سفارش</small></span></div><div><Truck/><span><b>ارسال مطمئن</b><small>اطلاعات ارسال به‌زودی</small></span></div></section>
      {quote && <section className="quote-strip"><div><span>{quote.title || 'آخرین نرخ ثبت‌شده طلا'}</span><strong>{money(quote.price_toman)} <small>تومان</small></strong><em className={quote.is_live ? 'live' : 'stale'}>{quote.is_live ? 'نرخ زنده' : 'ثبت دستی · غیرزنده'}</em></div><small>زمان ثبت: {new Date(quote.observed_at).toLocaleString('fa-IR')}</small></section>}
      <section className="collection-section" id="collections"><div className="section-heading"><div><span className="eyebrow dark">EXPLORE THE COLLECTION</span><h2>دنیای مه‌گلد</h2><p>قطعه‌ای برای هر سلیقه، و هر لحظه</p></div><a href="#featured" className="all-link">دیدن همه <ArrowLeft size={16}/></a></div>
        <div className="category-grid">{['طلای زینتی','انگشتر','گردنبند','دستبند'].map((c,i)=><button key={c} className={`category-tile cat-${i}`} onClick={()=>{setCategory(c);document.getElementById('featured')?.scrollIntoView({behavior:'smooth'});}}><span className="category-icon">{['✧','◇','⌁','❋'][i]}</span><b>{c}</b><small>مشاهده مجموعه</small></button>)}</div>
      </section>
      <section className="featured-section" id="featured"><div className="section-heading"><div><span className="eyebrow dark">CURATED FOR YOU</span><h2>منتخب مه‌گلد</h2><p>{dataStatus === 'connected' ? 'محصولات فعال فروشگاه' : 'درخشش‌هایی که دوستشان خواهید داشت'}</p></div><div className="filter-tabs">{categories.map(c=><button key={c} className={category===c?'selected':''} onClick={()=>setCategory(c)}>{c}</button>)}</div></div>
        <div className="product-grid">{filtered.map(p=><article className="product-card" key={p.id}><div className="product-image"><span className="product-label">منتخب</span><button className="heart-btn" aria-label="علاقه‌مندی"><Heart size={17}/></button><ProductArt product={p}/></div><div className="product-info"><div className="product-meta"><span>{p.category}</span><span>{weight(p.weight_grams)}</span></div><h3>{p.name}</h3><div className="product-bottom"><strong>{money(p.price_toman)} <small>تومان</small></strong><button onClick={()=>add(p)} disabled={Number(p.stock||0)<1 || dataStatus!=='connected'} aria-label="افزودن به سبد"><Plus size={17}/></button></div></div></article>)}</div>
        {filtered.length===0 && <div className="no-results">محصولی با این مشخصات پیدا نشد.</div>}
      </section>
      <section className="story-section" id="story"><div className="story-seal">M<span>✧</span></div><div><span className="eyebrow">A LITTLE STORY, A LASTING GLOW</span><h2>زیبایی، فراتر از یک زیور</h2><p>مه‌گلد با الهام از سادگیِ لوکس شکل گرفته است؛ جایی که فرم، ظرافت و حس خوب کنار هم قرار می‌گیرند. اینجا هر انتخاب، امضای شخصی شماست.</p><a href="#featured" className="story-link">کشف مجموعه <ArrowLeft size={16}/></a></div></section>
    </main>
    <footer className="site-footer"><a className="brand footer-brand" href="#home"><span className="brand-mark">م</span><span><strong>مه‌گلد</strong><small>MAHGOLD GALLERY</small></span></a><p>درخششِ ماندگار، انتخابی از جنس سلیقه</p><small>© مه‌گلد — نسخه مستقل آزمایشی</small></footer>
    <div className="demo-ribbon">{dataMessage}</div>
    {orderResult && <div className="drawer-backdrop"><section className="cart-drawer order-success"><button className="icon-btn" onClick={()=>setOrderResult(null)}><X/></button><h2>درخواست سفارش ثبت شد</h2><p>شماره سفارش: <b>{money(orderResult.order_number)}</b></p><p>مبلغ: <b>{money(orderResult.total_toman)} تومان</b></p><p>موجودی برای ۱۵ دقیقه رزرو شده است. پرداخت آنلاین هنوز به درگاه متصل نیست؛ برای نهایی‌کردن خرید با فروشگاه هماهنگ کنید.</p><button className="primary-btn" onClick={()=>setOrderResult(null)}>متوجه شدم</button></section></div>}
    {cartOpen && <div className="drawer-backdrop" onClick={()=>setCartOpen(false)}><aside className="cart-drawer" onClick={e=>e.stopPropagation()}><div className="drawer-head"><h3>سبد خرید</h3><button className="icon-btn" onClick={()=>setCartOpen(false)}><X/></button></div>{cart.length===0?<div className="cart-empty"><ShoppingBag size={32}/><p>سبد خرید شما خالی است.</p></div>:<>{cart.map(item=><div className="cart-line" key={item.id}><div><b>{item.name}</b><small>{money(item.price_toman)} تومان</small><div className="qty-control"><button onClick={()=>changeQty(item.id,-1)}><Minus size={13}/></button><span>{item.qty}</span><button onClick={()=>changeQty(item.id,1)}><Plus size={13}/></button></div></div><ProductArt product={item}/></div>)}<p className="cart-warning">مبلغ نهایی در سرور بر اساس قیمت ثبت‌شده محصول محاسبه می‌شود. موجودی هنگام ثبت سفارش ۱۵ دقیقه رزرو می‌شود.</p><button className="primary-btn checkout-button" onClick={()=>setCheckoutOpen(true)}>ادامه و ثبت سفارش</button></>}</aside></div>}
    {checkoutOpen && <div className="drawer-backdrop" onClick={()=>setCheckoutOpen(false)}><form className="cart-drawer checkout-form" onClick={e=>e.stopPropagation()} onSubmit={submitOrder}><div className="drawer-head"><h3>اطلاعات سفارش</h3><button type="button" className="icon-btn" onClick={()=>setCheckoutOpen(false)}><X/></button></div><label>نام و نام خانوادگی<input required minLength="2" value={customer.name} onChange={e=>setCustomer({...customer,name:e.target.value})}/></label><label>شماره تماس<input required type="tel" minLength="8" value={customer.phone} onChange={e=>setCustomer({...customer,phone:e.target.value})}/></label><label>ایمیل (اختیاری)<input type="email" value={customer.email} onChange={e=>setCustomer({...customer,email:e.target.value})}/></label><label>نشانی ارسال<input required value={customer.address} onChange={e=>setCustomer({...customer,address:e.target.value})}/></label><label>توضیحات سفارش<textarea value={customer.note} onChange={e=>setCustomer({...customer,note:e.target.value})}/></label><p>جمع سبد: {money(cart.reduce((n,x)=>n+Number(x.price_toman)*x.qty,0))} تومان</p>{checkoutError&&<p className="cart-warning">{checkoutError}</p>}<button className="primary-btn" disabled={checkoutBusy}>{checkoutBusy?'در حال ثبت…':'ثبت سفارش و رزرو موجودی'}</button><small>ثبت سفارش به معنی پرداخت نیست. تا زمان اتصال درگاه، وضعیت سفارش «در انتظار پرداخت» باقی می‌ماند.</small></form></div>}
  </div>;
}