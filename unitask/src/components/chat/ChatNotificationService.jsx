import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContextValue';
import { API_URL } from '../../constants';
import { io } from 'socket.io-client';
import { 
  registerServiceWorker, 
  requestNotificationPermission, 
  getNotificationPermission, 
  showChatNotification 
} from '../../services/notificationService';

// This is a service component that can be placed in App.jsx to handle background notifications
const ChatNotificationService = () => {
  const { currentUser } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState(null);
  const [serviceWorkerRegistration, setServiceWorkerRegistration] = useState(null);
  
  // Register service worker
  useEffect(() => {
    const setupServiceWorker = async () => {
      const registration = await registerServiceWorker();
      setServiceWorkerRegistration(registration);
    };
    
    setupServiceWorker();
  }, []);
  
  // Request notification permission
  useEffect(() => {
    const setupNotifications = async () => {
      const permission = getNotificationPermission();
      setNotificationPermission(permission);
      
      if (permission !== 'granted' && permission !== 'denied') {
        const granted = await requestNotificationPermission();
        setNotificationPermission(granted ? 'granted' : 'denied');
      }
    };
    
    setupNotifications();
  }, []);
  
  // Initialize socket connection for global notifications
  useEffect(() => {
    if (!currentUser) return;
    
    const socketInstance = io(API_URL);
    setSocket(socketInstance);
    
    socketInstance.on('connect', () => {
      console.log('[NotificationService] Socket connected:', socketInstance.id);
      // Join a user-specific room for notifications
      socketInstance.emit('join-user', currentUser.id);
    });
    
    socketInstance.on('disconnect', () => {
      console.log('[NotificationService] Socket disconnected');
    });
    
    return () => {
      socketInstance.disconnect();
    };
  }, [currentUser]);
  
  // Listen for incoming messages and show notifications
  useEffect(() => {
    if (!socket || !currentUser || notificationPermission !== 'granted') return;
    
    const handleNewMessage = (message) => {
      // Only show notifications if the message is not from the current user
      if (message.sender_id !== currentUser.id) {
        showChatNotification(
          message.content, 
          message.sender, 
          message.conversation_id
        );
      }
    };
    
    socket.on('new-message', handleNewMessage);
    
    return () => {
      socket.off('new-message', handleNewMessage);
    };
  }, [socket, currentUser, notificationPermission]);
  
  // This component doesn't render anything
  return null;
};

export default ChatNotificationService;
