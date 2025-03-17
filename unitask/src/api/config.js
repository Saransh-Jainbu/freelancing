// FORCE the production API URL in all environments to fix deployment issues
const API_URL = 'https://unitask-backend.onrender.com';

// Log the URL being used
console.log('[API Config] API requests will be sent to:', API_URL);

export default API_URL;
