import API_URL from './config';

// Get all users
export const getUsers = async () => {
  const response = await fetch(`${API_URL}/users`);
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch users');
  }
  
  return data.users;
};

// Get user by ID
export const getUserById = async (userId) => {
  const response = await fetch(`${API_URL}/users/${userId}`);
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch user');
  }
  
  return data.user;
};

// Search users
export const searchUsers = async (query) => {
  const response = await fetch(`${API_URL}/users/search?q=${encodeURIComponent(query)}`);
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to search users');
  }
  
  return data.users;
};
