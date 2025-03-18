import { API_URL } from '../constants';
import { registerServiceWorker } from '../services/notificationService';

/**
 * Get the VAPID public key from the server
 * @returns {Promise<string>} - VAPID public key
 */
export const getVapidKey = async () => {
  try {
    const response = await fetch(`${API_URL}/api/notifications/vapid-public-key`);
    
    if (!response.ok) {
      throw new Error(`Failed to get VAPID key: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.publicKey;
  } catch (error) {
    console.error('Error fetching VAPID key:', error);
    throw error;
  }
};

/**
 * Convert a base64 string to Uint8Array for subscription
 * @param {string} base64String - Base64 encoded string
 * @returns {Uint8Array} - Uint8Array
 */
const urlBase64ToUint8Array = (base64String) => {
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
};

/**
 * Subscribe user to push notifications
 * @param {number} userId - User ID
 * @returns {Promise<boolean>} - True if subscription was successful
 */
export const subscribeToPushNotifications = async (userId) => {
  try {
    console.log('[Notifications API] Subscribing to push notifications for user:', userId);
    
    // Check if service worker and push manager are supported
    if (!('serviceWorker' in navigator && 'PushManager' in window)) {
      console.warn('[Notifications API] Push notifications not supported');
      return false;
    }
    
    // Register service worker
    const registration = await registerServiceWorker();
    if (!registration) {
      throw new Error('Failed to register service worker');
    }
    
    // Get VAPID key
    const vapidKey = await getVapidKey();
    if (!vapidKey) {
      throw new Error('No VAPID key available');
    }
    
    // Get existing subscription or create a new one
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      console.log('[Notifications API] Creating new push subscription');
      
      // Create new subscription
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey)
      });
    }
    
    // Send subscription to server
    const response = await fetch(`${API_URL}/api/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        subscription
      })
    });
    
    if (!response.ok) {
      throw new Error(`Subscription failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      console.log('[Notifications API] Successfully subscribed to push notifications');
      return true;
    } else {
      console.error('[Notifications API] Failed to save subscription:', data.message);
      return false;
    }
  } catch (error) {
    console.error('[Notifications API] Error subscribing to push notifications:', error);
    return false;
  }
};

/**
 * Unsubscribe from push notifications
 * @param {number} userId - User ID
 * @returns {Promise<boolean>} - True if unsubscription was successful
 */
export const unsubscribeFromPushNotifications = async (userId) => {
  try {
    // Check if service worker is registered
    if (!('serviceWorker' in navigator)) {
      return false;
    }
    
    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;
    
    // Get existing subscription
    const subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      console.log('[Notifications API] No subscription to unsubscribe from');
      return true;
    }
    
    // Unsubscribe on client side
    const unsubscribed = await subscription.unsubscribe();
    
    if (unsubscribed) {
      // Notify server
      const response = await fetch(`${API_URL}/api/notifications/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          endpoint: subscription.endpoint
        })
      });
      
      if (!response.ok) {
        throw new Error(`Unsubscription failed: ${response.status}`);
      }
      
      console.log('[Notifications API] Successfully unsubscribed from push notifications');
      return true;
    } else {
      throw new Error('Failed to unsubscribe on client side');
    }
  } catch (error) {
    console.error('[Notifications API] Error unsubscribing from push notifications:', error);
    return false;
  }
};
