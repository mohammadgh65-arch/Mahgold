import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './reference-template.css';
import './utility-fallback.css';

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    const workerUrl = new URL('sw.js', import.meta.env.BASE_URL).toString();
    navigator.serviceWorker.register(workerUrl, { scope: import.meta.env.BASE_URL }).catch(() => {});
  });
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
