import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// IMPORTANT: Force the production API URL to prevent localhost calls
window.API_URL = 'https://unitask-backend.onrender.com';

console.log('[Environment] Mode:', import.meta.env.MODE);
console.log('[Environment] API URL override:', window.API_URL);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
