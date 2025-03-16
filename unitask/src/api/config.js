// Add debugging to help identify API URL issues
const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://freelancing-tawny-psi.vercel.app/api'
  : 'http://localhost:5000/api';

console.log('API URL configured as:', API_URL);

export default API_URL;
