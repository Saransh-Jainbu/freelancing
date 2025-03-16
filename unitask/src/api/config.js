// Configure API URL to use the current origin in production to avoid CORS
const API_URL = process.env.NODE_ENV === 'production'
  ? '/api'  // Use relative path to avoid CORS in production
  : 'http://localhost:3000/api';

console.log('API URL configured as:', API_URL);

// Add a function to check if the API is accessible
export const checkApiStatus = async () => {
  try {
    const response = await fetch(`${API_URL}/health`);
    const data = await response.json();
    console.log('API status check:', data);
    return data.status === 'online';
  } catch (error) {
    console.error('API status check failed:', error);
    return false;
  }
};

export default API_URL;
