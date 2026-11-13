import { useMemo, useState } from 'react';
import { Search, ShoppingBag, Menu, X, ArrowLeft, Sparkles, ShieldCheck, Gem, Truck, Heart, Plus, Minus } from 'lucide-react';
import { isSupabaseConfigured } from './lib/supabase';

const categories = ['همه محصولات', 'گردنبند', 'انگشتر', 'دستبند', 'گوشواره'];
const products = [
  { id: 1, name: 'گردنبند ظریف ماه', category: 'گردنبند', weight: '۱٫۲ گرم', price: '۱۸٬۹۵۰٬۰۰۰', mark: '✧', tone: 'rose' },
  { id: 2, name: 'انگشتر مینیمال آوا', category: 'انگشتر', weight: '۱٫۶ گرم', price: '۲۴٬۶۰۰٬۰۰۰', mark: '◇', tone: 'sand' },
  { id: 3, name: 'دستبند زنجیری نور', category: 'دستبند', weight: '۲٫۱ گرم', price: '۳۱٬۲۰۰٬۰۰۰', mark: '⌁', tone: 'blue' },
  { id: 4, name: 'گوشواره مروارید', category: 'گوشواره', weight: '۱٫۴ گرم', price: '۲۲٬۸۰۰٬۰۰۰', mark: '❋', tone: 'plum' },
  { id: 5, name: 'گردنبند بی‌نهایت', category: 'گردنبند', weight: '۱٫۸ گرم', price: '۲۷٬۴۰۰٬۰۰۰', mark: '∞', tone: 'sand' },
  { id: 6, name: 'انگشتر نگین‌دار', category: 'انگشتر', weight: '۲ گرم', price: '۳۴٬۹۰۰٬۰۰۰', mark: '✧', tone: 'rose' },
  { id: 7, name: 'دستبند کارتیه ظریف', category: 'دستبند', weight: '۲٫۴ گرم', price: '۳۶٬۷۰۰٬۰۰۰', mark: '⌘', tone: 'blue' },
  { id: 8, name: 'گوشواره حلقه‌ای', category: 'گوشواره', weight: '۱٫۱ گرم', price: '۱۷٬۸۰۰٬۰۰۰', mark: '◌', tone: 'plum' }
];

function ProductArt({ product }) {
  return <div className={`product-art art-${product.tone}`} aria-label={product.name}>
    <div className="art-orbit"></div><span className="art-symbol">{product.mark}</span>
    <span className="art-glint">✦</span>
  </div>;
}

export default function App() {
  const [category, setCategory] = useState('همه محصولات');
  const [query, setQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState('قیمت‌ها و محصولات این نسخه صرفاً نمایشی هستند');
  const filtered = useMemo(() => products.filter(p =>
    (category === 'همه محصولات' || p.category === category) && p.name.includes(query.trim())
  ), [category, query]);
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  const add = (product) => setCart(old => {
    const found = old.find(x => x.id === product.id);
    return found ? old.map(x => x.id === product.id ? { ...x, qty: x.qty + 1 } : x) : [...old, { ...product, qty: 1 }];
  });
  const changeQty = (id, delta) => setCart(old => old.map(x => x.id === id ? { ...x, qty: x.qty + delta } : x).filter(x => x.qty > 0));

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
      <section className="collection-section" id="collections"><div className="section-heading"><div><span className="eyebrow dark">EXPLORE THE COLLECTION</span><h2>دنیای مه‌گلد</h2><p>قطعه‌ای برای هر سلیقه، و هر لحظه</p></div><a href="#featured" className="all-link">دیدن همه <ArrowLeft size={16}/></a></div>
        <div className="category-grid">{categories.slice(1).map((c,i)=><button key={c} className={`category-tile cat-${i}`} onClick={()=>{setCategory(c);document.getElementById('featured')?.scrollIntoView({behavior:'smooth'});}}><span className="category-icon">{['✧','◇','⌁','❋'][i]}</span><b>{c}</b><small>مشاهده مجموعه</small></button>)}</div>
      </section>
      <section className="featured-section" id="featured"><div className="section-heading"><div><span className="eyebrow dark">CURATED FOR YOU</span><h2>منتخب مه‌گلد</h2><p>درخشش‌هایی که دوستشان خواهید داشت</p></div><div className="filter-tabs">{categories.map(c=><button key={c} className={category===c?'selected':''} onClick={()=>setCategory(c)}>{c}</button>)}</div></div>
        <div className="product-grid">{filtered.map(p=><article className="product-card" key={p.id}><div className="product-image"><span className="product-label">منتخب</span><button className="heart-btn" aria-label="علاقه‌مندی"><Heart size={17}/></button><ProductArt product={p}/></div><div className="product-info"><div className="product-meta"><span>{p.category}</span><span>{p.weight}</span></div><h3>{p.name}</h3><div className="product-bottom"><strong>{p.price} <small>تومان</small></strong><button onClick={()=>add(p)} aria-label="افزودن به سبد"><Plus size={17}/></button></div></div></article>)}</div>
        {filtered.length===0 && <div className="no-results">محصولی با این مشخصات پیدا نشد.</div>}
      </section>
      <section className="story-section" id="story"><div className="story-seal">M<span>✧</span></div><div><span className="eyebrow">A LITTLE STORY, A LASTING GLOW</span><h2>زیبایی، فراتر از یک زیور</h2><p>مه‌گلد با الهام از سادگیِ لوکس شکل گرفته است؛ جایی که فرم، ظرافت و حس خوب کنار هم قرار می‌گیرند. اینجا هر انتخاب، امضای شخصی شماست.</p><a href="#featured" className="story-link">کشف مجموعه <ArrowLeft size={16}/></a></div></section>
    </main>
    <footer className="site-footer"><a className="brand footer-brand" href="#home"><span className="brand-mark">م</span><span><strong>مه‌گلد</strong><small>MAHGOLD GALLERY</small></span></a><p>درخششِ ماندگار، انتخابی از جنس سلیقه</p><small>© مه‌گلد — نسخه مستقل آزمایشی</small></footer>
    <div className="demo-ribbon">{isSupabaseConfigured ? 'اتصال Supabase تنظیم شده؛ دریافت داده هنوز فعال نشده' : 'پیش‌نمایش مستقل · داده‌های نمایشی'}</div>
    {cartOpen && <div className="drawer-backdrop" onClick={()=>setCartOpen(false)}><aside className="cart-drawer" onClick={e=>e.stopPropagation()}><div className="drawer-head"><h3>سبد خرید آزمایشی</h3><button className="icon-btn" onClick={()=>setCartOpen(false)}><X/></button></div>{cart.length===0?<div className="cart-empty"><ShoppingBag size={32}/><p>سبد خرید شما خالی است.</p></div>:<>{cart.map(item=><div className="cart-line" key={item.id}><div><b>{item.name}</b><small>{item.price} تومان</small><div className="qty-control"><button onClick={()=>changeQty(item.id,-1)}><Minus size={13}/></button><span>{item.qty}</span><button onClick={()=>changeQty(item.id,1)}><Plus size={13}/></button></div></div><ProductArt product={item}/></div>)}<p className="cart-warning">این سبد صرفاً برای آزمایش رابط کاربری است و سفارشی ثبت نمی‌کند.</p></>}</aside></div>}
  </div>;
}