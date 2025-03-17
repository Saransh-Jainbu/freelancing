import { API_URL } from '../constants';

// Get user gigs
export const getUserGigs = async (userId) => {
  try {
    console.log(`[Gigs API] Fetching gigs for user:`, userId);
    const response = await fetch(`${API_URL}/api/gigs/${userId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch gigs: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.gigs;
  } catch (error) {
    console.error('Error fetching user gigs:', error);
    throw error;
  }
};

// Create a new gig
export const createGig = async (gigData) => {
  try {
    const response = await fetch(`${API_URL}/api/gigs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gigData)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create gig: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.gig;
  } catch (error) {
    console.error('Error creating gig:', error);
    throw error;
  }
};

// Update a gig
export const updateGig = async (gigId, gigData) => {
  try {
    const response = await fetch(`${API_URL}/api/gigs/${gigId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gigData)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update gig: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.gig;
  } catch (error) {
    console.error('Error updating gig:', error);
    throw error;
  }
};

// Delete a gig
export const deleteGig = async (gigId, userId) => {
  try {
    const response = await fetch(`${API_URL}/api/gigs/${gigId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete gig: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.deleted;
  } catch (error) {
    console.error('Error deleting gig:', error);
    throw error;
  }
};

// Get gig details
export const getGigDetails = async (gigId) => {
  try {
    const response = await fetch(`${API_URL}/api/gigs/${gigId}/details`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch gig details: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.gig;
  } catch (error) {
    console.error('Error fetching gig details:', error);
    throw error;
  }
};

// Get marketplace gigs
export const getMarketplaceGigs = async () => {
  try {
    const response = await fetch(`${API_URL}/api/marketplace/gigs`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch marketplace gigs: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.gigs;
  } catch (error) {
    console.error('Error fetching marketplace gigs:', error);
    throw error;
  }
};
