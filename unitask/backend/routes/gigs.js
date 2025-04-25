const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { recommendGigs } = require('../services/recommendationService');

/**
 * GET /search
 * Search for gigs with AI-powered recommendations.
 */
router.get('/search', async (req, res) => {
    const searchQuery = req.query.q;

    try {
        // Fetch gigs from the database
        const result = await query(
            `SELECT id, title, description, category, price, review_count as reviewCount FROM gigs WHERE status = 'active'`
        );
        const gigs = result.rows;

        // Find recommended gigs
        const recommendations = recommendGigs(searchQuery, gigs);

        // If no recommendations, return gigs with high review counts as fallback
        const fallbackGigs = gigs.sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 10);
        const resultGigs = recommendations.length > 0 ? recommendations : fallbackGigs;

        res.json({ success: true, gigs: resultGigs });
    } catch (error) {
        console.error('Error fetching gigs:', error);
        res.status(500).json({ success: false, message: 'Server error fetching gigs' });
    }
});

// Create a new gig
router.post('/', async (req, res) => {
  try {
    const { userId, title, category, price, description, packages } = req.body;
    
    // Validate required fields
    if (!userId || !title || !category || !price || !description) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Start a transaction
    await query('BEGIN');
    
    try {
      // Insert basic gig info
      const result = await query(
        `INSERT INTO gigs (user_id, title, category, price, description)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, user_id, title, description, category, price, status, orders, rating,
         created_at`,
        [userId, title, category, price, description]
      );
      
      const gigId = result.rows[0].id;
      
      // Store packages if provided
      if (packages) {
        // Convert packages object to array of package types
        const packageTypes = Object.keys(packages);
        
        for (const packageType of packageTypes) {
          const pkg = packages[packageType];
          
          await query(
            `INSERT INTO gig_packages (
              gig_id, 
              package_type, 
              price, 
              delivery_days, 
              revisions, 
              features
            ) VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              gigId,
              packageType,
              pkg.price,
              pkg.delivery_days,
              pkg.revisions,
              JSON.stringify(pkg.features)
            ]
          );
        }
      }
      
      // Get seller information
      const sellerInfo = await query(
        `SELECT 
          u.display_name as seller_name,
          p.title as seller_title,
          p.avatar_url as seller_avatar
         FROM users u
         LEFT JOIN profiles p ON u.id = p.user_id
         WHERE u.id = $1`,
        [userId]
      );

      await query('COMMIT');

      const gig = {
        ...result.rows[0],
        seller_name: sellerInfo.rows[0]?.seller_name,
        seller_title: sellerInfo.rows[0]?.seller_title,
        seller_avatar: sellerInfo.rows[0]?.seller_avatar,
        packages: packages
      };
      
      res.status(201).json({ 
        success: true, 
        gig 
      });
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Gig creation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error creating gig',
      error: error.message 
    });
  }
});

// Get gig details with packages
router.get('/:gigId/details', async (req, res) => {
  try {
    const { gigId } = req.params;
    
    // Get basic gig information
    const result = await query(
      `SELECT 
        g.id, 
        g.title, 
        g.description, 
        g.category,
        g.price,
        g.rating,
        g.created_at,
        u.id as seller_id,
        u.display_name as seller_name,
        p.title as seller_title,
        p.avatar_url as seller_avatar,
        p.rating as seller_rating,
        p.completion_rate,
        p.response_time
      FROM gigs g
      JOIN users u ON g.user_id = u.id
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE g.id = $1 AND g.status = 'active'`,
      [gigId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Gig not found' });
    }
    
    // Get the gig packages
    const packagesResult = await query(
      `SELECT 
        package_type, 
        price, 
        delivery_days, 
        revisions, 
        features
      FROM gig_packages
      WHERE gig_id = $1
      ORDER BY 
        CASE 
          WHEN package_type = 'basic' THEN 1
          WHEN package_type = 'standard' THEN 2
          WHEN package_type = 'premium' THEN 3
          ELSE 4
        END`,
      [gigId]
    );
    
    // Convert packages from array to object
    const packages = {};
    packagesResult.rows.forEach(pkg => {
      packages[pkg.package_type] = {
        price: pkg.price,
        delivery_days: pkg.delivery_days,
        revisions: pkg.revisions,
        features: pkg.features
      };
    });
    
    res.json({
      success: true,
      gig: {
        ...result.rows[0],
        packages
      }
    });
  } catch (error) {
    console.error('Gig details fetch error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching gig details' });
  }
});

// Delete a gig
router.delete('/:gigId', async (req, res) => {
  try {
    const { gigId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    // Check if the gig exists and belongs to the user
    const checkResult = await query(
      'SELECT id FROM gigs WHERE id = $1 AND user_id = $2',
      [gigId, userId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Gig not found or you are not authorized to delete it'
      });
    }
    
    // Start transaction
    await query('BEGIN');
    
    try {
      // Delete any associated packages first (foreign key constraint)
      await query('DELETE FROM gig_packages WHERE gig_id = $1', [gigId]);
      
      // Delete the gig
      const result = await query(
        'DELETE FROM gigs WHERE id = $1 AND user_id = $2 RETURNING id',
        [gigId, userId]
      );
      
      await query('COMMIT');
      
      res.json({
        success: true,
        deleted: gigId
      });
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error deleting gig:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting gig',
      error: error.message
    });
  }
});

module.exports = router;
