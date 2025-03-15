import API_URL from './config';

// Get user profile by user ID
export const getProfile = async (userId) => {
  const response = await fetch(`${API_URL}/profile/${userId}`);
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch profile');
  }
  
  return data.profile;
};

// Update user profile
export const updateProfile = async (userId, profileData) => {
  const response = await fetch(`${API_URL}/profile/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profileData),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update profile');
  }
  
  return data.profile;
};
