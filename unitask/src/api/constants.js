// Get API URL from window.ENV (injected in index.html) or environment variables
export const API_URL = window.ENV?.API_URL || import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.warn('API_URL not configured. Please check your environment variables.');
}
