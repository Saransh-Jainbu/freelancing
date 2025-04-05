// Add this to your existing orders.js file or create a new one if needed

// Mark an order as completed by the freelancer (sets status to 'verifying')
export const markOrderAsCompleted = async (orderId, sellerId) => {
  try {
    const response = await fetch(`${API_URL}/api/orders/${orderId}/complete`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sellerId })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to mark order as completed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.order;
  } catch (error) {
    console.error('Error marking order as completed:', error);
    throw error;
  }
};

// Get orders waiting for verification from a client
export const getVerifyingOrdersAsBuyer = async (buyerId) => {
  try {
    const response = await fetch(`${API_URL}/api/orders/verifying/buyer/${buyerId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch verifying orders: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.orders;
  } catch (error) {
    console.error('Error fetching verifying orders:', error);
    throw error;
  }
};

// Get orders that the freelancer has marked as completed and are waiting for client verification
export const getVerifyingOrdersAsSeller = async (sellerId) => {
  try {
    const response = await fetch(`${API_URL}/api/orders/verifying/seller/${sellerId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch verifying orders: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.orders;
  } catch (error) {
    console.error('Error fetching verifying orders:', error);
    throw error;
  }
};

// Submit a review and verify/reject order
export const verifyAndReviewOrder = async (orderId, reviewData) => {
  try {
    const response = await fetch(`${API_URL}/api/orders/${orderId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reviewData)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to verify and review order: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error verifying and reviewing order:', error);
    throw error;
  }
};

// Get user rating
export const getUserRating = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/api/users/${userId}/rating`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch user rating: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.rating;
  } catch (error) {
    console.error('Error fetching user rating:', error);
    throw error;
  }
};
