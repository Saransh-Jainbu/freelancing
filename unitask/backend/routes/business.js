const express = require('express');
const router = express.Router();
const { query } = require('../db');

// Get business profile
router.get('/profile/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const result = await query(
      `SELECT 
        u.display_name,
        u.email,
        bp.company_name,
        bp.industry,
        bp.company_size,
        bp.website_url,
        bp.description,
        bp.logo_url,
        bp.verified,
        bp.created_at as member_since
      FROM users u
      JOIN business_profiles bp ON u.id = bp.user_id
      WHERE u.id = $1 AND u.user_type = 'business'`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Business profile not found' });
    }
    
    res.json({ success: true, profile: result.rows[0] });
  } catch (error) {
    console.error('Error fetching business profile:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update business profile
router.put('/profile/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const {
      displayName,
      companyName,
      industry,
      companySize,
      websiteUrl,
      description
    } = req.body;
    
    // Start transaction
    await query('BEGIN');
    
    // Update user display name
    await query(
      'UPDATE users SET display_name = $1 WHERE id = $2 AND user_type = $3',
      [displayName, userId, 'business']
    );
    
    // Update business profile
    await query(
      `UPDATE business_profiles
       SET company_name = $1, 
           industry = $2, 
           company_size = $3, 
           website_url = $4, 
           description = $5,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $6`,
      [companyName, industry, companySize, websiteUrl, description, userId]
    );
    
    await query('COMMIT');
    
    res.json({ 
      success: true, 
      message: 'Business profile updated successfully' 
    });
  } catch (error) {
    await query('ROLLBACK');
    console.error('Error updating business profile:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update business logo
router.put('/profile/:userId/logo', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { logoUrl } = req.body;
    
    await query(
      'UPDATE business_profiles SET logo_url = $1 WHERE user_id = $2',
      [logoUrl, userId]
    );
    
    res.json({ 
      success: true, 
      message: 'Logo updated successfully' 
    });
  } catch (error) {
    console.error('Error updating business logo:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all business profiles (for public directory)
router.get('/directory', async (req, res) => {
  try {
    const { limit = 20, offset = 0, searchTerm = '' } = req.query;
    
    const searchQuery = searchTerm ? `AND (
      bp.company_name ILIKE '%${searchTerm}%' OR
      bp.industry ILIKE '%${searchTerm}%' OR
      bp.description ILIKE '%${searchTerm}%'
    )` : '';
    
    const result = await query(
      `SELECT 
        u.id,
        u.display_name,
        bp.company_name,
        bp.industry,
        bp.logo_url,
        bp.verified,
        (SELECT COUNT(*) FROM projects WHERE business_id = u.id) as project_count
      FROM users u
      JOIN business_profiles bp ON u.id = bp.user_id
      WHERE u.user_type = 'business' ${searchQuery}
      ORDER BY bp.verified DESC, u.display_name ASC
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    
    res.json({ success: true, businesses: result.rows });
  } catch (error) {
    console.error('Error fetching business directory:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
