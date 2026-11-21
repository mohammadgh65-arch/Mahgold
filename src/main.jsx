import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './reference-template.css';

// GitHub Pages preview intentionally does not register the production service worker.
if ('serviceWorker' in navigator && import.meta.env.PROD && import.meta.env.MODE !== 'github-pages') {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
