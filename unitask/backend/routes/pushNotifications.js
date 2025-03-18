/**
 * Push Notification Routes
 */

const express = require('express');
const router = express.Router();
const pushService = require('../services/pushNotifications');

// Get VAPID public key
router.get('/vapid-public-key', (req, res) => {
  const publicKey = pushService.getPublicKey();
  
  if (!publicKey) {
    return res.status(501).json({
      success: false,
      message: 'Push notifications are not configured on the server'
    });
  }
  
  res.json({
    success: true,
    publicKey
  });
});

// Subscribe to push notifications
router.post('/subscribe', (req, res) => {
  const { userId, subscription } = req.body;
  
  if (!userId || !subscription) {
    return res.status(400).json({
      success: false,
      message: 'Missing required parameters'
    });
  }
  
  const success = pushService.subscribe(userId, subscription);
  
  res.json({
    success,
    message: success ? 'Subscription saved' : 'Failed to save subscription'
  });
});

// Unsubscribe from push notifications
router.post('/unsubscribe', (req, res) => {
  const { userId, endpoint } = req.body;
  
  if (!userId || !endpoint) {
    return res.status(400).json({
      success: false,
      message: 'Missing required parameters'
    });
  }
  
  const success = pushService.unsubscribe(userId, endpoint);
  
  res.json({
    success,
    message: success ? 'Subscription removed' : 'Failed to remove subscription'
  });
});

// Manual test endpoint to send a notification
router.post('/send-test', async (req, res) => {
  const { userId, title, body, url } = req.body;
  
  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'Missing user ID'
    });
  }
  
  const result = await pushService.sendNotification(userId, {
    title: title || 'Test Notification',
    body: body || 'This is a test notification from UniTask',
    url: url || '/chat'
  });
  
  res.json({
    success: true,
    result
  });
});

module.exports = router;
