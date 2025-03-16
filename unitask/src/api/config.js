// Configure API URL to use the current origin in production to avoid CORS
const API_URL = process.env.NODE_ENV === 'production'
  ? '/api'  // Use relative path to avoid CORS in production
  : 'http://localhost:3000/api';

console.log('API URL configured as:', API_URL);

export default API_URL;
