import { io } from "socket.io-client";
import API_URL from '../api/config';

let socket = null;

export const initializeSocket = () => {
  if (!socket) {
    // Remove /api from API_URL to get the base URL
    const baseUrl = API_URL.replace('/api', '');
    socket = io(baseUrl);
    
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });
    
    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
    
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }
  
  return socket;
};

export const joinConversation = (conversationId) => {
  if (!socket) initializeSocket();
  socket.emit('join-conversation', conversationId);
};

export const sendMessage = (conversationId, senderId, content) => {
  if (!socket) initializeSocket();
  socket.emit('send-message', { conversationId, senderId, content });
};

export const setTypingStatus = (conversationId, userId, isTyping) => {
  if (!socket) initializeSocket();
  socket.emit('typing', { conversationId, userId, isTyping });
};

export const onNewMessage = (callback) => {
  if (!socket) initializeSocket();
  socket.on('new-message', callback);
  
  return () => {
    socket.off('new-message', callback);
  };
};

export const onUserTyping = (callback) => {
  if (!socket) initializeSocket();
  socket.on('user-typing', callback);
  
  return () => {
    socket.off('user-typing', callback);
  };
};
