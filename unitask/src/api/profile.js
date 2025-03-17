import { apiRequest } from './client';

// Get user profile
export const getProfile = async (userId) => {
  try {
    console.log(`[Profile API] Fetching profile for user:`, userId);
    const data = await apiRequest(`/api/profile/${userId}`);
    return data.profile;
  } catch (error) {
    console.error('[Profile API] Profile fetch error:', error);
    throw error;
  }
};

// Update profile
export const updateProfile = async (userId, profileData) => {
  try {
    console.log(`[Profile API] Updating profile for user:`, userId);
    const data = await apiRequest(`/api/profile/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
    return data.profile;
  } catch (error) {
    console.error('[Profile API] Profile update error:', error);
    throw error;
  }
};
