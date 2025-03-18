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
    return false;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      icon: '/favicon.ico',
      badge: '/notification-badge.png',
      vibrate: [100, 50, 100],
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
  
  // Only play sound if tab is not focused
  if (!document.hasFocus()) {
    audio.play().catch(err => {
      console.warn('Could not play notification sound:', err);
    });
  }
};

// Show chat message notification
const showChatNotification = async (message, sender, conversationId) => {
  const title = 'New Message from UniTask';
  const options = {
    body: `${sender.display_name}: ${message}`,
    icon: sender.avatar_url || '/favicon.ico',
    badge: '/notification-badge.png',
    tag: `chat-${conversationId}`, // Replace older notifications from same conversation
    data: {
      url: `/chat/${conversationId}`,
    },
    requireInteraction: false, // Auto close
    silent: false // Allow sound
  };
  
  playNotificationSound();
  return await showNotification(title, options);
};

export {
  canUseNotifications,
  registerServiceWorker,
  requestNotificationPermission,
  getNotificationPermission,
  showNotification,
  showChatNotification,
  playNotificationSound
};
