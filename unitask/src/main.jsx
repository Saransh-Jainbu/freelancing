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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
