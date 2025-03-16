const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://freelancing-tawny-psi.vercel.app/api'
  : 'http://localhost:3000/api';

export default API_URL;
