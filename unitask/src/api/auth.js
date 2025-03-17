import API_URL from './config';

// Register a new user
export const registerUser = async (userData) => {
  const apiEndpoint = `${API_URL}/api/auth/register`;
  console.log(`[Auth API] Making registration request to: ${apiEndpoint}`, userData);
  
  try {
    const response = await fetch(apiEndpoint, {
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
  console.log(`Making login request to: ${API_URL}/api/auth/login`);
  try {
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
    console.error('Login error:', error);
    throw error;
  }
};
