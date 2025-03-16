const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://your-vercel-app-name.vercel.app/api'
  : 'http://localhost:3000/api';

export default API_URL;
