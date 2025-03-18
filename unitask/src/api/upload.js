import { API_URL } from '../constants';

// Upload image to server
export const uploadImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append('image', file);
    
    console.log(`[Upload API] Uploading image:`, file.name);
    
    const response = await fetch(`${API_URL}/api/upload/image`, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header, it will be set automatically with boundary
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

// Update user profile avatar
export const updateProfileAvatar = async (userId, avatarUrl, oldAvatarUrl) => {
  try {
    console.log(`[Upload API] Updating avatar for user:`, userId);
    
    const response = await fetch(`${API_URL}/api/profile/${userId}/avatar`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        avatarUrl,
        oldAvatarUrl // Include old URL so server can delete it
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update avatar: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating avatar:', error);
    throw error;
  }
};

// Upload gig image
export const uploadGigImage = async (gigId, file) => {
  try {
    const formData = new FormData();
    formData.append('image', file);
    
    console.log(`[Upload API] Uploading gig image for gig ${gigId}`);
    
    const response = await fetch(`${API_URL}/api/gigs/${gigId}/image`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error uploading gig image:', error);
    throw error;
  }
};
