import API_URL from './config';

// Get all conversations for a user
export const getUserConversations = async (userId) => {
  const response = await fetch(`${API_URL}/conversations/${userId}`);
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch conversations');
  }
  
  return data.conversations;
};

// Create a new conversation
export const createConversation = async (participantIds, gigInfo = null) => {
  try {
    const response = await fetch(`${API_URL}/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        participantIds,
        gig_id: gigInfo?.gig_id,
        gig_title: gigInfo?.title // Changed from gig_title to match the passed data
      }),
    });

    console.log('Create conversation response:', response); // Debug log

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create conversation');
    }
    
    return data.conversation;
  } catch (error) {
    console.error('Create conversation error:', error);
    throw error;
  }
};

// Get messages for a conversation
export const getConversationMessages = async (conversationId, userId) => {
  const response = await fetch(`${API_URL}/conversations/${conversationId}/messages?userId=${userId}`);
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch messages');
  }
  
  return data.messages;
};

// Delete a conversation
export const deleteConversation = async (conversationId) => {
  const response = await fetch(`${API_URL}/conversations/${conversationId}`, {
    method: 'DELETE',
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete conversation');
  }
  
  return data;
};
