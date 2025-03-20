import { io } from 'socket.io-client';
import { API_URL } from '../constants';

let socket = null;

/**
 * Initializes a socket connection to the server
 * @returns {Object} The socket instance
 */
export const initializeSocket = () => {
  if (socket) {
    // If socket exists but is disconnected, reconnect it
    if (socket.disconnected) {
      console.log('[Socket] Reconnecting existing socket');
      socket.connect();
    }
    return socket;
  }
  
  console.log('[Socket] Initializing connection to', API_URL);
  
  socket = io(API_URL, {
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    autoConnect: true,
    forceNew: false, // Don't force a new connection on reload
    transports: ['websocket', 'polling'] // Try WebSocket first, fallback to polling
  });
  
  // Set up global connection event handlers
  socket.on('connect', () => {
    console.log('[Socket] Connected with ID:', socket.id);
    
    // Let the server know we're online whenever we connect/reconnect
    const userId = localStorage.getItem('currentUserId');
    if (userId) {
      socket.emit('user-online', userId);
    }
    
    // Add socket instance to window for debugging purposes
    window._socket = socket;
  });
  
  socket.on('connect_error', (error) => {
    console.error('[Socket] Connection error:', error);
  });
  
  socket.on('reconnect', (attempt) => {
    console.log(`[Socket] Reconnected after ${attempt} attempts`);
  });
  
  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });
  
  return socket;
};

/**
 * Get the socket instance or initialize it if it doesn't exist
 * @returns {Object} The socket instance
 */
export const getSocket = () => {
  if (!socket) {
    return initializeSocket();
  }
  return socket;
};

/**
 * Join a conversation room
 * @param {number} conversationId - The ID of the conversation to join
 * @param {number} userId - The current user's ID
 */
export const joinConversation = (conversationId, userId) => {
  const s = getSocket();
  console.log(`[Socket] Joining conversation room ${conversationId}`);
  s.emit('join-conversation', { conversationId, userId });
};

/**
 * Send a chat message with retry logic
 * @param {number} conversationId - The ID of the conversation
 * @param {number} senderId - The ID of the sender
 * @param {string} content - The message content
 * @param {function} callback - Optional callback for acknowledgment
 */
export const sendMessage = (conversationId, senderId, content, callback) => {
  const s = getSocket();
  console.log(`[Socket] Sending message to conversation ${conversationId}`);
  
  // Store userId in localStorage for reconnection
  localStorage.setItem('currentUserId', senderId);
  
  // Send with retry logic
  const tryEmit = (retries = 0) => {
    // Update the user's last active timestamp with each message
    s.emit('user-active-update', senderId);
    
    // Enhanced payload with timestamp for better ordering
    const payload = {
      conversationId,
      senderId,
      content,
      timestamp: new Date().toISOString(),
      clientId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    s.emit('send-message', payload, (response) => {
      if (response) {
        if (callback) callback(response);
      } else if (retries < 2) {
        // Retry up to 2 times if no response
        console.log(`[Socket] No response, retrying (${retries + 1}/2)...`);
        setTimeout(() => tryEmit(retries + 1), 1000);
      } else if (callback) {
        callback({ error: 'No response from server after retries' });
      }
    });
  };
  
  tryEmit();
};

/**
 * Register a handler for new messages
 * @param {function} callback - The function to call when a new message is received
 * @returns {function} A function to unregister the handler
 */
export const onNewMessage = (callback) => {
  const s = getSocket();
  s.on('new-message', callback);
  return () => s.off('new-message', callback);
};

/**
 * Set typing status for a user in a conversation
 * @param {number} conversationId - The ID of the conversation
 * @param {number} userId - The ID of the user
 * @param {boolean} isTyping - Whether the user is typing
 */
export const setTypingStatus = (conversationId, userId, isTyping) => {
  const s = getSocket();
  s.emit('typing', { conversationId, userId, isTyping });
};

/**
 * Register a handler for typing status updates
 * @param {function} callback - The function to call when typing status changes
 * @returns {function} A function to unregister the handler
 */
export const onUserTyping = (callback) => {
  const s = getSocket();
  s.on('user-typing', callback);
  return () => s.off('user-typing', callback);
};

/**
 * Update the user's online status
 * @param {number} userId - The ID of the user
 */
export const setUserOnline = (userId) => {
  const s = getSocket();
  s.emit('user-online', userId);
};

/**
 * Clean up resources when app is unmounted
 */
export const cleanupSocket = () => {
  if (socket) {
    console.log('[Socket] Cleaning up socket connection');
    socket.disconnect();
    socket = null;
  }
};

export default getSocket;
