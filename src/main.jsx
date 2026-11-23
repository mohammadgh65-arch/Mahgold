import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './reference-template.css';

// GitHub Pages serves the SPA fallback through 404.html. Restore the requested
// same-origin route before React checks the admin pathname.
const redirectPath = new URLSearchParams(window.location.search).get('p');
if (redirectPath && redirectPath.startsWith('/') && !redirectPath.startsWith('//')) {
  window.history.replaceState(null, '', redirectPath);
}

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
