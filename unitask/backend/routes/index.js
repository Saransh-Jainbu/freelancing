const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const gigsRoutes = require('./gigs');
const ordersRoutes = require('./orders');
const profileRoutes = require('./profile');
const messagesRoutes = require('./messages');
const conversationsRoutes = require('./conversations');
const notificationsRoutes = require('./notifications');
const projectsRoutes = require('./projects');
const bidsRoutes = require('./bids');
const businessRoutes = require('./business');
const healthRoutes = require('./health');

// Set up API routes
router.use('/auth', authRoutes);
router.use('/gigs', gigsRoutes);
router.use('/orders', ordersRoutes);
router.use('/profile', profileRoutes);
router.use('/messages', messagesRoutes);
router.use('/conversations', conversationsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/projects', projectsRoutes);
router.use('/bids', bidsRoutes);
router.use('/business', businessRoutes);
router.use('/health', healthRoutes);

// Root API endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to UniTask API',
    version: '1.0.0'
  });
});

module.exports = router;
