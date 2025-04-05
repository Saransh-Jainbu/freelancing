const express = require('express');
const router = express.Router();
const { query } = require('../db');

// Get business profile
router.get('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await query(
      `SELECT 
        u.id, u.email, u.display_name, u.user_type, u.created_at,
        bp.company_name, bp.industry, bp.company_size, bp.website_url,
        bp.company_description, bp.logo_url, bp.verified, bp.location,
        bp.phone_number
      FROM users u
      LEFT JOIN business_profiles bp ON u.id = bp.user_id
      WHERE u.id = $1 AND u.user_type = 'business'`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Business profile not found'
      });
    }
    
    res.json({
      success: true,
      profile: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching business profile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching business profile' 
    });
  }
});

// Update business profile
router.put('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      companyName,
      industry,
      companySize,
      websiteUrl,
      companyDescription,
      location,
      phoneNumber,
      displayName
    } = req.body;
    
    // First check if the user exists and is a business
    const userCheck = await query(
      'SELECT id, user_type FROM users WHERE id = $1',
      [userId]
    );
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (userCheck.rows[0].user_type !== 'business') {
      return res.status(403).json({
        success: false,
        message: 'Only business accounts can update business profiles'
      });
    }
    
    // Start a transaction
    await query('BEGIN');
    
    try {
      // Update user table for display name
      if (displayName) {
        await query(
          'UPDATE users SET display_name = $1 WHERE id = $2',
          [displayName, userId]
        );
      }
      
      // Check if business profile exists
      const profileCheck = await query(
        'SELECT user_id FROM business_profiles WHERE user_id = $1',
        [userId]
      );
      
      if (profileCheck.rows.length === 0) {
        // Create new profile
        await query(
          `INSERT INTO business_profiles 
            (user_id, company_name, industry, company_size, website_url, company_description, location, phone_number)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            userId, 
            companyName, 
            industry, 
            companySize, 
            websiteUrl, 
            companyDescription,
            location,
            phoneNumber
          ]
        );
      } else {
        // Update existing profile
        await query(
          `UPDATE business_profiles 
           SET 
            company_name = COALESCE($1, company_name),
            industry = COALESCE($2, industry),
            company_size = COALESCE($3, company_size),
            website_url = COALESCE($4, website_url),
            company_description = COALESCE($5, company_description),
            location = COALESCE($6, location),
            phone_number = COALESCE($7, phone_number)
           WHERE user_id = $8`,
          [
            companyName,
            industry,
            companySize,
            websiteUrl,
            companyDescription,
            location,
            phoneNumber,
            userId
          ]
        );
      }
      
      await query('COMMIT');
      
      // Get updated profile
      const result = await query(
        `SELECT 
          u.id, u.email, u.display_name, u.user_type, u.created_at,
          bp.company_name, bp.industry, bp.company_size, bp.website_url,
          bp.company_description, bp.logo_url, bp.verified, bp.location,
          bp.phone_number
        FROM users u
        LEFT JOIN business_profiles bp ON u.id = bp.user_id
        WHERE u.id = $1`,
        [userId]
      );
      
      res.json({
        success: true,
        profile: result.rows[0]
      });
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error updating business profile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error updating business profile',
      error: error.message
    });
  }
});

// Update business logo
router.put('/profile/:userId/logo', async (req, res) => {
  try {
    const { userId } = req.params;
    const { logoUrl } = req.body;
    
    if (!logoUrl) {
      return res.status(400).json({
        success: false,
        message: 'Logo URL is required'
      });
    }
    
    const result = await query(
      `UPDATE business_profiles
       SET logo_url = $1
       WHERE user_id = $2
       RETURNING logo_url`,
      [logoUrl, userId]
    );
    
    if (result.rowCount === 0) {
      // Create profile with logo if doesn't exist
      await query(
        `INSERT INTO business_profiles (user_id, logo_url)
         VALUES ($1, $2)`,
        [userId, logoUrl]
      );
    }
    
    res.json({
      success: true,
      logoUrl
    });
  } catch (error) {
    console.error('Error updating business logo:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating business logo'
    });
  }
});

// Get all business profiles (for public directory)
router.get('/directory', async (req, res) => {
  try {
    const result = await query(
      `SELECT 
        u.id, u.display_name, u.created_at,
        bp.company_name, bp.industry, bp.logo_url, bp.verified, bp.location
      FROM users u
      JOIN business_profiles bp ON u.id = bp.user_id
      WHERE u.user_type = 'business'
      ORDER BY bp.verified DESC, u.created_at DESC`
    );
    
    res.json({
      success: true,
      businesses: result.rows
    });
  } catch (error) {
    console.error('Error fetching business directory:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching business directory'
    });
  }
});

module.exports = router;
