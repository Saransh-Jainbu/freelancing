const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Load environment variables before importing services
dotenv.config();

// Import services
const storageService = require('./services/azureStorage');

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10); // Convert PORT to integer
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Create HTTP server and Socket.io instance
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(express.json());
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Initialize passport
app.use(passport.initialize());

// Serve static files from uploads directory when using local storage
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check route (add near the top with other routes)
const healthRoutes = require('./routes/health');
app.use('/api/health', healthRoutes);

// Push notification routes
try {
  const pushNotificationRoutes = require('./routes/pushNotifications');
  app.use('/api/notifications', pushNotificationRoutes);
} catch (error) {
  console.warn('Push notification routes not loaded:', error.message);
}

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

    // Conversations table
    await query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        gig_id INTEGER,
        gig_title VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Conversation participants
    await query(`
      CREATE TABLE IF NOT EXISTS conversation_participants (
        conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        PRIMARY KEY (conversation_id, user_id)
      )
    `);
    
    // Messages table
    await query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
        sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        content TEXT NOT NULL,
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add new columns to conversations table
    await query(`
      ALTER TABLE conversations 
      ADD COLUMN IF NOT EXISTS gig_id INTEGER,
      ADD COLUMN IF NOT EXISTS gig_title VARCHAR(255)
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database', error);
    throw error;
  }
};

// Initialize database on server start
initDb();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Join conversation room
  socket.on('join-conversation', (conversationId) => {
    socket.join(`conversation-${conversationId}`);
    console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
  });
  
  // Handle new message
  socket.on('send-message', async (messageData) => {
    try {
      const { conversationId, senderId, content } = messageData;
      
      // Insert message to database
      const result = await query(
        `INSERT INTO messages (conversation_id, sender_id, content)
         VALUES ($1, $2, $3)
         RETURNING id, conversation_id, sender_id, content, read, created_at`,
        [conversationId, senderId, content]
      );
      
      // Update conversation's updated_at
      await query(
        `UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [conversationId]
      );
      
      const newMessage = result.rows[0];
      
      // Emit to all users in the conversation
      io.to(`conversation-${conversationId}`).emit('new-message', newMessage);
      
      // If the receiver is not in the conversation, send a push notification
      // You can implement this later using the pushService
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('message-error', { error: 'Failed to send message' });
    }
  });

  // Handle typing indicator
  socket.on('typing', ({ conversationId, userId, isTyping }) => {
    socket.to(`conversation-${conversationId}`).emit('user-typing', { userId, isTyping });
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

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

// Chat endpoints
app.get('/api/conversations/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const result = await query(
      `SELECT c.id, c.created_at, c.updated_at,
       (
         SELECT json_agg(json_build_object(
           'id', u.id,
           'display_name', u.display_name,
           'avatar_url', p.avatar_url
         ))
         FROM conversation_participants cp
         JOIN users u ON cp.user_id = u.id
         LEFT JOIN profiles p ON u.id = p.user_id
         WHERE cp.conversation_id = c.id AND cp.user_id != $1
       ) as participants,
       (
         SELECT m.content
         FROM messages m
         WHERE m.conversation_id = c.id
         ORDER BY m.created_at DESC
         LIMIT 1
       ) as last_message,
       (
         SELECT COUNT(*)
         FROM messages m
         WHERE m.conversation_id = c.id AND m.read = false AND m.sender_id != $1
       ) as unread_count
       FROM conversations c
       JOIN conversation_participants cp ON c.id = cp.conversation_id
       WHERE cp.user_id = $1
       ORDER BY c.updated_at DESC`,
      [userId]
    );
    
    res.json({ success: true, conversations: result.rows });
  } catch (error) {
    console.error('Conversations fetch error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching conversations' });
  }
});

app.post('/api/conversations', async (req, res) => {
  try {
    const { participantIds, gigInfo } = req.body;
    
    if (!participantIds || participantIds.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least two participants are required'
      });
    }

    // Check if conversation already exists between these users
    const existingConversation = await query(
      `SELECT c.id FROM conversations c
       JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
       JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
       WHERE cp1.user_id = $1 AND cp2.user_id = $2
       LIMIT 1`,
      [participantIds[0], participantIds[1]]
    );

    if (existingConversation.rows.length > 0) {
      // Return existing conversation
      const conversation = await query(
        `SELECT c.*, array_agg(json_build_object(
          'id', u.id,
          'display_name', u.display_name,
          'avatar_url', p.avatar_url
        )) as participants
        FROM conversations c
        JOIN conversation_participants cp ON c.id = cp.conversation_id
        JOIN users u ON cp.user_id = u.id
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE c.id = $1
        GROUP BY c.id`,
        [existingConversation.rows[0].id]
      );

      return res.json({ success: true, conversation: conversation.rows[0] });
    }

    // If no existing conversation, create new one

    // Start transaction
    await query('BEGIN');

    // Create new conversation with gig info
    const conversationResult = await query(
      'INSERT INTO conversations (gig_id, gig_title) VALUES ($1, $2) RETURNING id',
      [gigInfo?.gig_id || null, gigInfo?.title || null]
    );
    
    const conversationId = conversationResult.rows[0].id;
    
    // Add participants
    for (const participantId of participantIds) {
      await query(
        'INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2)',
        [conversationId, participantId]
      );
    }
    
    await query('COMMIT');
    
    // Fetch the complete conversation data
    const fullConversation = await query(
      `SELECT c.*, array_agg(json_build_object(
        'id', u.id,
        'display_name', u.display_name,
        'avatar_url', p.avatar_url
      )) as participants
      FROM conversations c
      JOIN conversation_participants cp ON c.id = cp.conversation_id
      JOIN users u ON cp.user_id = u.id
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE c.id = $1
      GROUP BY c.id`,
      [conversationId]
    );
    
    res.status(201).json({ 
      success: true, 
      conversation: fullConversation.rows[0] 
    });
  } catch (error) {
    await query('ROLLBACK');
    console.error('Create conversation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error creating conversation',
      error: error.message 
    });
  }
});

app.get('/api/conversations/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.query;
    
    // Check if user is participant
    const participantCheck = await query(
      'SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
      [conversationId, userId]
    );
    
    if (participantCheck.rows.length === 0) {
      return res.status(403).json({ 
        success: false, 
        message: 'User is not a participant in this conversation' 
      });
    }
    
    // Get messages
    const messagesResult = await query(
      `SELECT m.id, m.content, m.read, m.created_at, m.sender_id,
       json_build_object(
         'id', u.id,
         'display_name', u.display_name,
         'avatar_url', p.avatar_url
       ) as sender
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at ASC`,
      [conversationId]
    );
    
    // Mark messages as read
    await query(
      `UPDATE messages 
       SET read = true 
       WHERE conversation_id = $1 AND sender_id != $2 AND read = false`,
      [conversationId, userId]
    );
    
    res.json({ success: true, messages: messagesResult.rows });
  } catch (error) {
    console.error('Messages fetch error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching messages' });
  }
});

// Delete conversation endpoint
app.delete('/api/conversations/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    // Start transaction
    await query('BEGIN');
    
    // Delete all messages in the conversation
    await query('DELETE FROM messages WHERE conversation_id = $1', [conversationId]);
    
    // Delete conversation participants
    await query('DELETE FROM conversation_participants WHERE conversation_id = $1', [conversationId]);
    
    // Delete the conversation
    await query('DELETE FROM conversations WHERE id = $1', [conversationId]);
    
    await query('COMMIT');
    
    res.json({ success: true, message: 'Conversation deleted successfully' });
  } catch (error) {
    await query('ROLLBACK');
    console.error('Delete conversation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error deleting conversation' 
    });
  }
});

// Users search API for finding conversation partners
app.get('/api/users/search', async (req, res) => {
  try {
    const { q, currentUserId } = req.query;
    
    if (!q) {
      return res.json({ success: true, users: [] });
    }
    
    const searchQuery = `%${q}%`;
    
    const usersQuery = currentUserId
      ? `SELECT id, email, display_name 
         FROM users 
         WHERE id != $1 AND 
         (email ILIKE $2 OR display_name ILIKE $2) 
         ORDER BY display_name
         LIMIT 20`
      : `SELECT id, email, display_name 
         FROM users 
         WHERE email ILIKE $1 OR display_name ILIKE $1
         ORDER BY display_name
         LIMIT 20`;
    
    const params = currentUserId 
      ? [currentUserId, searchQuery] 
      : [searchQuery];
    
    const result = await query(usersQuery, params);
    
    // Get avatar URLs
    const usersWithAvatars = await Promise.all(result.rows.map(async (user) => {
      const avatarResult = await query(
        'SELECT avatar_url FROM profiles WHERE user_id = $1',
        [user.id]
      );
      
      return {
        ...user,
        avatar_url: avatarResult.rows[0]?.avatar_url || null
      };
    }));
    
    res.json({ success: true, users: usersWithAvatars });
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({ success: false, message: 'Server error searching users' });
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
        TO_CHAR(created_at, 'YYYY-MM-DD') as created,
        user_id
      FROM gigs 
      WHERE user_id = $1
      ORDER BY created_at DESC`,
      [userId]
    );
    
    res.json({ 
      success: true, 
      gigs: result.rows.map(gig => ({
        ...gig,
        orders: gig.orders || 0,
        rating: gig.rating || 0,
        earnings: gig.earnings || '$0.00'
      }))
    });
  } catch (error) {
    console.error('Gigs fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching gigs',
      error: error.message 
    });
  }
});

app.post('/api/gigs', async (req, res) => {
  try {
    const { userId, title, category, price, description } = req.body;
    
    // Validate required fields
    if (!userId || !title || !category || !price || !description) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Start a transaction
    await query('BEGIN');
    
    const result = await query(
      `INSERT INTO gigs (user_id, title, category, price, description)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, title, description, category, price, status, orders, rating,
       created_at`,
      [userId, title, category, price, description]
    );
    
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
    };
    
    res.status(201).json({ 
      success: true, 
      gig 
    });
  } catch (error) {
    await query('ROLLBACK');
    console.error('Gig creation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error creating gig',
      error: error.message 
    });
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

// Public Gigs Routes - Modified with better error handling
app.get('/api/marketplace/gigs', async (req, res) => {
  try {
    const result = await query(
      `SELECT 
        g.id, 
        g.user_id,
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
        p.rating as seller_rating
      FROM gigs g
      JOIN users u ON g.user_id = u.id
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE g.status = 'active'
      ORDER BY g.created_at DESC`,
      []
    );
    
    res.json({ 
      success: true, 
      gigs: result.rows.map(gig => ({
        ...gig,
        price: gig.price || '$0',
        rating: gig.rating || 0,
        seller_rating: gig.seller_rating || 0
      }))
    });
  } catch (error) {
    console.error('Public gigs fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching gigs',
      error: error.message 
    });
  }
});

// Get single gig details with seller information
app.get('/api/gigs/:gigId/details', async (req, res) => {
  try {
    const { gigId } = req.params;
    
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
    
    res.json({ success: true, gig: result.rows[0] });
  } catch (error) {
    console.error('Gig details fetch error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching gig details' });
  }
});

// Configure multer for memory storage only - no disk storage
const storage = multer.memoryStorage();

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,  // Using memory storage only
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB limit
  }
});

// Image upload endpoint
app.post('/api/upload/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Upload to cloud storage (Azure) or local filesystem
    const result = await storageService.uploadToAzure(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    return res.json({
      success: true,
      message: 'Image uploaded successfully',
      fileUrl: result.url,
      storage: result.storage
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return res.status(500).json({
      success: false,
      message: `Image upload failed: ${error.message}`
    });
  }
});

// Update profile with avatar
app.put('/api/profile/:userId/avatar', async (req, res) => {
  try {
    const { userId } = req.params;
    const { avatarUrl, oldAvatarUrl } = req.body;
    
    if (!avatarUrl) {
      return res.status(400).json({
        success: false,
        message: 'No avatar URL provided'
      });
    }

    // Delete old avatar if it exists
    if (oldAvatarUrl) {
      try {
        await storageService.deleteFromAzure(oldAvatarUrl);
      } catch (deleteErr) {
        console.error('Error deleting old avatar:', deleteErr);
        // Continue even if deletion fails
      }
    }

    // Update profile in database
    await query(
      'UPDATE profiles SET avatar_url = $1 WHERE user_id = $2',
      [avatarUrl, userId]
    );

    return res.json({
      success: true,
      message: 'Profile avatar updated successfully',
      avatarUrl
    });
  } catch (error) {
    console.error('Error updating profile avatar:', error);
    return res.status(500).json({
      success: false,
      message: `Failed to update avatar: ${error.message}`
    });
  }
});

// Add to gigs endpoints - upload gig image
app.post('/api/gigs/:gigId/image', upload.single('image'), async (req, res) => {
  try {
    const { gigId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Upload to cloud storage or local filesystem
    const result = await storageService.uploadToAzure(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    // Update gig in database with image URL
    await query(
      'UPDATE gigs SET image_url = $1 WHERE id = $2',
      [result.url, gigId]
    );

    return res.json({
      success: true,
      message: 'Gig image uploaded successfully',
      imageUrl: result.url
    });
  } catch (error) {
    console.error('Error uploading gig image:', error);
    return res.status(500).json({
      success: false,
      message: `Gig image upload failed: ${error.message}`
    });
  }
});

// Plain, simple server startup - no complexity
// PORT is already defined at the top of the file

// Error handler for server
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`⚠️ Port ${PORT} is already in use. Please use a different port.`);
  } else {
    console.error('Server error:', error);
  }
  process.exit(1);
});

// Just one simple listen call
server.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  
  // Display storage status
  if (storageService && storageService.isAzureConfigured) {
    console.log('📦 Using Azure Blob Storage for file uploads');
  } else {
    console.log('📁 Using local filesystem for file uploads');
    console.log('   Files will be available at /uploads/{filename}');
  }
  
  console.log(`🌐 API available at http://localhost:${PORT}/api`);
  console.log(`🔗 Frontend URL: ${FRONTEND_URL}`);
});
