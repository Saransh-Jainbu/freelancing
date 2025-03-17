// Create a configured API client to use throughout the app
// DO NOT use any environment variables - hardcode the production URL
const API_URL = 'https://unitask-backend.onrender.com';

console.log('[API Client] Using API URL:', API_URL);

export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  console.log(`[API Client] Making request to: ${url}`);
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
    mode: 'cors',
  };
  
  const response = await fetch(url, { ...defaultOptions, ...options });
  const data = await response.json();
  
  if (!response.ok) {
    console.error('[API Client] Request failed:', data);
    throw new Error(data.message || 'API request failed');
  }
  
  return data;
};

// Export the API_URL directly to ensure it's used everywhere
export default API_URL;
