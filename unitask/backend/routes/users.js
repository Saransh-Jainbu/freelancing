const express = require('express');
const router = express.Router();
const { query } = require('../db');

// Get user rating and review count
router.get('/:userId/rating', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await query(
      `SELECT 
         COALESCE(AVG(r.rating)::numeric(3, 2), 0) AS average_rating,
         COUNT(r.id) AS review_count
       FROM reviews r
       WHERE r.freelancer_id = $1`,
      [userId]
    );

    res.json({
      success: true,
      rating: result.rows[0].average_rating,
      reviews: result.rows[0].review_count
    });
  } catch (error) {
    console.error('Error fetching user rating:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user profile
router.get('/:userId/profile', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await query(
      `SELECT 
         u.id, 
         u.email, 
         p.display_name, 
         p.avatar_url, 
         p.bio, 
         p.location
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, profile: result.rows[0] });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;