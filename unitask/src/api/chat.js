import { API_URL } from '../constants';

// Get conversations for a user
export const getUserConversations = async (userId) => {
  try {
    console.log(`[Chat API] Fetching conversations for user:`, userId);
    const response = await fetch(`${API_URL}/api/conversations/${userId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch conversations: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.conversations;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
};

// Create a new conversation
export const createConversation = async (participantIds, gigInfo = null) => {
  try {
    console.log(`[Chat API] Creating conversation between users:`, participantIds);
    const response = await fetch(`${API_URL}/api/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        participantIds,
        gigInfo
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create conversation: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.conversation;
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
};

// Get messages for a conversation
export const getConversationMessages = async (conversationId, userId) => {
  try {
    console.log(`[Chat API] Fetching messages for conversation:`, conversationId);
    const response = await fetch(`${API_URL}/api/conversations/${conversationId}/messages?userId=${userId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch messages: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.messages;
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};

// Delete a conversation
export const deleteConversation = async (conversationId) => {
  try {
    console.log(`[Chat API] Deleting conversation:`, conversationId);
    const response = await fetch(`${API_URL}/api/conversations/${conversationId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete conversation: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting conversation:', error);
    throw error;
  }
};

// Search users for starting a new conversation
export const searchUsers = async (query, currentUserId) => {
  try {
    console.log(`[Chat API] Searching users with query:`, query);
    // FIX: Add /api prefix to the endpoint
    const response = await fetch(`${API_URL}/api/users/search?q=${encodeURIComponent(query || '')}&currentUserId=${currentUserId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to search users: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.users;
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
};
