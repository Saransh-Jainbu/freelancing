const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { sendPushNotification } = require('./notifications');
const { sendEmail } = require('../services/emailService');

// Submit a bid on a project
router.post('/', async (req, res) => {
  try {
    const {
      projectId,
      freelancerId,
      amount,
      deliveryTime,
      proposal
    } = req.body;
    
    // Verify this is a freelancer account
    const userCheck = await query(
      'SELECT user_type FROM users WHERE id = $1',
      [freelancerId]
    );
    
    if (userCheck.rows.length === 0 || userCheck.rows[0].user_type !== 'freelancer') {
      return res.status(403).json({
        success: false,
        message: 'Only freelancer accounts can submit bids'
      });
    }
    
    // Check if the project exists and is open
    const projectCheck = await query(
      'SELECT id, business_id, title, status FROM projects WHERE id = $1',
      [projectId]
    );
    
    if (projectCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    if (projectCheck.rows[0].status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'Project is not open for bidding'
      });
    }
    
    // Check if freelancer has already bid on this project
    const existingBid = await query(
      'SELECT id FROM bids WHERE project_id = $1 AND freelancer_id = $2',
      [projectId, freelancerId]
    );
    
    if (existingBid.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'You have already submitted a bid for this project',
        bidId: existingBid.rows[0].id
      });
    }
    
    // Start transaction
    await query('BEGIN');
    
    try {
      // Submit bid
      const result = await query(
        `INSERT INTO bids (
          project_id, freelancer_id, amount, delivery_time, proposal
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *`,
        [projectId, freelancerId, amount, deliveryTime, proposal]
      );
      
      // Update bid count on project
      await query(
        'UPDATE projects SET bid_count = bid_count + 1 WHERE id = $1',
        [projectId]
      );
      
      await query('COMMIT');
      
      // Get freelancer details for the notification
      const freelancerData = await query(
        'SELECT display_name FROM users WHERE id = $1',
        [freelancerId]
      );
      
      // Notify business about the new bid
      const businessId = projectCheck.rows[0].business_id;
      
      // Get business email for notification
      const businessData = await query(
        'SELECT u.email, u.display_name FROM users u WHERE u.id = $1',
        [businessId]
      );
      
      // Send push notification
      await sendPushNotification(
        businessId,
        'New Bid Received',
        `${freelancerData.rows[0]?.display_name} placed a bid on your project "${projectCheck.rows[0].title}"`,
        `${process.env.FRONTEND_URL}/business/projects/${projectId}`,
        `new-bid-${result.rows[0].id}`
      );
      
      // Send email notification
      if (businessData.rows.length > 0) {
        sendEmail({
          to: businessData.rows[0].email,
          subject: `New Bid on Your Project: ${projectCheck.rows[0].title}`,
          html: `<p>Hello ${businessData.rows[0].display_name},</p>
                <p>${freelancerData.rows[0]?.display_name} has submitted a bid on your project "${projectCheck.rows[0].title}".</p>
                <p><strong>Bid Amount:</strong> $${amount}</p>
                <p><strong>Delivery Time:</strong> ${deliveryTime} days</p>
                <p><a href="${process.env.FRONTEND_URL}/business/projects/${projectId}">View Project Details</a></p>`
        }).catch(err => console.error('Error sending bid notification email:', err));
      }
      
      res.status(201).json({
        success: true,
        bid: result.rows[0]
      });
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error submitting bid:', error);
    res.status(500).json({
      success: false,
      message: 'Server error submitting bid',
      error: error.message
    });
  }
});

// Get all bids for a project
router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { businessId } = req.query; // For authorization
    
    // Verify the project belongs to this business if businessId is provided
    if (businessId) {
      const projectCheck = await query(
        'SELECT business_id FROM projects WHERE id = $1',
        [projectId]
      );
      
      if (projectCheck.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }
      
      if (projectCheck.rows[0].business_id !== parseInt(businessId)) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
    }
    
    // Get bids with freelancer info
    const result = await query(
      `SELECT b.*,
        u.display_name as freelancer_name,
        p.avatar_url as freelancer_avatar,
        p.rating as freelancer_rating,
        p.reviews as freelancer_reviews
      FROM bids b
      JOIN users u ON b.freelancer_id = u.id
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE b.project_id = $1
      ORDER BY b.created_at DESC`,
      [projectId]
    );
    
    res.json({
      success: true,
      bids: result.rows
    });
  } catch (error) {
    console.error('Error fetching project bids:', error);
    res.status(500).json({ success: false, message: 'Server error fetching bids' });
  }
});

// Get a freelancer's bids
router.get('/freelancer/:freelancerId', async (req, res) => {
  try {
    const { freelancerId } = req.params;
    const { status } = req.query;
    
    // Add status filter if provided
    const statusFilter = status ? 'AND b.status = $2' : '';
    const params = status ? [freelancerId, status] : [freelancerId];
    
    const result = await query(
      `SELECT b.*,
        p.title as project_title,
        p.status as project_status,
        bp.company_name,
        bp.logo_url as company_logo
      FROM bids b
      JOIN projects p ON b.project_id = p.id
      JOIN users u ON p.business_id = u.id
      JOIN business_profiles bp ON u.id = bp.user_id
      WHERE b.freelancer_id = $1 ${statusFilter}
      ORDER BY b.created_at DESC`,
      params
    );
    
    res.json({
      success: true,
      bids: result.rows
    });
  } catch (error) {
    console.error('Error fetching freelancer bids:', error);
    res.status(500).json({ success: false, message: 'Server error fetching bids' });
  }
});

// Update a bid
router.put('/:bidId', async (req, res) => {
  try {
    const { bidId } = req.params;
    const {
      freelancerId,
      amount,
      deliveryTime,
      proposal
    } = req.body;
    
    // Verify bid ownership
    const bidCheck = await query(
      `SELECT b.*, p.status as project_status
       FROM bids b
       JOIN projects p ON b.project_id = p.id
       WHERE b.id = $1`,
      [bidId]
    );
    
    if (bidCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Bid not found' });
    }
    
    if (bidCheck.rows[0].freelancer_id !== freelancerId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    if (bidCheck.rows[0].project_status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update bid as project is not open'
      });
    }
    
    // Update bid
    const result = await query(
      `UPDATE bids
       SET amount = $1, delivery_time = $2, proposal = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND freelancer_id = $5
       RETURNING *`,
      [amount, deliveryTime, proposal, bidId, freelancerId]
    );
    
    res.json({
      success: true,
      bid: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating bid:', error);
    res.status(500).json({ success: false, message: 'Server error updating bid' });
  }
});

// Withdraw a bid
router.delete('/:bidId', async (req, res) => {
  try {
    const { bidId } = req.params;
    const { freelancerId } = req.body;
    
    // Verify bid ownership
    const bidCheck = await query(
      `SELECT b.*, p.id as project_id, p.status as project_status
       FROM bids b
       JOIN projects p ON b.project_id = p.id
       WHERE b.id = $1`,
      [bidId]
    );
    
    if (bidCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Bid not found' });
    }
    
    if (bidCheck.rows[0].freelancer_id !== freelancerId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    if (bidCheck.rows[0].project_status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'Cannot withdraw bid as project is not open'
      });
    }
    
    // Start transaction
    await query('BEGIN');
    
    try {
      // Delete the bid
      await query(
        'DELETE FROM bids WHERE id = $1',
        [bidId]
      );
      
      // Decrement bid count on project
      await query(
        'UPDATE projects SET bid_count = bid_count - 1 WHERE id = $1',
        [bidCheck.rows[0].project_id]
      );
      
      await query('COMMIT');
      
      res.json({
        success: true,
        message: 'Bid withdrawn successfully'
      });
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error withdrawing bid:', error);
    res.status(500).json({ success: false, message: 'Server error withdrawing bid' });
  }
});

module.exports = router;
