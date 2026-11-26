import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './reference-template.css';
import './mahgold-redesign.css';
import './mahgold-navy-white-pink.css';
import './simgallery-improvements.css';
import './mahgold-final-palette.css';
import './mahgold-header-footer-fix.css';
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
