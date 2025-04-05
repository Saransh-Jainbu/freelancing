const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../db');
const { authenticate } = require('../middleware/auth');

// User login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if user exists
    const result = await query(
      'SELECT id, email, password_hash, display_name, user_type FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    const user = result.rows[0];
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Create JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    // Update last login time
    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );
    
    // Return user info (without password)
    const { password_hash, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      message: 'Login successful',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// User registration
router.post('/register', async (req, res) => {
  try {
    const { email, password, displayName, userType } = req.body;
    
    // Check if email already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use'
      });
    }
    
    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Begin transaction
    await query('BEGIN');
    
    // Create user
    const userResult = await query(
      `INSERT INTO users (email, password_hash, display_name, user_type) 
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [email.toLowerCase(), passwordHash, displayName, userType]
    );
    
    const userId = userResult.rows[0].id;
    
    // Create profile
    await query(
      `INSERT INTO profiles (user_id) VALUES ($1)`,
      [userId]
    );
    
    // If user is business type, create business profile
    if (userType === 'business' && req.body.businessProfile) {
      const { 
        companyName, 
        industry, 
        companySize, 
        websiteUrl, 
        companyDescription 
      } = req.body.businessProfile;
      
      await query(
        `INSERT INTO business_profiles 
         (user_id, company_name, industry, company_size, website_url, company_description) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, companyName, industry, companySize, websiteUrl, companyDescription]
      );
    }
    
    // Commit transaction
    await query('COMMIT');
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully'
    });
  } catch (error) {
    // Rollback transaction on error
    await query('ROLLBACK');
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
});

// Token verification (checks if user is logged in)
router.get('/verify', authenticate, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// User logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  });
  
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;
