const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { sendEmail } = require('../services/emailService');
const { sendPushNotification } = require('./notifications');

// Create a new project
router.post('/', async (req, res) => {
  try {
    const {
      businessId,
      title,
      description,
      category,
      skills,
      budgetMin,
      budgetMax,
      deadline,
      attachmentUrl
    } = req.body;
    
    // Validate the request
    if (!businessId || !title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Required fields missing'
      });
    }
    
    // Verify this is a business account
    const userCheck = await query(
      'SELECT user_type FROM users WHERE id = $1',
      [businessId]
    );
    
    if (userCheck.rows.length === 0 || userCheck.rows[0].user_type !== 'business') {
      return res.status(403).json({
        success: false,
        message: 'Only business accounts can post projects'
      });
    }
    
    // Insert the project
    const result = await query(
      `INSERT INTO projects (
        business_id, title, description, category, 
        skills, budget_min, budget_max, deadline, attachment_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        businessId,
        title,
        description,
        category,
        skills || [],
        budgetMin,
        budgetMax,
        deadline,
        attachmentUrl
      ]
    );
    
    // Get business name for the response
    const businessData = await query(
      `SELECT bp.company_name
       FROM business_profiles bp
       WHERE bp.user_id = $1`,
      [businessId]
    );
    
    const project = {
      ...result.rows[0],
      company_name: businessData.rows[0]?.company_name || 'Unnamed Business'
    };
    
    res.status(201).json({
      success: true,
      project
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating project',
      error: error.message
    });
  }
});

// Get all projects
router.get('/', async (req, res) => {
  try {
    const {
      limit = 20,
      offset = 0,
      status = 'open',
      category = '',
      minBudget = 0,
      maxBudget = 999999,
      searchTerm = '',
      sortBy = 'newest'
    } = req.query;
    
    let orderClause = 'p.created_at DESC'; // Default sorting by newest
    
    if (sortBy === 'budget_high') {
      orderClause = 'p.budget_max DESC';
    } else if (sortBy === 'budget_low') {
      orderClause = 'p.budget_min ASC';
    } else if (sortBy === 'deadline') {
      orderClause = 'p.deadline ASC';
    } else if (sortBy === 'bid_count') {
      orderClause = 'p.bid_count DESC';
    }
    
    // Build the WHERE clause
    let whereClause = `p.status = $1`;
    let queryParams = [status];
    let paramCount = 1;
    
    if (category) {
      paramCount++;
      whereClause += ` AND p.category = $${paramCount}`;
      queryParams.push(category);
    }
    
    if (searchTerm) {
      paramCount++;
      whereClause += ` AND (p.title ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`;
      queryParams.push(`%${searchTerm}%`);
    }
    
    paramCount++;
    whereClause += ` AND (p.budget_max >= $${paramCount} OR p.budget_max IS NULL)`;
    queryParams.push(minBudget);
    
    paramCount++;
    whereClause += ` AND (p.budget_min <= $${paramCount} OR p.budget_min IS NULL)`;
    queryParams.push(maxBudget);
    
    // Add pagination parameters
    paramCount++;
    queryParams.push(limit);
    paramCount++;
    queryParams.push(offset);
    
    const result = await query(
      `SELECT 
        p.*,
        bp.company_name,
        bp.logo_url as company_logo,
        bp.verified as company_verified,
        u.display_name as business_name
      FROM projects p
      JOIN users u ON p.business_id = u.id
      JOIN business_profiles bp ON u.id = bp.user_id
      WHERE ${whereClause}
      ORDER BY ${orderClause}
      LIMIT $${paramCount-1} OFFSET $${paramCount}`,
      queryParams
    );
    
    // Count total projects matching criteria (for pagination)
    const countResult = await query(
      `SELECT COUNT(*) 
       FROM projects p
       WHERE ${whereClause}`,
      queryParams.slice(0, queryParams.length - 2) // Remove limit and offset params
    );
    
    const total = parseInt(countResult.rows[0].count);
    
    res.json({
      success: true,
      projects: result.rows,
      pagination: {
        total,
        page: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ success: false, message: 'Server error fetching projects' });
  }
});

// Get a single project
router.get('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const result = await query(
      `SELECT 
        p.*,
        bp.company_name,
        bp.logo_url as company_logo,
        bp.verified as company_verified,
        bp.industry as company_industry,
        u.display_name as business_name
      FROM projects p
      JOIN users u ON p.business_id = u.id
      JOIN business_profiles bp ON u.id = bp.user_id
      WHERE p.id = $1`,
      [projectId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    // Get all bids count for this project
    const bidCount = await query(
      'SELECT COUNT(*) FROM bids WHERE project_id = $1',
      [projectId]
    );
    
    // Attach bid count to the project
    const project = {
      ...result.rows[0],
      bid_count: parseInt(bidCount.rows[0].count)
    };
    
    res.json({
      success: true,
      project
    });
  } catch (error) {
    console.error('Error fetching project details:', error);
    res.status(500).json({ success: false, message: 'Server error fetching project' });
  }
});

// Get a business's projects
router.get('/business/:businessId', async (req, res) => {
  try {
    const { businessId } = req.params;
    const { status } = req.query;
    
    // Add status filter if provided
    const statusFilter = status ? 'AND p.status = $2' : '';
    const params = status ? [businessId, status] : [businessId];
    
    const result = await query(
      `SELECT 
        p.*,
        (SELECT COUNT(*) FROM bids WHERE project_id = p.id) as bid_count
      FROM projects p
      WHERE p.business_id = $1 ${statusFilter}
      ORDER BY p.created_at DESC`,
      params
    );
    
    res.json({
      success: true,
      projects: result.rows
    });
  } catch (error) {
    console.error('Error fetching business projects:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update a project
router.put('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { 
      title, 
      description, 
      category,
      skills,
      budgetMin,
      budgetMax,
      deadline,
      status,
      businessId // For authorization
    } = req.body;
    
    // Verify the project belongs to this business
    const projectCheck = await query(
      'SELECT business_id FROM projects WHERE id = $1',
      [projectId]
    );
    
    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    if (projectCheck.rows[0].business_id !== businessId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    // Perform update
    const result = await query(
      `UPDATE projects
       SET 
        title = $1,
        description = $2,
        category = $3,
        skills = $4,
        budget_min = $5,
        budget_max = $6,
        deadline = $7,
        status = $8,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [
        title,
        description,
        category,
        skills,
        budgetMin,
        budgetMax,
        deadline,
        status,
        projectId
      ]
    );
    
    res.json({
      success: true,
      project: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ success: false, message: 'Server error updating project' });
  }
});

// Award project to a bidder
router.post('/:projectId/award', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { bidId, businessId } = req.body;
    
    // Verify project ownership
    const projectCheck = await query(
      'SELECT business_id, title FROM projects WHERE id = $1',
      [projectId]
    );
    
    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    if (projectCheck.rows[0].business_id !== businessId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    // Get bid details
    const bidDetails = await query(
      `SELECT b.*, u.email, u.display_name 
       FROM bids b
       JOIN users u ON b.freelancer_id = u.id
       WHERE b.id = $1 AND b.project_id = $2`,
      [bidId, projectId]
    );
    
    if (bidDetails.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Bid not found' });
    }
    
    const bid = bidDetails.rows[0];
    
    // Start transaction
    await query('BEGIN');
    
    try {
      // Update project status
      await query(
        'UPDATE projects SET status = $1 WHERE id = $2',
        ['awarded', projectId]
      );
      
      // Update bid status
      await query(
        'UPDATE bids SET status = $1 WHERE id = $2',
        ['accepted', bidId]
      );
      
      // Reject other bids
      await query(
        'UPDATE bids SET status = $1 WHERE project_id = $2 AND id != $3',
        ['rejected', projectId, bidId]
      );
      
      // Create project award entry
      const awardResult = await query(
        `INSERT INTO project_awards (
          project_id, freelancer_id, bid_id, amount, deadline
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING id`,
        [
          projectId, 
          bid.freelancer_id, 
          bidId, 
          bid.amount, 
          new Date(Date.now() + bid.delivery_time * 24 * 60 * 60 * 1000)
        ]
      );
      
      await query('COMMIT');
      
      // Send notification to freelancer
      sendPushNotification(
        bid.freelancer_id,
        'Congratulations! Your bid was accepted',
        `Your proposal for "${projectCheck.rows[0].title}" has been accepted`,
        `/projects/${projectId}`,
        `bid-accepted-${bidId}`
      ).catch(err => console.error('Error sending push notification:', err));
      
      // Send email notification
      sendEmail({
        to: bid.email,
        subject: `Your proposal for "${projectCheck.rows[0].title}" has been accepted`,
        html: `<p>Hello ${bid.display_name},</p>
              <p>Congratulations! Your bid on the project "${projectCheck.rows[0].title}" has been accepted.</p>
              <p>Please log in to your account to view the details and start working on the project.</p>
              <p><a href="${process.env.FRONTEND_URL}/projects/${projectId}">View Project</a></p>`
      }).catch(err => console.error('Error sending email:', err));
      
      res.json({
        success: true,
        message: 'Project awarded successfully',
        awardId: awardResult.rows[0].id
      });
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error awarding project:', error);
    res.status(500).json({ success: false, message: 'Server error awarding project' });
  }
});

module.exports = router;
