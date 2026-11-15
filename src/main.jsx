import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './reference-template.css';\nif ('serviceWorker' in navigator && import.meta.env.PROD) {\n  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));\n}
createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
