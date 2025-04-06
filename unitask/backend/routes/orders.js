const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { sendEmail } = require('../services/emailService');
const { 
  newOrderTemplate, 
  newOrderTextTemplate,
  orderConfirmationTemplate,
  orderConfirmationTextTemplate
} = require('../services/emailTemplates');
const { sendPushNotification } = require('../routes/notifications');

// Create new order
router.post('/', async (req, res) => {
  try {
    const { 
      gig_id, 
      client_id, 
      requirements, 
      delivery_time,
      amount,
      package,
      quantity = 1
    } = req.body;

    // Validate required fields
    if (!gig_id || !client_id || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Start transaction
    await query('BEGIN');

    try {
      // Get gig details
      const gigResult = await query(
        `SELECT g.title, g.user_id as freelancer_id, g.price, 
         u.display_name as freelancer_name, u.email as freelancer_email
         FROM gigs g
         JOIN users u ON g.user_id = u.id
         WHERE g.id = $1`,
        [gig_id]
      );

      if (gigResult.rows.length === 0) {
        throw new Error('Gig not found');
      }

      const gig = gigResult.rows[0];

      // Get buyer details
      const buyerResult = await query(
        `SELECT display_name, email FROM users WHERE id = $1`,
        [client_id]
      );

      if (buyerResult.rows.length === 0) {
        throw new Error('Buyer not found');
      }

      const buyer = buyerResult.rows[0];

      // Create the order
      const orderResult = await query(
        `INSERT INTO orders (
          gig_id, client_id, freelancer_id, amount,
          requirements, delivery_time, status, package_type, quantity
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8)
        RETURNING *`,
        [
          gig_id, 
          client_id, 
          gig.freelancer_id, 
          amount, 
          requirements || '', 
          delivery_time || 7, 
          package || 'basic', 
          quantity
        ]
      );

      const order = orderResult.rows[0];

      // Update order count on gig
      await query(
        `UPDATE gigs 
         SET orders = orders + 1
         WHERE id = $1`,
        [gig_id]
      );

      // Create conversation for order communication
      const conversationResult = await query(
        `INSERT INTO conversations (gig_id, gig_title)
         VALUES ($1, $2)
         RETURNING id`,
        [gig_id, gig.title]
      );

      // Add participants to conversation
      await query(
        `INSERT INTO conversation_participants (conversation_id, user_id)
         VALUES ($1, $2), ($1, $3)`,
        [conversationResult.rows[0].id, client_id, gig.freelancer_id]
      );

      // Add initial message about order
      await query(
        `INSERT INTO messages (conversation_id, sender_id, content)
         VALUES ($1, $2, $3)`,
        [
          conversationResult.rows[0].id, 
          client_id,
          `Order #${order.id} has been placed! I'm looking forward to working with you.`
        ]
      );

      // Create notification record for the seller
      const notificationResult = await query(
        `INSERT INTO notifications (
          user_id, type, title, message, reference_id, reference_type
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id`,
        [
          gig.freelancer_id,
          'order',
          'New Order Received',
          `${buyer.display_name} placed a new order for "${gig.title}"`,
          order.id,
          'order'
        ]
      );

      await query('COMMIT');

      const orderWithTitle = { ...order, gig_title: gig.title };

      // 1. Send email notification to freelancer (seller)
      sendEmail({
        to: gig.freelancer_email,
        subject: `New Order #${order.id} - UniTask`,
        html: newOrderTemplate(orderWithTitle, buyer, { display_name: gig.freelancer_name }),
        text: newOrderTextTemplate(orderWithTitle, buyer, { display_name: gig.freelancer_name })
      }).catch(err => console.error('Error sending seller email:', err));

      // 2. Send confirmation email to buyer
      sendEmail({
        to: buyer.email,
        subject: `Order Confirmation #${order.id} - UniTask`,
        html: orderConfirmationTemplate(orderWithTitle, { display_name: gig.freelancer_name }),
        text: orderConfirmationTextTemplate(orderWithTitle, { display_name: gig.freelancer_name })
      }).catch(err => console.error('Error sending buyer email:', err));

      // 3. Send push notification to seller
      sendPushNotification(
        gig.freelancer_id,
        'New Order Received',
        `${buyer.display_name} just placed an order for "${gig.title}"`,
        `${process.env.FRONTEND_URL}/orders/${order.id}`,
        `new-order-${order.id}`
      ).catch(err => console.error('Error sending push notification:', err));

      // Return success response
      res.status(201).json({
        success: true,
        order: {
          ...order,
          conversation_id: conversationResult.rows[0].id,
          gig_title: gig.title
        }
      });
    } catch (err) {
      await query('ROLLBACK');
      throw err;
    }
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create order'
    });
  }
});

// Get orders for user (both as client and freelancer)
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.query; // 'client' or 'freelancer'

    const whereClause = role === 'client' 
      ? 'o.client_id = $1'
      : 'o.freelancer_id = $1';

    const orders = await query(
      `SELECT 
        o.*,
        g.title as gig_title,
        g.price as gig_price,
        u.display_name as client_name,
        f.display_name as freelancer_name,
        r.rating,
        r.comment as review
      FROM orders o
      JOIN gigs g ON o.gig_id = g.id
      JOIN users u ON o.client_id = u.id
      JOIN users f ON o.freelancer_id = f.id
      LEFT JOIN reviews r ON o.id = r.order_id
      WHERE ${whereClause}
      ORDER BY o.created_at DESC`,
      [userId]
    );

    res.json({ success: true, orders: orders.rows });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single order by ID
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const result = await query(
      `SELECT 
        o.*,
        g.title as gig_title,
        g.price as gig_price,
        u.display_name as client_name,
        f.display_name as freelancer_name,
        r.rating,
        r.comment as review
      FROM orders o
      JOIN gigs g ON o.gig_id = g.id
      JOIN users u ON o.client_id = u.id
      JOIN users f ON o.freelancer_id = f.id
      LEFT JOIN reviews r ON o.id = r.order_id
      WHERE o.id = $1`,
      [orderId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    res.json({ success: true, order: result.rows[0] });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update order status
router.put('/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, userId } = req.body;

    const result = await query(
      `UPDATE orders 
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND freelancer_id = $3
       RETURNING *`,
      [status, orderId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found or unauthorized' 
      });
    }

    res.json({ success: true, order: result.rows[0] });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Submit review
router.post('/:orderId/review', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { 
      reviewer_id, 
      rating, 
      comment 
    } = req.body;

    // Check if order exists and is completed
    const orderCheck = await query(
      `SELECT freelancer_id, status 
       FROM orders WHERE id = $1`,
      [orderId]
    );

    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    if (orderCheck.rows[0].status !== 'completed') {
      return res.status(400).json({ 
        success: false, 
        message: 'Order must be completed before reviewing' 
      });
    }

    // Create review
    const result = await query(
      `INSERT INTO reviews (
        order_id, reviewer_id, freelancer_id,
        gig_id, rating, comment
      )
      SELECT 
        $1, $2, freelancer_id, gig_id, $3, $4
      FROM orders
      WHERE id = $1
      RETURNING *`,
      [orderId, reviewer_id, rating, comment]
    );

    // Update freelancer's average rating
    await query(
      `UPDATE profiles
       SET rating = (
         SELECT AVG(rating)::numeric(3,2)
         FROM reviews
         WHERE freelancer_id = $1
       ),
       reviews = (
         SELECT COUNT(*)
         FROM reviews
         WHERE freelancer_id = $1
       )
       WHERE user_id = $1`,
      [orderCheck.rows[0].freelancer_id]
    );

    res.json({ success: true, review: result.rows[0] });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Fetch orders in 'verifying' state for a seller
router.get('/verifying/seller/:sellerId', async (req, res) => {
  try {
    const { sellerId } = req.params;

    const result = await query(
      `SELECT o.*, g.title as gig_title, u.display_name as client_name
       FROM orders o
       JOIN gigs g ON o.gig_id = g.id
       JOIN users u ON o.client_id = u.id
       WHERE o.freelancer_id = $1 AND o.status = 'verifying'
       ORDER BY o.created_at DESC`,
      [sellerId]
    );

    res.json({ success: true, orders: result.rows });
  } catch (error) {
    console.error('Error fetching verifying orders:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Fetch cancelled orders for a seller
router.get('/cancelled/seller/:sellerId', async (req, res) => {
  try {
    const { sellerId } = req.params;

    const result = await query(
      `SELECT o.*, g.title as gig_title, u.display_name as client_name
       FROM orders o
       JOIN gigs g ON o.gig_id = g.id
       JOIN users u ON o.client_id = u.id
       WHERE o.freelancer_id = $1 AND o.status = 'cancelled'
       ORDER BY o.created_at DESC`,
      [sellerId]
    );

    res.json({ success: true, orders: result.rows });
  } catch (error) {
    console.error('Error fetching cancelled orders:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
