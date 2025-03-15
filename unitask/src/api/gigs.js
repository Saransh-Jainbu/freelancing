import API_URL from './config';

// Get all gigs for a user with error handling
export const getUserGigs = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/gigs/${userId}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch gigs');
    }
    
    return data.gigs;
  } catch (error) {
    console.error('Error fetching user gigs:', error);
    throw error;
  }
};

// Create a new gig with better error handling
export const createGig = async (userId, gigData) => {
  try {
    const response = await fetch(`${API_URL}/gigs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        ...gigData
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create gig');
    }
    
    return data.gig;
  } catch (error) {
    console.error('Error creating gig:', error);
    throw error;
  }
};

// Update a gig
export const updateGig = async (gigId, userId, gigData) => {
  const response = await fetch(`${API_URL}/gigs/${gigId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      userId, 
      title: gigData.title,
      category: gigData.category,
      price: gigData.price,
      description: gigData.description,
      status: gigData.status || 'active'
    }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update gig');
  }
  
  return data.gig;
};

// Toggle gig status
export const toggleGigStatus = async (gigId, userId) => {
  const response = await fetch(`${API_URL}/gigs/${gigId}/toggle-status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to toggle gig status');
  }
  
  return data.gig;
};

// Delete a gig
export const deleteGig = async (gigId, userId) => {
  const response = await fetch(`${API_URL}/gigs/${gigId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete gig');
  }
  
  return data;
};

// Get all public gigs for marketplace
export const getMarketplaceGigs = async () => {
  try {
    const response = await fetch(`${API_URL}/marketplace/gigs`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch marketplace gigs');
    }
    
    const data = await response.json();
    return data.gigs;
  } catch (error) {
    console.error('Marketplace fetch error:', error);
    throw error;
  }
};

// Get single gig details
export const getGigDetails = async (gigId) => {
  const response = await fetch(`${API_URL}/gigs/${gigId}/details`);
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch gig details');
  }
  
  return data.gig;
};
