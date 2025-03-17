import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

console.log('[Environment]', {
  mode: import.meta.env.MODE,
  apiUrl: import.meta.env.VITE_API_URL,
  isProd: import.meta.env.PROD,
  isDev: import.meta.env.DEV
});

// Add this after the environment log to force a specific API URL if needed
if (!import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL.includes('localhost')) {
  console.warn('[Environment WARNING] Using localhost API URL or missing API URL - forcing production URL');
  window.API_URL = 'https://unitask-backend.onrender.com';
} else {
  window.API_URL = import.meta.env.VITE_API_URL;
}

console.log('[Environment] Final API URL:', window.API_URL);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
