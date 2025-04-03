import { API_URL, REQUEST_TIMEOUT } from './constants';

/**
 * Custom fetch wrapper with timeout and error handling
 * @param {string} endpoint - API endpoint to call
 * @param {Object} options - Fetch options
 * @returns {Promise} - Response data or error
 */
const fetchWithTimeout = async (endpoint, options = {}) => {
  const controller = new AbortController();
  const { signal } = controller;
  
  const timeout = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT);
  
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      signal,
      credentials: 'include' // Include cookies for auth
    });
    
    clearTimeout(timeout);
    
    // Handle unauthorized responses
    if (response.status === 401) {
      // Optionally trigger logout or refresh token logic
      throw new Error('Unauthorized. Please log in again.');
    }
    
    // Parse JSON response
    const data = await response.json();
    
    // Check for API error messages
    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }
    
    return data;
  } catch (error) {
    clearTimeout(timeout);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    
    throw error;
  }
};

/**
 * API client with methods for standard HTTP operations
 */
const apiClient = {
  /**
   * GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Query parameters
   */
  get: async (endpoint, params = {}) => {
    const queryString = Object.keys(params).length > 0 
      ? `?${new URLSearchParams(params).toString()}`
      : '';
      
    return fetchWithTimeout(`${endpoint}${queryString}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
  },
  
  /**
   * POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body
   */
  post: async (endpoint, data = {}) => {
    return fetchWithTimeout(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data)
    });
  },
  
  /**
   * PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body
   */
  put: async (endpoint, data = {}) => {
    return fetchWithTimeout(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data)
    });
  },
  
  /**
   * DELETE request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Optional request body
   */
  delete: async (endpoint, data = null) => {
    const options = {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json'
      }
    };
    
    if (data) {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(data);
    }
    
    return fetchWithTimeout(endpoint, options);
  },
  
  /**
   * Upload file with multipart form data
   * @param {string} endpoint - API endpoint
   * @param {File} file - File to upload
   * @param {Object} additionalFields - Additional form fields
   */
  uploadFile: async (endpoint, file, additionalFields = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Add any additional fields to the form data
    Object.keys(additionalFields).forEach(key => {
      formData.append(key, additionalFields[key]);
    });
    
    return fetchWithTimeout(endpoint, {
      method: 'POST',
      body: formData
      // No Content-Type header as browser sets it automatically with boundary
    });
  }
};

export default apiClient;
