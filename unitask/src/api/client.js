import { API_URL } from './constants';

export const apiRequest = async (endpoint, options = {}) => {
  if (!API_URL) {
    throw new Error('API_URL is not configured');
  }

  const url = `${API_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
    mode: 'cors',
  };
  
  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }
    
    return data;
  } catch (error) {
    // Log only non-sensitive error information
    console.error('Request failed:', error.message);
    throw error;
  }
};

export default API_URL;
