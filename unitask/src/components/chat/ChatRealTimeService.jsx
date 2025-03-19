import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import PropTypes from 'prop-types';
import { io } from 'socket.io-client';
import { API_URL } from '../../constants';
import { useAuth } from '../../context/AuthContextValue';
import { showChatNotification } from '../../services/notificationService';

// Create a context to provide real-time data
const ChatRealTimeContext = createContext(null);

/**
 * Custom hook to use the ChatRealTime context
 */
export const useChatRealTime = () => {
  const context = useContext(ChatRealTimeContext);
  if (!context) {
    throw new Error('useChatRealTime must be used within a ChatRealTimeProvider');
  }
  return context;
};

/**
 * ChatRealTimeService - Manages real-time chat functionality including:
 * - Online/offline status tracking
 * - Message read receipts
 * - Real-time conversation updates
 */
export const ChatRealTimeProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [lastActiveTime, setLastActiveTime] = useState({});
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [unreadCounts, setUnreadCounts] = useState({});
  
  // Initialize socket connection
  useEffect(() => {
    if (!currentUser) return;
    
    console.log('[ChatRealTime] Initializing socket connection');
    
    const socketOptions = {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
      forceNew: false, // Reuse existing connection if possible
      transports: ['websocket', 'polling']
    };
    
    const socketInstance = io(API_URL, socketOptions);
    setSocket(socketInstance);
    
    // Set up connection event handlers
    socketInstance.on('connect', () => {
      console.log('[ChatRealTime] Socket connected with ID:', socketInstance.id);
      setConnectionStatus('connected');
      
      // Register user as online
      socketInstance.emit('user-online', currentUser.id);
    });
    
    socketInstance.on('connect_error', (error) => {
      console.error('[ChatRealTime] Connection error:', error);
      setConnectionStatus('error');
    });
    
    socketInstance.on('disconnect', (reason) => {
      console.log('[ChatRealTime] Socket disconnected:', reason);
      setConnectionStatus('disconnected');
    });
    
    socketInstance.on('reconnect', () => {
      console.log('[ChatRealTime] Socket reconnected');
      setConnectionStatus('connected');
      
      // Re-register user as online after reconnection
      socketInstance.emit('user-online', currentUser.id);
    });
    
    // Cleanup on unmount
    return () => {
      console.log('[ChatRealTime] Cleaning up socket connection');
      socketInstance.disconnect();
    };
  }, [currentUser]);
  
  // Set up event listeners for online users
  useEffect(() => {
    if (!socket || !currentUser) return;
    
    // Track online users
    socket.on('online-users', (users) => {
      console.log('[ChatRealTime] Online users update:', users);
      setOnlineUsers(users);
    });
    
    // Track user last active times
    socket.on('user-last-active', (data) => {
      setLastActiveTime(prev => ({
        ...prev,
        [data.userId]: data.timestamp
      }));
    });
    
    // Track typing status
    socket.on('user-typing', ({ userId, conversationId, isTyping }) => {
      setTypingUsers(prev => ({
        ...prev,
        [conversationId]: {
          ...prev[conversationId],
          [userId]: isTyping
        }
      }));
    });
    
    // Setup ping to keep user online status
    const pingInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('user-active-update', currentUser.id);
      }
    }, 30000);
    
    return () => {
      socket.off('online-users');
      socket.off('user-last-active');
      socket.off('user-typing');
      clearInterval(pingInterval);
    };
  }, [socket, currentUser]);
  
  // Handle message read receipts
  useEffect(() => {
    if (!socket) return;
    
    socket.on('message-read', ({ messageIds, conversationId, userId }) => {
      console.log('[ChatRealTime] Messages marked as read:', { messageIds, conversationId, userId });
      
      // Update unread counts when messages are read
      if (userId !== currentUser.id) {
        setUnreadCounts(prev => ({
          ...prev,
          [conversationId]: (prev[conversationId] || 0) - messageIds.length
        }));
      }
    });
    
    return () => {
      socket.off('message-read');
    };
  }, [socket, currentUser]);
  
  // Send a message with the socket
  const sendMessage = useCallback((conversationId, content) => {
    if (!socket || !currentUser) {
      console.error('[ChatRealTime] Cannot send message: not connected or no user');
      return Promise.reject(new Error('Not connected'));
    }
    
    return new Promise((resolve, reject) => {
      socket.emit('send-message', {
        conversationId,
        senderId: currentUser.id,
        content
      }, (response) => {
        if (response && response.error) {
          console.error('[ChatRealTime] Error sending message:', response.error);
          reject(new Error(response.error));
        } else if (response && response.success) {
          console.log('[ChatRealTime] Message sent successfully:', response);
          resolve(response);
        } else {
          console.warn('[ChatRealTime] No response from server');
          reject(new Error('No response from server'));
        }
      });
    });
  }, [socket, currentUser]);
  
  // Join a conversation room
  const joinConversation = useCallback((conversationId) => {
    if (!socket || !currentUser) return;
    
    socket.emit('join-conversation', {
      conversationId,
      userId: currentUser.id
    });
  }, [socket, currentUser]);
  
  // Mark messages as read
  const markMessagesAsRead = useCallback((conversationId, messageIds) => {
    if (!socket || !currentUser || !messageIds?.length) return;
    
    socket.emit('mark-messages-read', {
      conversationId,
      messageIds,
      userId: currentUser.id
    });
  }, [socket, currentUser]);
  
  // Set user typing status
  const setTypingStatus = useCallback((conversationId, isTyping) => {
    if (!socket || !currentUser) return;
    
    socket.emit('typing', {
      conversationId,
      userId: currentUser.id,
      isTyping
    });
  }, [socket, currentUser]);
  
  // Listen for new messages
  const onNewMessage = useCallback((callback) => {
    if (!socket) return () => {};
    
    const handleNewMessage = (message) => {
      console.log('[ChatRealTime] New message received:', message);
      
      // Update unread counts for conversations
      if (message.sender_id !== currentUser.id) {
        setUnreadCounts(prev => ({
          ...prev,
          [message.conversation_id]: (prev[message.conversation_id] || 0) + 1
        }));
        
        // Show notification if the sender is not the current user
        // and we have sender information
        if (message.sender && !document.hasFocus()) {
          showChatNotification(
            message.content,
            message.sender,
            message.conversation_id
          );
        }
      }
      
      // Call the provided callback with the message
      callback(message);
    };
    
    socket.on('new-message', handleNewMessage);
    return () => socket.off('new-message', handleNewMessage);
  }, [socket, currentUser]);
  
  // Check if a user is online
  const isUserOnline = useCallback((userId) => {
    return onlineUsers.includes(String(userId));
  }, [onlineUsers]);
  
  // Get the formatted last active time for a user
  const getLastActiveTime = useCallback((userId) => {
    return lastActiveTime[userId] || null;
  }, [lastActiveTime]);
  
  // Check if a user is typing in a conversation
  const isUserTyping = useCallback((conversationId, userId) => {
    const conversationTypers = typingUsers[conversationId] || {};
    return Boolean(conversationTypers[userId]);
  }, [typingUsers]);
  
  // The context value that will be provided to consumers
  const contextValue = {
    // Connection status
    connectionStatus,
    isConnected: connectionStatus === 'connected',
    
    // Online status
    onlineUsers,
    isUserOnline,
    getLastActiveTime,
    
    // Typing status
    isUserTyping,
    setTypingStatus,
    
    // Message actions
    sendMessage,
    markMessagesAsRead,
    joinConversation,
    
    // Event subscription
    onNewMessage,
    
    // Unread counts
    unreadCounts,
  };
  
  return (
    <ChatRealTimeContext.Provider value={contextValue}>
      {children}
      
      {/* Optional: Status indicator */}
      {connectionStatus === 'error' && (
        <div className="fixed bottom-0 left-0 right-0 bg-red-500 text-white text-center py-1 z-50">
          Connection lost. Attempting to reconnect...
        </div>
      )}
    </ChatRealTimeContext.Provider>
  );
};

ChatRealTimeProvider.propTypes = {
  children: PropTypes.node.isRequired
};

/**
 * ChatUserStatus - Display a user's online/offline status
 */
export const ChatUserStatus = ({ userId, lastActiveFallback }) => {
  const { isUserOnline, getLastActiveTime } = useChatRealTime();
  const [formattedLastActive, setFormattedLastActive] = useState('');
  const online = isUserOnline(userId);
  const lastActive = getLastActiveTime(userId) || lastActiveFallback;
  
  // Format last active time
  useEffect(() => {
    if (online || !lastActive) {
      setFormattedLastActive('');
      return;
    }
    
    const updateLastActive = () => {
      try {
        const lastActiveDate = new Date(lastActive);
        
        if (isNaN(lastActiveDate.getTime())) {
          setFormattedLastActive('Offline');
          return;
        }
        
        const now = new Date();
        const diffMinutes = Math.round((now - lastActiveDate) / (1000 * 60));
        
        if (diffMinutes < 1) {
          setFormattedLastActive('Just now');
        } else if (diffMinutes < 60) {
          setFormattedLastActive(`${diffMinutes}m ago`);
        } else if (diffMinutes < 24 * 60) {
          const hours = Math.floor(diffMinutes / 60);
          setFormattedLastActive(`${hours}h ago`);
        } else {
          const days = Math.floor(diffMinutes / (24 * 60));
          setFormattedLastActive(`${days}d ago`);
        }
      } catch (err) {
        console.error('Error formatting last active time:', err);
        setFormattedLastActive('Offline');
      }
    };
    
    // Update immediately and then every minute
    updateLastActive();
    const interval = setInterval(updateLastActive, 60000);
    
    return () => clearInterval(interval);
  }, [online, lastActive]);
  
  if (online) {
    return (
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 rounded-full bg-green-500"></div>
        <span className="text-xs text-green-500">Online</span>
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-1">
      <div className="w-2 h-2 rounded-full bg-gray-400"></div>
      <span className="text-xs text-gray-400">
        {formattedLastActive || 'Offline'}
      </span>
    </div>
  );
};

ChatUserStatus.propTypes = {
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  lastActiveFallback: PropTypes.string
};

/**
 * MessageReadIndicator - Display read status for a message
 */
export const MessageReadIndicator = ({ message }) => {
  const { currentUser } = useAuth();
  
  // Only show read indicators for messages sent by the current user
  if (!currentUser || message.sender_id !== currentUser.id) {
    return null;
  }
  
  return (
    <div className="flex items-center justify-end text-xs text-gray-400 mt-1">
      {message._isOptimistic ? (
        <span>Sending...</span>
      ) : message.is_read ? (
        <div className="flex items-center gap-1">
          <span>Seen</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
            <path d="M18 6 7 17l-5-5"/>
            <path d="m22 10-8 8-4-4"/>
          </svg>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <span>Delivered</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5"/>
          </svg>
        </div>
      )}
    </div>
  );
};

MessageReadIndicator.propTypes = {
  message: PropTypes.shape({
    sender_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    is_read: PropTypes.bool,
    _isOptimistic: PropTypes.bool
  }).isRequired
};

export default ChatRealTimeProvider;
