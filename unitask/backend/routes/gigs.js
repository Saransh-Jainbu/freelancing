const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { recommendGigs } = require('../services/recommendationService');

// Mock data for gigs (replace with database query in production)
const gigs = [
    { id: 1, title: 'Web Development', description: 'Build responsive websites using React and Node.js' },
    { id: 2, title: 'Graphic Design', description: 'Create stunning visuals and logos' },
    { id: 3, title: 'Content Writing', description: 'Write engaging blog posts and articles' },
];

/**
 * GET /search
 * Search for gigs with AI-powered recommendations.
 */
router.get('/search', (req, res) => {
    const query = req.query.q;

    // Find recommended gigs
    const recommendations = recommendGigs(query, gigs);

    if (recommendations.length > 0) {
        res.json({ success: true, gigs: recommendations });
    } else {
        res.json({ success: true, message: 'No exact matches found. Here are some similar gigs.', gigs: gigs });
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

module.exports = router;
