// Use the same domain for API requests to avoid CORS issues
const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://freelancing-git-master-saransh-jains-projects.vercel.app/api'
  : 'http://localhost:3000/api';

console.log('API URL configured as:', API_URL);

export default API_URL;
