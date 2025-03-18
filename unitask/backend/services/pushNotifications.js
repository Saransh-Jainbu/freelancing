/**
 * Push Notification Service for UniTask
 * This service handles web push notifications
 */

const webPush = require('web-push');

// Load the VAPID keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

// Set the VAPID details
if (vapidPublicKey && vapidPrivateKey) {
  webPush.setVapidDetails(
    'mailto:support@unitask.com',  // Replace with your contact email
    vapidPublicKey,
    vapidPrivateKey
  );
  console.log('Web Push configured with VAPID keys');
} else {
  console.warn('VAPID keys not found. Push notifications will not function.');
}

// Store subscriptions in memory (for development)
// In production, these should be stored in a database
const subscriptions = new Map(); // userId -> subscription[]

/**
 * Subscribe a user to push notifications
 * @param {number} userId - User ID
 * @param {Object} subscription - PushSubscription object
 */
function subscribe(userId, subscription) {
  if (!userId || !subscription) {
    console.error('Invalid subscription data');
    return false;
  }
  
  // Store the subscription
  if (!subscriptions.has(userId)) {
    subscriptions.set(userId, []);
  }
  
  // Check if this subscription already exists
  const userSubs = subscriptions.get(userId);
  const exists = userSubs.some(sub => sub.endpoint === subscription.endpoint);
  
  if (!exists) {
    userSubs.push(subscription);
    console.log(`User ${userId} subscribed to push notifications`);
  }
  
  return true;
}

/**
 * Unsubscribe a user from push notifications
 * @param {number} userId - User ID
 * @param {string} endpoint - Subscription endpoint
 */
function unsubscribe(userId, endpoint) {
  if (!userId || !endpoint || !subscriptions.has(userId)) {
    return false;
  }
  
  const userSubs = subscriptions.get(userId);
  const filteredSubs = userSubs.filter(sub => sub.endpoint !== endpoint);
  
  if (filteredSubs.length !== userSubs.length) {
    subscriptions.set(userId, filteredSubs);
    console.log(`Subscription removed for user ${userId}`);
    return true;
  }
  
  return false;
}

/**
 * Send a push notification to a user
 * @param {number} userId - User ID
 * @param {Object} notification - Notification data
 * @param {string} notification.title - Notification title
 * @param {string} notification.body - Notification body
 * @param {string} notification.icon - Notification icon URL
 * @param {string} notification.url - URL to open when notification is clicked
 */
async function sendNotification(userId, notification) {
  if (!userId || !subscriptions.has(userId)) {
    return { sent: 0, failed: 0 };
  }
  
  const userSubs = subscriptions.get(userId);
  
  if (userSubs.length === 0) {
    return { sent: 0, failed: 0 };
  }
  
  console.log(`Sending notification to user ${userId} (${userSubs.length} subscriptions)`);
  
  const payload = JSON.stringify({
    title: notification.title || 'UniTask Notification',
    body: notification.body || 'You have a new notification',
    icon: notification.icon || '/favicon.ico',
    badge: '/notification-badge.png',
    tag: notification.tag || 'unitask-notification',
    data: {
      url: notification.url || '/'
    }
  });
  
  // Send to all subscriptions for this user
  let sent = 0;
  let failed = 0;
  const failedSubscriptions = [];
  
  for (const subscription of userSubs) {
    try {
      await webPush.sendNotification(subscription, payload);
      sent++;
    } catch (error) {
      console.error('Error sending notification:', error);
      // If the subscription is no longer valid, mark it for removal
      if (error.statusCode === 410) {
        failedSubscriptions.push(subscription.endpoint);
      }
      failed++;
    }
  }
  
  // Clean up expired subscriptions
  if (failedSubscriptions.length > 0) {
    subscriptions.set(
      userId,
      userSubs.filter(sub => !failedSubscriptions.includes(sub.endpoint))
    );
  }
  
  return { sent, failed };
}

module.exports = {
  subscribe,
  unsubscribe,
  sendNotification,
  // Export VAPID public key for the frontend
  getPublicKey: () => vapidPublicKey
};
