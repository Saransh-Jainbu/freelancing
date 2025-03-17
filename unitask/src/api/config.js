// Use the environment variable for API URL or fallback to the production URL
const API_URL = import.meta.env.VITE_API_URL || 'https://unitask-backend.onrender.com';

// Debug information - this will help identify which URL is being used
console.log('[API Config] API requests will be sent to:', API_URL);

export default API_URL;
