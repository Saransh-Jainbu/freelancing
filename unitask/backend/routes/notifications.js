const express = require('express');
const router = express.Router();
const { query } = require('../db');
const webpush = require('web-push');

// Configure webpush with VAPID keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

webpush.setVapidDetails(
  'mailto:contact@unitask.com', // Your contact email
  vapidPublicKey,
  vapidPrivateKey
);

// Get VAPID public key
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: vapidPublicKey });
});

// Subscribe to push notifications
router.post('/subscribe', async (req, res) => {
  try {
    const { subscription, userId } = req.body;
    
    if (!subscription || !userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    // Store subscription in database
    await query(
      `INSERT INTO push_subscriptions (
        user_id, endpoint, p256dh, auth, created_at
      ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (endpoint) 
      DO UPDATE SET 
        user_id = $1,
        p256dh = $3,
        auth = $4,
        updated_at = CURRENT_TIMESTAMP`,
      [
        userId,
        subscription.endpoint,
        subscription.keys.p256dh,
        subscription.keys.auth
      ]
    );

    // Send a test notification
    const payload = JSON.stringify({
      title: 'Notifications Enabled',
      message: 'You will now receive notifications for new orders and messages.',
      url: `${process.env.FRONTEND_URL}/dashboard`,
      requireInteraction: false
    });

    try {
      await webpush.sendNotification(subscription, payload);
      console.log('Test notification sent successfully');
    } catch (pushError) {
      console.error('Error sending test notification:', pushError);
      // Continue even if test notification fails
    }

    res.status(201).json({
      success: true,
      message: 'Subscription saved successfully'
    });
  } catch (error) {
    console.error('Error saving subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving subscription'
    });
  }
});

// Unsubscribe from push notifications
router.post('/unsubscribe', async (req, res) => {
  try {
    const { userId, endpoint } = req.body;
    
    if (!endpoint) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing endpoint' 
      });
    }

    // Delete subscription from database
    await query(
      'DELETE FROM push_subscriptions WHERE endpoint = $1',
      [endpoint]
    );

    res.json({
      success: true,
      message: 'Subscription removed successfully'
    });
  } catch (error) {
    console.error('Error removing subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing subscription'
    });
  }
});

// Get user notifications
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    
    const result = await query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    
    res.json({ success: true, notifications: result.rows });
  } catch (error) {
    console.error('Notifications fetch error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching notifications' });
  }
});

// Mark notification as read
router.put('/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId } = req.body;
    
    const result = await query(
      `UPDATE notifications 
       SET is_read = TRUE 
       WHERE id = $1 AND user_id = $2 
       RETURNING *`,
      [notificationId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Notification not found or not authorized' 
      });
    }
    
    res.json({ success: true, notification: result.rows[0] });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'Server error updating notification' });
  }
});

// Mark all notifications as read
router.put('/user/:userId/read-all', async (req, res) => {
  try {
    const { userId } = req.params;
    
    await query(
      `UPDATE notifications 
       SET is_read = TRUE 
       WHERE user_id = $1 AND is_read = FALSE`,
      [userId]
    );
    
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, message: 'Server error updating notifications' });
  }
});

// Send a push notification to a user
async function sendPushNotification(userId, title, message, url, tag) {
  try {
    // Get user's push subscriptions
    const subscriptionsResult = await query(
      `SELECT endpoint, p256dh, auth
       FROM push_subscriptions
       WHERE user_id = $1`,
      [userId]
    );
    
    if (subscriptionsResult.rows.length === 0) {
      console.log(`No push subscriptions found for user ${userId}`);
      return false;
    }
    
    const payload = JSON.stringify({
      title,
      message,
      url: url || `${process.env.FRONTEND_URL}/dashboard`,
      tag: tag || 'default',
      requireInteraction: true
    });
    
    let successCount = 0;
    
    // Send notification to all user's subscriptions
    for (const sub of subscriptionsResult.rows) {
      try {
        const subscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        };
        
        await webpush.sendNotification(subscription, payload);
        successCount++;
      } catch (error) {
        // If subscription is expired, remove it
        if (error.statusCode === 404 || error.statusCode === 410) {
          console.log(`Removing expired subscription for user ${userId}`);
          await query(
            'DELETE FROM push_subscriptions WHERE endpoint = $1',
            [sub.endpoint]
          );
        } else {
          console.error(`Error sending push notification to user ${userId}:`, error);
        }
      }
    }
    
    return successCount > 0;
  } catch (error) {
    console.error(`Error sending push notification to user ${userId}:`, error);
    return false;
  }
}

module.exports = router;
module.exports.sendPushNotification = sendPushNotification;
