import { apiRequest } from './client';

// Register a new user
export const registerUser = async (userData) => {
  try {
    console.log(`[Auth API] Making registration request with userData:`, userData);
    const data = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
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
    const data = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    return data.user;
  } catch (error) {
    console.error('[Auth API] Login error:', error);
    throw error;
  }
};
