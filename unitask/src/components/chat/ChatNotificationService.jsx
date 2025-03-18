import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContextValue';
import { API_URL } from '../../constants';
import { io } from 'socket.io-client';

// This is a service component that can be placed in App.jsx to handle background notifications
const ChatNotificationService = () => {
  const { currentUser } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState(null);
  
  // Request notification permission
  useEffect(() => {
    // Check if notifications are supported by the browser
    if (!("Notification" in window)) {
      console.log("This browser does not support desktop notifications");
      return;
    }

    // Set permission state
    setNotificationPermission(Notification.permission);
    
    // Request permission if not already granted or denied
    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission().then(permission => {
        setNotificationPermission(permission);
      });
    }
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
  
  // Listen for incoming messages for notification purposes
  useEffect(() => {
    if (!socket || !currentUser || notificationPermission !== 'granted') return;
    
    const handleNewMessage = (message) => {
      // Only show notifications if the message is not from the current user
      if (message.sender_id !== currentUser.id) {
        try {
          const notification = new Notification("New message from UniTask", {
            body: `${message.sender.display_name}: ${message.content}`,
            icon: "/favicon.ico",
            badge: "/notification-badge.png",
            tag: `chat-${message.conversation_id}`  // Replace older notifications from same conversation
          });
          
          // When notification is clicked, navigate to the conversation
          notification.onclick = () => {
            window.focus();
            window.location.href = `/chat/${message.conversation_id}`;
            notification.close();
          };
          
          // Auto close after 5 seconds
          setTimeout(() => {
            notification.close();
          }, 5000);
        } catch (error) {
          console.error("[NotificationService] Error showing notification:", error);
        }
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
