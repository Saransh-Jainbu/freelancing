import { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContextValue';
import { API_URL } from '../api/constants';
import io from 'socket.io-client';
import { 
  isPushSupported, 
  requestNotificationPermission, 
  subscribeToPushNotifications, 
  unsubscribeFromPushNotifications 
} from '../services/pushNotifications';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState(
    'Notification' in window ? Notification.permission : 'denied'
  );
  const [pushEnabled, setPushEnabled] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  // Initialize socket connection
  useEffect(() => {
    if (!currentUser) return;
    
    const newSocket = io(API_URL);
    setSocket(newSocket);
    
    return () => {
      newSocket.disconnect();
    };
  }, [currentUser]);

  // Register user with socket for notifications
  useEffect(() => {
    if (!socket || !currentUser) return;
    
    socket.emit('register-user', currentUser.id);
    
    return () => {
      socket.off('register-user');
    };
  }, [socket, currentUser]);

  // Request notification permission
  const requestPermission = async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support desktop notification');
      return;
    }
    
    try {
      const permission = await requestNotificationPermission();
      setNotificationPermission(permission);
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  };

  // Subscribe to push notifications
  const subscribeToPush = async () => {
    if (!currentUser) return;
    
    try {
      setIsSubscribing(true);
      
      // First make sure we have permission
      const permission = await requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }
      
      if (!isPushSupported()) {
        throw new Error('Push notifications are not supported in this browser');
      }

      await subscribeToPushNotifications(currentUser.id);
      setPushEnabled(true);
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      alert(`Failed to enable notifications: ${error.message}`);
    } finally {
      setIsSubscribing(false);
    }
  };

  // Unsubscribe from push notifications
  const unsubscribeFromPush = async () => {
    if (!currentUser) return;
    
    try {
      const result = await unsubscribeFromPushNotifications(currentUser.id);
      if (result.success) {
        setPushEnabled(false);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      alert(`Failed to disable notifications: ${error.message}`);
    }
  };

  // Show browser notification
  const showBrowserNotification = (title, message, onClick) => {
    if (notificationPermission !== 'granted') return;
    
    try {
      const notification = new Notification(title, {
        body: message,
        icon: '/notification-icon.png' // You'll need to add this icon to your public folder
      });
      
      if (onClick) {
        notification.onclick = onClick;
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  };

  // Send a test notification
  const sendTestNotification = async () => {
    if (!currentUser) return;
    
    if (!pushEnabled) {
      // Try to show a browser notification if push isn't enabled
      if (notificationPermission === 'granted') {
        showBrowserNotification(
          'Test Notification', 
          'This is a test notification from UniTask. If you can see this, notifications are working!',
          () => window.focus()
        );
        return;
      } else {
        throw new Error('Notifications are not enabled');
      }
    }
    
    try {
      const response = await fetch(`${API_URL}/api/notifications/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      
      if (!response.ok) {
        throw new Error('Failed to send test notification');
      }
      
      // Show immediate feedback
      showBrowserNotification(
        'Test Notification Sent', 
        'A push notification has been sent. You should receive it soon, even if you close the browser.',
        () => window.focus()
      );
      
      return await response.json();
    } catch (error) {
      console.error('Failed to send test notification:', error);
      throw error;
    }
  };

  // Check if user is already subscribed to push
  useEffect(() => {
    const checkPushSubscription = async () => {
      if (!currentUser || !isPushSupported()) return;
      
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration) return;
        
        const subscription = await registration.pushManager.getSubscription();
        setPushEnabled(Boolean(subscription));
      } catch (error) {
        console.error('Error checking push subscription:', error);
      }
    };
    
    checkPushSubscription();
  }, [currentUser]);

  // Listen for socket notifications
  useEffect(() => {
    if (!socket) return;
    
    socket.on('notification', (notification) => {
      // Add notification to state
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show browser notification if page is visible
      if (document.visibilityState === 'visible') {
        const title = notification.title;
        const message = notification.message;
        
        let onClick;
        if (notification.reference_type === 'conversation') {
          onClick = () => {
            window.focus();
            window.location.href = `/chat/${notification.reference_id}`;
          };
        } else if (notification.reference_type === 'order') {
          onClick = () => {
            window.focus();
            window.location.href = `/orders/${notification.reference_id}`;
          };
        }
        
        showBrowserNotification(title, message, onClick);
      }
    });
    
    return () => {
      socket.off('notification');
    };
  }, [socket]);

  // Fetch notifications from API
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!currentUser) return;
      
      try {
        const response = await fetch(`${API_URL}/api/notifications/${currentUser.id}`);
        if (!response.ok) throw new Error('Failed to fetch notifications');
        
        const data = await response.json();
        
        if (data.success) {
          setNotifications(data.notifications);
          setUnreadCount(data.notifications.filter(n => !n.is_read).length);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };
    
    fetchNotifications();
  }, [currentUser]);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    if (!currentUser) return;
    
    try {
      const response = await fetch(`${API_URL}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      
      if (!response.ok) throw new Error('Failed to mark notification as read');
      
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!currentUser) return;
    
    try {
      const response = await fetch(`${API_URL}/api/notifications/user/${currentUser.id}/read-all`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) throw new Error('Failed to mark all notifications as read');
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    requestPermission,
    notificationPermission,
    pushEnabled,
    subscribeToPush,
    unsubscribeFromPush,
    isSubscribing,
    sendTestNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);

export default NotificationProvider;
