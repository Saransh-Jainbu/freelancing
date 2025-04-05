const jwt = require('jsonwebtoken');
const { query } = require('../db');

/**
 * Authentication middleware to protect routes
 * Verifies the JWT token and attaches the user to the request
 */
const authenticate = async (req, res, next) => {
  try {
    // Check for token in cookies
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.'
      });
    }
    
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const result = await query(
      'SELECT id, email, display_name, user_type FROM users WHERE id = $1',
      [decoded.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Attach the user to the request
    req.user = result.rows[0];
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please log in again.'
      });
    }
    
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

/**
 * Check if user has required role/type
 * @param {Array} allowedTypes - Array of allowed user types
 */
const authorize = (allowedTypes) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    if (!allowedTypes.includes(req.user.user_type)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    
    next();
  };
};

// Middleware to check if user is a freelancer
const requireFreelancer = (req, res, next) => {
  if (req.user?.user_type !== 'freelancer') {
    return res.status(403).json({
      success: false,
      message: 'Only freelancers can access this resource'
    });
  }
  next();
};

// Middleware to check if user is a business
const requireBusiness = (req, res, next) => {
  if (req.user?.user_type !== 'business') {
    return res.status(403).json({
      success: false,
      message: 'Only businesses can access this resource'
    });
  }
  next();
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user?.user_type !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

module.exports = {
  authenticate,
  authorize,
  requireFreelancer,
  requireBusiness,
  requireAdmin
};
