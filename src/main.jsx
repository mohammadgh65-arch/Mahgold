import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './reference-template.css';
import './simgallery-improvements.css';
import './mahgold-logo-refinement.css';
import './mahgold-theme-unification.css';
import './mahgold-commerce-theme.css';
import './mahgold-editorial-design.css';
import './mahgold-readable-gold.css';
import './mahgold-component-unification.css';
import './mahgold-neutral-announcement-footer.css';
import './mahgold-final-mobile-account-cart.css';
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'}).then(registration=>registration.update()).catch(() => {}));
}
class MahgoldRenderBoundary extends React.Component {
  constructor(props){super(props);this.state={failed:false,error:null,stack:''};}
  static getDerivedStateFromError(error){return {failed:true,error:String(error?.message||error||'خطای ناشناخته')};}
  componentDidCatch(error,info){console.error('[Mahgold render failure]',error,info);this.setState({stack:String(info?.componentStack||'').slice(0,1800)});}
  render(){
    if(this.state.failed)return <div dir="rtl" style={{minHeight:'100vh',display:'grid',placeContent:'center',padding:24,textAlign:'center',fontFamily:'sans-serif',background:'#f8f7fb',color:'#172f50'}}>
      <h1 style={{fontSize:22,marginBottom:12}}>مه‌گلد در حال بازیابی است</h1>
      <p style={{lineHeight:1.9,maxWidth:420}}>بارگذاری این نسخه با خطا مواجه شد. اطلاعات حساب و سفارش‌ها حذف نشده‌اند.</p>
      <details style={{maxWidth:440,margin:'10px auto',textAlign:'right',fontSize:12,overflowWrap:'anywhere'}}><summary>جزئیات خطا برای پشتیبانی</summary><pre style={{whiteSpace:'pre-wrap',direction:'ltr',textAlign:'left'}}>{this.state.error}{this.state.stack?'\n'+this.state.stack:''}</pre></details>
      <button onClick={()=>window.location.reload()} style={{margin:'20px auto',padding:'12px 24px',borderRadius:12,background:'#172f50',color:'#fff',border:0}}>بارگذاری دوباره</button>
    </div>;
    return this.props.children;
  }
}
const rootElement=document.getElementById('root');
if(rootElement)rootElement.removeAttribute('data-booting');
createRoot(rootElement).render(<React.StrictMode><MahgoldRenderBoundary><App /></MahgoldRenderBoundary></React.StrictMode>);