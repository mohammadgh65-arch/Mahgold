import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './reference-template.css';
import './mahgold-redesign.css';
import './mahgold-navy-white-pink.css';
import './simgallery-improvements.css';
import './mahgold-final-palette.css';
import './mahgold-header-footer-fix.css';
import './mahgold-logo-refinement.css';
import './mahgold-theme-unification.css';
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'}).then(registration=>registration.update()).catch(() => {}));
}
class MahgoldRenderBoundary extends React.Component {
  constructor(props){super(props);this.state={failed:false};}
  static getDerivedStateFromError(){return {failed:true};}
  componentDidCatch(error,info){console.error('[Mahgold render failure]',error,info);}
  render(){
    if(this.state.failed)return <div dir="rtl" style={{minHeight:'100vh',display:'grid',placeContent:'center',padding:24,textAlign:'center',fontFamily:'sans-serif',background:'#f8f7fb',color:'#172f50'}}>
      <h1 style={{fontSize:22,marginBottom:12}}>مه‌گلد در حال بازیابی است</h1>
      <p style={{lineHeight:1.9,maxWidth:420}}>بارگذاری این نسخه با خطا مواجه شد. صفحه را دوباره بارگذاری کنید؛ اطلاعات حساب و سفارش‌ها حذف نمی‌شوند.</p>
      <button onClick={()=>window.location.reload()} style={{margin:'20px auto',padding:'12px 24px',borderRadius:12,background:'#172f50',color:'#fff',border:0}}>بارگذاری دوباره</button>
    </div>;
    return this.props.children;
  }
}
const rootElement=document.getElementById('root');
if(rootElement)rootElement.removeAttribute('data-booting');
createRoot(rootElement).render(<React.StrictMode><MahgoldRenderBoundary><App /></MahgoldRenderBoundary></React.StrictMode>);