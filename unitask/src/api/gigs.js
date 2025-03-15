import API_URL from './config';

// Get all gigs for a user
export const getUserGigs = async (userId) => {
  const response = await fetch(`${API_URL}/gigs/${userId}`);
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch gigs');
  }
  
  return data.gigs;
};

// Create a new gig
export const createGig = async (userId, gigData) => {
  const response = await fetch(`${API_URL}/gigs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, ...gigData }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to create gig');
  }
  
  return data.gig;
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
