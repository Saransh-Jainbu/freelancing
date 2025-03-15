const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Middleware
app.use(express.json());
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));

// Initialize passport
app.use(passport.initialize());

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Helper function to execute queries
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Error executing query', { text, error });
    throw error;
  }
};

// Initialize database tables
const initDb = async () => {
  try {
    // Users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        display_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Profiles table
    await query(`
      CREATE TABLE IF NOT EXISTS profiles (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255),
        location VARCHAR(255),
        bio TEXT,
        hourly_rate INTEGER,
        avatar_url VARCHAR(255),
        member_since TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        completion_rate INTEGER DEFAULT 0,
        response_time VARCHAR(100),
        total_earnings DECIMAL(10,2) DEFAULT 0,
        total_projects INTEGER DEFAULT 0,
        rating DECIMAL(3,2) DEFAULT 0,
        reviews INTEGER DEFAULT 0,
        is_verified BOOLEAN DEFAULT FALSE,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Skills table
    await query(`
      CREATE TABLE IF NOT EXISTS skills (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        skill_name VARCHAR(100) NOT NULL,
        UNIQUE(user_id, skill_name)
      )
    `);
    
    // Languages table
    await query(`
      CREATE TABLE IF NOT EXISTS languages (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        language_name VARCHAR(100) NOT NULL,
        proficiency VARCHAR(50),
        UNIQUE(user_id, language_name)
      )
    `);
    
    // Gigs table
    await query(`
      CREATE TABLE IF NOT EXISTS gigs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        price VARCHAR(50),
        status VARCHAR(50) DEFAULT 'active',
        orders INTEGER DEFAULT 0,
        rating DECIMAL(3,2) DEFAULT 0,
        earnings DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database', error);
    throw error;
  }
};

// Initialize database on server start
initDb();

// Configure Passport strategies
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback',
    proxy: true
  },
  async function(accessToken, refreshToken, profile, done) {
    try {
      // Check if user exists in database
      const userResult = await query(
        'SELECT id, email, display_name FROM users WHERE email = $1',
        [profile.emails[0].value]
      );
      
      if (userResult.rows.length > 0) {
        // User exists, return user
        return done(null, userResult.rows[0]);
      }
      
      // User doesn't exist, create new user
      // Start a transaction
      await query('BEGIN');
      
      // Create user
      const newUserResult = await query(
        'INSERT INTO users (email, password_hash, display_name) VALUES ($1, $2, $3) RETURNING id',
        [profile.emails[0].value, 'oauth_login', profile.displayName]
      );
      
      const userId = newUserResult.rows[0].id;
      
      // Create profile
      await query(
        'INSERT INTO profiles (user_id) VALUES ($1)',
        [userId]
      );
      
      await query('COMMIT');
      
      // Return new user
      return done(null, {
        id: userId,
        email: profile.emails[0].value,
        display_name: profile.displayName
      });
    } catch (error) {
      await query('ROLLBACK');
      return done(error, false);
    }
  }
));

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: `${process.env.SERVER_URL || 'http://localhost:5000'}/api/auth/github/callback`,
    scope: ['user:email']
  },
  async function(accessToken, refreshToken, profile, done) {
    try {
      console.log('GitHub profile:', profile);
      
      // Get primary email from GitHub profile
      let email = '';
      if (profile.emails && profile.emails.length > 0) {
        email = profile.emails[0].value;
      } else {
        // If no email is provided by GitHub, return error
        return done(new Error('Email not available from GitHub profile'), false);
      }
      
      // Check if user exists in database
      const userResult = await query(
        'SELECT id, email, display_name FROM users WHERE email = $1',
        [email]
      );
      
      if (userResult.rows.length > 0) {
        // User exists, return user
        return done(null, userResult.rows[0]);
      }
      
      // User doesn't exist, create new user
      // Start a transaction
      await query('BEGIN');
      
      // Create user
      const newUserResult = await query(
        'INSERT INTO users (email, password_hash, display_name) VALUES ($1, $2, $3) RETURNING id',
        [email, 'oauth_login', profile.displayName || profile.username]
      );
      
      const userId = newUserResult.rows[0].id;
      
      // Create profile
      await query(
        'INSERT INTO profiles (user_id) VALUES ($1)',
        [userId]
      );
      
      await query('COMMIT');
      
      // Return new user
      return done(null, {
        id: userId,
        email: email,
        display_name: profile.displayName || profile.username
      });
    } catch (error) {
      console.error('GitHub auth error:', error);
      await query('ROLLBACK');
      return done(error, false);
    }
  }
));

// OAuth Routes
app.get('/api/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/api/auth/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${FRONTEND_URL}/login?error=google_auth_failed` }),
  (req, res) => {
    // Successful authentication, redirect to frontend with user data
    const userData = JSON.stringify({
      id: req.user.id,
      email: req.user.email,
      display_name: req.user.display_name
    });
    
    // Redirect to frontend with user data in URL parameter
    res.redirect(`${FRONTEND_URL}/oauth-callback?user=${encodeURIComponent(userData)}`);
  }
);

app.get('/api/auth/github',
  passport.authenticate('github', { scope: ['user:email'] })
);

app.get('/api/auth/github/callback',
  function(req, res, next) {
    passport.authenticate('github', { session: false }, function(err, user, info) {
      if (err) {
        console.error('GitHub auth callback error:', err);
        return res.redirect(`${FRONTEND_URL}/login?error=github_auth_failed&message=${encodeURIComponent(err.message)}`);
      }
      
      if (!user) {
        return res.redirect(`${FRONTEND_URL}/login?error=github_auth_failed`);
      }
      
      // Successful authentication, redirect to frontend with user data
      const userData = JSON.stringify({
        id: user.id,
        email: user.email,
        display_name: user.display_name
      });
      
      // Redirect to frontend with user data in URL parameter
      res.redirect(`${FRONTEND_URL}/oauth-callback?user=${encodeURIComponent(userData)}`);
    })(req, res, next);
  }
);

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, displayName, university, location, dateOfBirth, contactNumber } = req.body;
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    // Start a transaction
    await query('BEGIN');
    
    // Insert user
    const userResult = await query(
      'INSERT INTO users (email, password_hash, display_name) VALUES ($1, $2, $3) RETURNING id',
      [email, passwordHash, displayName]
    );
    
    const userId = userResult.rows[0].id;
    
    // Create empty profile
    await query(
      'INSERT INTO profiles (user_id, location) VALUES ($1, $2)',
      [userId, location]
    );
    
    await query('COMMIT');
    
    res.status(201).json({ success: true, userId });
  } catch (error) {
    await query('ROLLBACK');
    
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }
    
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const userResult = await query(
      'SELECT id, email, password_hash, display_name FROM users WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    // Don't return password hash to client
    const { password_hash, ...userData } = user;
    res.json({ success: true, user: userData });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// Profile Routes
app.get('/api/profile/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Get profile data
    const profileResult = await query(
      `SELECT 
        u.display_name, 
        p.title, 
        p.location, 
        p.bio,
        p.hourly_rate,
        p.avatar_url,
        TO_CHAR(p.member_since, 'Month YYYY') as member_since,
        p.completion_rate,
        p.response_time,
        p.total_earnings,
        p.total_projects,
        p.rating,
        p.reviews,
        p.is_verified
      FROM profiles p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = $1`,
      [userId]
    );
    
    if (profileResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }
    
    const profile = profileResult.rows[0];
    
    // Get skills
    const skillsResult = await query(
      'SELECT skill_name FROM skills WHERE user_id = $1',
      [userId]
    );
    
    // Get languages
    const languagesResult = await query(
      'SELECT language_name, proficiency FROM languages WHERE user_id = $1',
      [userId]
    );
    
    // Format languages for frontend
    const languages = languagesResult.rows.map(row => 
      `${row.language_name} (${row.proficiency})`
    );
    
    const profileData = {
      ...profile,
      skills: skillsResult.rows.map(row => row.skill_name),
      languages
    };
    
    res.json({ success: true, profile: profileData });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching profile' });
  }
});

app.put('/api/profile/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { displayName, title, location, bio, hourlyRate, skills, languages } = req.body;
    
    // Start a transaction
    await query('BEGIN');
    
    // Update user's display name
    await query(
      'UPDATE users SET display_name = $1 WHERE id = $2',
      [displayName, userId]
    );
    
    // Update profile
    await query(
      `UPDATE profiles 
       SET title = $1, location = $2, bio = $3, hourly_rate = $4, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $5`,
      [title, location, bio, hourlyRate, userId]
    );
    
    // Delete existing skills and add new ones
    await query('DELETE FROM skills WHERE user_id = $1', [userId]);
    
    for (const skill of skills) {
      if (skill.trim()) {
        await query(
          'INSERT INTO skills (user_id, skill_name) VALUES ($1, $2)',
          [userId, skill.trim()]
        );
      }
    }
    
    // Handle languages
    if (languages && languages.length > 0) {
      await query('DELETE FROM languages WHERE user_id = $1', [userId]);
      
      for (const language of languages) {
        const parts = language.split('(');
        const languageName = parts[0].trim();
        const proficiency = parts.length > 1 ? 
          parts[1].replace(')', '').trim() : 'Fluent';
        
        await query(
          'INSERT INTO languages (user_id, language_name, proficiency) VALUES ($1, $2, $3)',
          [userId, languageName, proficiency]
        );
      }
    }
    
    await query('COMMIT');
    
    // Fetch and return the updated profile
    const profileResult = await query(
      `SELECT 
        u.display_name, 
        p.title, 
        p.location, 
        p.bio,
        p.hourly_rate,
        p.avatar_url,
        TO_CHAR(p.member_since, 'Month YYYY') as member_since,
        p.completion_rate,
        p.response_time,
        p.total_earnings,
        p.total_projects,
        p.rating,
        p.reviews,
        p.is_verified
      FROM profiles p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = $1`,
      [userId]
    );
    
    const profile = profileResult.rows[0];
    
    // Get skills
    const skillsResult = await query(
      'SELECT skill_name FROM skills WHERE user_id = $1',
      [userId]
    );
    
    // Get languages
    const languagesResult = await query(
      'SELECT language_name, proficiency FROM languages WHERE user_id = $1',
      [userId]
    );
    
    // Format languages for frontend
    const updatedLanguages = languagesResult.rows.map(row => 
      `${row.language_name} (${row.proficiency})`
    );
    
    const profileData = {
      ...profile,
      skills: skillsResult.rows.map(row => row.skill_name),
      languages: updatedLanguages
    };
    
    res.json({ success: true, profile: profileData });
  } catch (error) {
    await query('ROLLBACK');
    console.error('Profile update error:', error);
    res.status(500).json({ success: false, message: 'Server error updating profile' });
  }
});

// Gigs Routes
app.get('/api/gigs/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const result = await query(
      `SELECT 
        id, 
        title, 
        description, 
        category,
        price,
        status,
        orders,
        rating,
        TO_CHAR(earnings, 'FM$999,999,999.00') as earnings,
        TO_CHAR(created_at, 'YYYY-MM-DD') as created
      FROM gigs 
      WHERE user_id = $1
      ORDER BY created_at DESC`,
      [userId]
    );
    
    res.json({ success: true, gigs: result.rows });
  } catch (error) {
    console.error('Gigs fetch error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching gigs' });
  }
});

app.post('/api/gigs', async (req, res) => {
  try {
    const { userId, title, category, price, description } = req.body;
    
    const result = await query(
      `INSERT INTO gigs (user_id, title, category, price, description)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title, description, category, price, status, orders, rating, 
       TO_CHAR(earnings, 'FM$999,999,999.00') as earnings,
       TO_CHAR(created_at, 'YYYY-MM-DD') as created`,
      [userId, title, category, price, description]
    );
    
    res.status(201).json({ success: true, gig: result.rows[0] });
  } catch (error) {
    console.error('Gig creation error:', error);
    res.status(500).json({ success: false, message: 'Server error creating gig' });
  }
});

app.put('/api/gigs/:gigId', async (req, res) => {
  try {
    const gigId = req.params.gigId;
    const { userId, title, category, price, description, status } = req.body;
    
    const result = await query(
      `UPDATE gigs
       SET title = $1, category = $2, price = $3, description = $4, status = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 AND user_id = $7
       RETURNING id, title, description, category, price, status, orders, rating,
       TO_CHAR(earnings, 'FM$999,999,999.00') as earnings,
       TO_CHAR(created_at, 'YYYY-MM-DD') as created`,
      [title, category, price, description, status, gigId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Gig not found or not authorized' });
    }
    
    res.json({ success: true, gig: result.rows[0] });
  } catch (error) {
    console.error('Gig update error:', error);
    res.status(500).json({ success: false, message: 'Server error updating gig' });
  }
});

app.put('/api/gigs/:gigId/toggle-status', async (req, res) => {
  try {
    const gigId = req.params.gigId;
    const { userId } = req.body;
    
    const result = await query(
      `UPDATE gigs
       SET status = CASE WHEN status = 'active' THEN 'paused' ELSE 'active' END, 
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING id, status`,
      [gigId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Gig not found or not authorized' });
    }
    
    res.json({ success: true, gig: result.rows[0] });
  } catch (error) {
    console.error('Gig status toggle error:', error);
    res.status(500).json({ success: false, message: 'Server error toggling gig status' });
  }
});

app.delete('/api/gigs/:gigId', async (req, res) => {
  try {
    const gigId = req.params.gigId;
    const { userId } = req.body;
    
    const result = await query(
      'DELETE FROM gigs WHERE id = $1 AND user_id = $2 RETURNING id',
      [gigId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Gig not found or not authorized' });
    }
    
    res.json({ success: true, deleted: result.rows[0].id });
  } catch (error) {
    console.error('Gig deletion error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting gig' });
  }
});

// Server Start
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
