// Use the environment variable for API URL or fallback to the production URL
const API_URL = import.meta.env.VITE_API_URL || 'https://unitask-backend.onrender.com';

// Log the API URL during development for debugging purposes
console.log('API requests will be sent to:', API_URL);

export default API_URL;
