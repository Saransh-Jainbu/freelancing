import { API_URL } from '../constants';

// Check if browser supports notifications and service worker
const canUseNotifications = () => {
  return "Notification" in window && "serviceWorker" in navigator;
};

// Register service worker
const registerServiceWorker = async () => {
  if (!canUseNotifications()) return false;
  
  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js');
    console.log('ServiceWorker registration successful with scope:', registration.scope);
    return registration;
  } catch (error) {
    console.error('ServiceWorker registration failed:', error);
    return false;
  }
};

// Check if permission is blocked (permission prompt has been ignored multiple times)
const isPermissionBlocked = async () => {
  if (!canUseNotifications()) return false;
  
  // First check the standard Notification.permission
  if (Notification.permission === 'denied') {
    return true;
  }
  
  // If permission is default (prompt), we need to check if it might be blocked
  if (Notification.permission === 'default') {
    try {
      // Try to request permission
      const result = await Promise.race([
        Notification.requestPermission(),
        // If no prompt appears after 300ms, it's likely blocked
        new Promise(resolve => setTimeout(() => resolve('no_prompt'), 300))
      ]);
      
      // If we got 'no_prompt' but permission is still default, the prompt is likely blocked
      return result === 'no_prompt' && Notification.permission === 'default';
    } catch (err) {
      // In some browsers, this error indicates the permission prompt is blocked
      return true;
    }
  }
  
  return false;
};

// Request notification permission
const requestNotificationPermission = async () => {
  if (!canUseNotifications()) return false;
  
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

// Get current notification permission
const getNotificationPermission = () => {
  if (!canUseNotifications()) return 'unsupported';
  return Notification.permission;
};

// Show notification
const showNotification = async (title, options = {}) => {
  if (!canUseNotifications() || Notification.permission !== 'granted') {
    console.log('Cannot show notification: permissions not granted or notifications not supported');
    return false;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    console.log('Showing notification:', title, options);
    await registration.showNotification(title, {
      icon: '/favicon.ico',
      badge: '/notification-badge.png',
      vibrate: [100, 50, 100],
      requireInteraction: true, // Make notification stay until user interacts
      ...options
    });
    return true;
  } catch (error) {
    console.error('Error showing notification:', error);
    return false;
  }
};

// Play notification sound
const playNotificationSound = () => {
  const audio = new Audio('/notification-sound.mp3');
  audio.volume = 0.5; // 50% volume
  
  // Always play sound for message notifications
  audio.play().catch(err => {
    console.warn('Could not play notification sound:', err);
  });
};

// Show chat message notification
const showChatNotification = async (message, sender, conversationId) => {
  console.log('Attempting to show chat notification:', {message, sender, conversationId});
  
  // If message is too long, truncate it for the notification
  const truncatedMessage = message.length > 100 ? message.substring(0, 97) + '...' : message;
  
  const title = `New message from ${sender.display_name}`;
  const options = {
    body: truncatedMessage, // Use the actual message as the notification body
    icon: sender.avatar_url || '/favicon.ico',
    badge: '/notification-badge.png',
    tag: `chat-${conversationId}`, // Replace older notifications from same conversation
    data: {
      url: `/chat/${conversationId}`,
      senderId: sender.id,
      message: message
    },
    requireInteraction: true, // Make notification stay until user interacts
    renotify: true, // Notify each time even if from same conversation
    silent: false // Allow sound
  };
  
  // Play sound for new message notifications
  playNotificationSound();
  
  // For testing - try both methods
  // 1. Use the service worker
  const swResult = await showNotification(title, options);
  
  // 2. If service worker fails, try direct Notification API as fallback
  if (!swResult && Notification.permission === 'granted') {
    try {
      const notification = new Notification(title, {
        ...options,
        icon: options.icon || '/favicon.ico'
      });
      
      notification.onclick = () => {
        window.focus();
        notification.close();
        window.location.href = options.data.url;
      };
      
      return true;
    } catch (error) {
      console.error('Fallback notification failed:', error);
      return false;
    }
  }
  
  return swResult;
};

export {
  canUseNotifications,
  registerServiceWorker,
  requestNotificationPermission,
  getNotificationPermission,
  isPermissionBlocked,
  showNotification,
  showChatNotification,
  playNotificationSound
};
