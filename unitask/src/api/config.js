// Force use of the deployed API URL to prevent localhost connections
const API_URL = 'https://unitask-backend.onrender.com';

// Debug information - this will help identify which URL is being used
console.log('[API Config] API requests will be sent to:', API_URL);

export default API_URL;
