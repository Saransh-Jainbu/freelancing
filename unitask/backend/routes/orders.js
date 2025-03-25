const express = require('express');
const router = express.Router();
const { query } = require('../db');

// Create new order
router.post('/', async (req, res) => {
  try {
    const { 
      gig_id, 
      client_id, 
      requirements, 
      delivery_time,
      amount 
    } = req.body;

    const result = await query(
      `INSERT INTO orders (
        gig_id, client_id, freelancer_id, amount, 
        requirements, delivery_time
      )
      SELECT 
        $1, $2, user_id, $3, $4, $5
      FROM gigs
      WHERE id = $1
      RETURNING *`,
      [gig_id, client_id, amount, requirements, delivery_time]
    );

    res.json({ success: true, order: result.rows[0] });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, message: error.message });
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

module.exports = router;
