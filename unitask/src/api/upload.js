import { API_URL } from '../constants';

// Upload image to Azure via server
export const uploadImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append('image', file);
    
    console.log(`[Upload API] Uploading image to Azure:`, file.name);
    
    const response = await fetch(`${API_URL}/api/upload/image`, {
      method: 'POST',
      body: formData,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error(`[Upload API] Upload failed: ${response.status} ${response.statusText}`, data);
      throw new Error(data.message || `Upload failed: ${response.status}`);
    }
    
    console.log(`[Upload API] Image uploaded successfully:`, data);
    return data;
  } catch (error) {
    console.error('[Upload API] Error uploading image:', error);
    throw error;
  }
};

// Update user profile avatar
export const updateProfileAvatar = async (userId, avatarUrl, oldAvatarUrl) => {
  try {
    console.log(`[Upload API] Updating avatar for user:`, userId);
    console.log(`[Upload API] New avatar URL:`, avatarUrl);
    
    if (oldAvatarUrl) {
      console.log(`[Upload API] Old avatar URL to be deleted:`, oldAvatarUrl);
    }
    
    const response = await fetch(`${API_URL}/api/profile/${userId}/avatar`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        avatarUrl,
        oldAvatarUrl
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error(`[Upload API] Avatar update failed: ${response.status} ${response.statusText}`, data);
      throw new Error(data.message || `Failed to update avatar: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('[Upload API] Error updating avatar:', error);
    throw error;
  }
};

// Upload gig image to Azure
export const uploadGigImage = async (gigId, file) => {
  try {
    const formData = new FormData();
    formData.append('image', file);
    
    console.log(`[Upload API] Uploading gig image to Azure for gig ${gigId}`);
    
    const response = await fetch(`${API_URL}/api/gigs/${gigId}/image`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Upload API] Gig image upload failed: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[Upload API] Error uploading gig image:', error);
    throw error;
  }
};
