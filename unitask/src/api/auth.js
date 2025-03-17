// Hardcode the API URL to ensure it's correctly bundled
const API_URL = 'https://unitask-backend.onrender.com';

import { apiRequest } from './client';

// Register a new user
export const registerUser = async (userData) => {
  try {
    console.log(`[Auth API] Making registration request with userData:`, userData);
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
      mode: 'cors'
    });

    console.log(`[Auth API] Registration response status:`, response.status);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }
    
    return data;
  } catch (error) {
    console.error('[Auth API] Registration error:', error);
    throw error;
  }
};

// Login user
export const loginUser = async (email, password) => {
  try {
    console.log(`[Auth API] Making login request for email:`, email);
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }
    
    return data.user;
  } catch (error) {
    console.error('[Auth API] Login error:', error);
    throw error;
  }
};

export { API_URL };
