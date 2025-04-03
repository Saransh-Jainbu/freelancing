import { API_URL } from '../api/constants';

// Convert URL safe base64 string to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Register the service worker
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('ServiceWorker registration successful with scope:', registration.scope);
      return registration;
    } catch (error) {
      console.error('ServiceWorker registration failed:', error);
      throw error;
    }
  } else {
    throw new Error('Service workers are not supported in this browser');
  }
}

// Check if Push API is supported by the browser
function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

// Request permission for notifications
async function requestNotificationPermission() {
  try {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support desktop notification');
    }
    
    if (Notification.permission === 'granted') {
      return 'granted';
    }
    
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission;
    }
    
    return Notification.permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
}

// Function to request notification permission and handle user interaction
async function requestNotificationPermissionWithContext() {
  try {
    if (!('Notification' in window)) {
      console.log('This browser does not support desktop notification');
      return 'denied';
    }
    
    if (Notification.permission === 'granted') {
      return 'granted';
    }
    
    if (Notification.permission !== 'denied') {
      // Show context before requesting permission
      if (window.confirm(
        'Enable notifications to receive order updates and messages instantly, even when browsing other sites. Would you like to enable notifications?'
      )) {
        const permission = await Notification.requestPermission();
        return permission;
      } else {
        return 'dismissed'; // User dismissed the confirmation dialog
      }
    }
    
    return Notification.permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
}

// Subscribe to push notifications
async function subscribeToPushNotifications(userId) {
  try {
    if (!isPushSupported()) {
      throw new Error('Push notifications are not supported in this browser');
    }
    
    // Get permission first
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission denied');
    }
    
    // Register service worker
    const registration = await registerServiceWorker();
    
    // Get VAPID public key from server
    const response = await fetch(`${API_URL}/api/notifications/vapid-public-key`);
    if (!response.ok) {
      throw new Error('Failed to get VAPID public key');
    }
    
    const { publicKey } = await response.json();
    
    // Convert VAPID public key to Uint8Array
    const applicationServerKey = urlBase64ToUint8Array(publicKey);
    
    // Check if subscription already exists
    let subscription = await registration.pushManager.getSubscription();
    
    // If no subscription or re-subscribing
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });
    }
    
    // Send subscription to server
    await saveSubscription(subscription, userId);
    
    return subscription;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    throw error;
  }
}

// Save subscription to server
async function saveSubscription(subscription, userId) {
  try {
    const response = await fetch(`${API_URL}/api/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscription,
        userId
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to save subscription');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error saving subscription:', error);
    throw error;
  }
}

// Unsubscribe from push notifications
async function unsubscribeFromPushNotifications(userId) {
  try {
    if (!isPushSupported()) {
      return { success: false, message: 'Push notifications not supported' };
    }
    
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      return { success: false, message: 'No service worker registration found' };
    }
    
    // Get subscription
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      return { success: false, message: 'No subscription found' };
    }
    
    // Unsubscribe
    const success = await subscription.unsubscribe();
    
    if (success) {
      // Notify server about unsubscription
      await fetch(`${API_URL}/api/notifications/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          endpoint: subscription.endpoint
        })
      });
    }
    
    return { success, message: success ? 'Unsubscribed successfully' : 'Failed to unsubscribe' };
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    return { success: false, message: error.message || 'Error unsubscribing' };
  }
}

// Enhanced notification function with badge and sound
function showLocalNotification(title, options = {}) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return false;
  }
  
  try {
    // Default notification options
    const defaultOptions = {
      icon: '/notification-icon.png',
      badge: '/badge-icon.png',
      vibrate: [200, 100, 200],
      requireInteraction: options.requireInteraction || false,
    };
    
    // Create and show the notification
    const notification = new Notification(title, {
      ...defaultOptions,
      ...options
    });
    
    // Handle click events
    notification.onclick = function() {
      window.focus();
      if (options.onClick) {
        options.onClick();
      }
      notification.close();
    };
    
    // Play sound if specified
    if (options.sound) {
      const audio = new Audio(options.sound);
      audio.play().catch(e => console.error('Error playing notification sound:', e));
    }
    
    return notification;
  } catch (error) {
    console.error('Error showing notification:', error);
    return false;
  }
}

export {
  registerServiceWorker,
  isPushSupported,
  requestNotificationPermission,
  requestNotificationPermissionWithContext, // Export the enhanced permission requester
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  showLocalNotification // Export the enhanced notification function
};
