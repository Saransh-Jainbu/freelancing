import API_URL from './config';

// Register function with better error handling
export const registerUser = async (userData) => {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    // Check if the response is empty
    const text = await response.text();
    if (!text) {
      throw new Error('Empty response from server');
    }
    
    // Try to parse the response as JSON
    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error('Failed to parse response:', text);
      throw new Error('Invalid response from server');
    }
    
    // Check if the request was successful
    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }
    
    // Return the user ID if successful
    if (data.success) {
      return data.userId;
    } else {
      throw new Error(data.message || 'Registration failed');
    }
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// Login function with better error handling
export const loginUser = async (email, password) => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    // Check if the response is empty
    const text = await response.text();
    if (!text) {
      throw new Error('Empty response from server');
    }
    
    // Try to parse the response as JSON
    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error('Failed to parse response:', text);
      throw new Error('Invalid response from server');
    }
    
    // Check if the request was successful
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }
    
    // Return the user data if successful
    if (data.success && data.user) {
      return data.user;
    } else {
      throw new Error(data.message || 'Invalid credentials');
    }
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};
