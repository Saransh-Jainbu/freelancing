const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { pool, query } = require('./db');
const { verifyEmailConnection, sendEmail } = require('./services/emailService');

// Conditionally import Azure Storage
let azureStorage;
try {
  azureStorage = require('./services/azureStorage');
} catch (error) {
  console.warn('Azure Storage is not configured. File upload features will be disabled.');
  azureStorage = null;
}

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10); // Convert PORT to integer
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Create HTTP server and Socket.io instance
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [FRONTEND_URL, 'https://myunitask.xyz'],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(express.json());
app.use(cors({
  origin: [FRONTEND_URL, 'https://myunitask.xyz'],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Initialize passport
app.use(passport.initialize());

// Health check route (add near the top with other routes)
const healthRoutes = require('./routes/health');
app.use('/api/health', healthRoutes);

// Import routes
const ordersRoutes = require('./routes/orders');
const notificationsRoutes = require('./routes/notifications');
const { sendPushNotification } = require('./routes/notifications');

// Register routes
app.use('/api/orders', ordersRoutes);
app.use('/api/notifications', notificationsRoutes);

// Define this direct route handler first, before registering route modules
app.put('/api/orders/:orderId/status', async (req, res) => {
  console.log('[DIRECT ENDPOINT] Order status update endpoint accessed');
  console.log(`[DIRECT ENDPOINT] Order ID: ${req.params.orderId}`);
  console.log(`[DIRECT ENDPOINT] Request body:`, req.body);
  
  try {
    const orderId = req.params.orderId;
    const { status, userId } = req.body;
    
    // Simple validation
    if (!orderId || !status || !userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: orderId, status, or userId' 
      });
    }
    
    // Check if order exists - simple query
    const orderCheck = await query('SELECT id FROM orders WHERE id = $1', [orderId]);
    
    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }
    
    // Simple update without complex authorization for maximum compatibility
    const updateResult = await query(
      `UPDATE orders 
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, orderId]
    );
    
    res.json({ 
      success: true, 
      order: updateResult.rows[0]
    });
  } catch (error) {
    console.error('[DIRECT ENDPOINT] Error updating order status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error updating order status: ' + error.message
    });
  }
});

// Add this direct route for order status updates specifically at server level
app.put('/api/orders/:orderId/status', async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const { status, userId } = req.body;
    
    console.log(`[Server Direct] Order status update request: orderId=${orderId}, status=${status}, userId=${userId}`);
    
    if (!orderId || !status || !userId) {
      console.log(`[Server Direct] Missing required fields in order status update`);
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: orderId, status, or userId' 
      });
    }
    
    // First check if order exists
    const orderExistsQuery = 'SELECT id FROM orders WHERE id = $1';
    const orderExists = await query(orderExistsQuery, [orderId]);
    
    if (orderExists.rows.length === 0) {
      console.log(`[Server Direct] Order ${orderId} not found in database`);
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }
    
    // Get full order details
    const orderQuery = 'SELECT client_id, seller_id, freelancer_id, status as current_status FROM orders WHERE id = $1';
    const orderCheck = await query(orderQuery, [orderId]);
    const order = orderCheck.rows[0];
    
    // Print debugging info
    console.log(`[Server Direct] Found order: ${JSON.stringify(order)}`);
    console.log(`[Server Direct] User ID: ${userId}, Type: ${typeof userId}`);
    console.log(`[Server Direct] Client ID: ${order.client_id}, Type: ${typeof order.client_id}`);
    console.log(`[Server Direct] Seller ID: ${order.seller_id}, Type: ${typeof order.seller_id}`);
    console.log(`[Server Direct] Freelancer ID: ${order.freelancer_id}, Type: ${typeof order.freelancer_id}`);
    
    // Convert IDs to numbers for reliable comparison
    const userIdNum = Number(userId);
    const clientIdNum = Number(order.client_id);
    const sellerIdNum = Number(order.seller_id || order.freelancer_id);
    
    // Check authorization
    const isSeller = userIdNum === sellerIdNum;
    const isClient = userIdNum === clientIdNum;
    
    console.log(`[Server Direct] Authorization check: isSeller=${isSeller}, isClient=${isClient}`);
    
    if (!isSeller && !isClient) {
      console.log(`[Server Direct] User ${userId} not authorized for order ${orderId}`);
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this order' 
      });
    }
    
    // Additional timestamp fields to update based on new status
    let additionalFields = '';
    
    if (status === 'in_progress') {
      additionalFields = ', started_at = CURRENT_TIMESTAMP';
    } else if (status === 'verifying') {
      additionalFields = ', completed_at = CURRENT_TIMESTAMP';
    } else if (status === 'completed') {
      additionalFields = ', completed_at = COALESCE(completed_at, CURRENT_TIMESTAMP)';
    } else if (status === 'cancelled') {
      additionalFields = ', cancelled_at = CURRENT_TIMESTAMP';
    } else if (status === 'cancellation_requested') {
      additionalFields = ', cancellation_requested_at = CURRENT_TIMESTAMP';
    }
    
    // Update order status - no user ID check here since we already verified authorization
    const updateQuery = `
      UPDATE orders 
      SET status = $1, 
          updated_at = CURRENT_TIMESTAMP
          ${additionalFields}
      WHERE id = $2
      RETURNING *`;
    
    const result = await query(updateQuery, [status, orderId]);
    
    if (result.rows.length === 0) {
      console.log(`[Server Direct] Failed to update order ${orderId} status`);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to update order status' 
      });
    }
    
    console.log(`[Server Direct] Successfully updated order ${orderId} status to ${status}`);
    
    // Success - return the updated order
    res.json({ 
      success: true, 
      order: result.rows[0] 
    });
  } catch (error) {
    console.error('[Server Direct] Error updating order status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error updating order status: ' + error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
    });
  }
});

// Update the client-side cancellation endpoint to improve validation and logging
app.post('/api/orders/:orderId/client-cancel', async (req, res) => {
  console.log('[CLIENT-CANCEL] Client cancellation endpoint accessed');
  try {
    const orderId = req.params.orderId;
    const { clientId, reason } = req.body;

    if (!orderId || !clientId || !reason) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: orderId, clientId, or reason' 
      });
    }

    // Verify the order exists and belongs to this client
    const orderCheck = await query(
      'SELECT client_id, seller_id, freelancer_id, status FROM orders WHERE id = $1',
      [orderId]
    );

    if (orderCheck.rows.length === 0) {
      console.log(`[CLIENT-CANCEL] Order ${orderId} not found`);
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    const order = orderCheck.rows[0];

    // Check if client is authorized
    if (Number(order.client_id) !== Number(clientId)) {
      console.log(`[CLIENT-CANCEL] Client ${clientId} is not authorized to cancel order ${orderId}, belongs to client ${order.client_id}`);
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    // Check if order is in a cancellable state
    const cancellableStates = ['pending', 'in_progress', 'verifying'];
    if (!cancellableStates.includes(order.status)) {
      console.log(`[CLIENT-CANCEL] Order ${orderId} cannot be cancelled in status ${order.status}`);
      return res.status(400).json({
        success: false,
        message: `Orders in ${order.status} status cannot be cancelled`
      });
    }

    // Update order status to cancellation_requested
    const updateResult = await query(
      `UPDATE orders
       SET status = 'cancellation_requested',
          cancellation_reason = $1,
          cancellation_requested_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND client_id = $3
       RETURNING *`,
      [reason, orderId, clientId]
    );

    // Notify the freelancer about the cancellation request
    const freelancerId = order.seller_id || order.freelancer_id;

    // Get client name
    const clientResult = await query(
      'SELECT display_name FROM users WHERE id = $1',
      [clientId]
    );

    const clientName = clientResult.rows[0]?.display_name || 'Client';

    // Create notification for freelancer
    await query(
      `INSERT INTO notifications (
        user_id, type, title, message, reference_id, reference_type
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        freelancerId,
        'order_cancellation',
        'Cancellation Request',
        `${clientName} has requested to cancel order #${orderId}${reason ? ': ' + reason : ''}`,
        orderId,
        'order'
      ]
    );

    // Send notification via WebSocket
    io.to(`user-${freelancerId}`).emit('notification', {
      type: 'order_cancellation',
      title: 'Cancellation Request',
      message: `${clientName} has requested to cancel order #${orderId}${reason ? ': ' + reason : ''}`,
      reference_id: orderId,
      reference_type: 'order'
    });

    res.json({
      success: true,
      order: updateResult.rows[0],
      message: 'Cancellation request sent to freelancer'
    });

  } catch (error) {
    console.error('[CLIENT-CANCEL] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error processing cancellation request'
    });
  }
});

// Add route to fetch verifying orders for a seller
app.get('/api/orders/verifying/seller/:sellerId', async (req, res) => {
  try {
    const sellerId = req.params.sellerId;

    const result = await query(
      `SELECT o.*, g.title as gig_title, u.display_name as buyer_name 
       FROM orders o
       JOIN gigs g ON o.gig_id = g.id
       JOIN users u ON o.client_id = u.id
       WHERE o.seller_id = $1 AND o.status = 'verifying'
       ORDER BY o.updated_at DESC`,
      [sellerId]
    );

    res.json({ success: true, orders: result.rows });
  } catch (error) {
    console.error('Error fetching verifying orders:', error);
    res.status(500).json({ success: false, message: 'Server error fetching verifying orders' });
  }
});

// Add route to fetch user rating
app.get('/api/users/:userId/rating', async (req, res) => {
  try {
    const userId = req.params.userId;

    const result = await query(
      `SELECT AVG(rating) as rating 
       FROM reviews 
       WHERE freelancer_id = $1`,
      [userId]
    );

    const rating = result.rows[0]?.rating || 0;
    res.json({ success: true, rating });
  } catch (error) {
    console.error('Error fetching user rating:', error);
    res.status(500).json({ success: false, message: 'Server error fetching user rating' });
  }
});

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

    // Orders table
    await query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        gig_id INTEGER REFERENCES gigs(id),
        client_id INTEGER REFERENCES users(id),
        freelancer_id INTEGER REFERENCES users(id),
        status VARCHAR(50) DEFAULT 'pending',
        amount DECIMAL(10,2) NOT NULL,
        requirements TEXT,
        delivery_time INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP WITH TIME ZONE,
        payment_status VARCHAR(50) DEFAULT 'unpaid',
        payment_details JSONB,
        cancellation_reason TEXT,
        cancellation_requested_at TIMESTAMP WITH TIME ZONE,
        cancellation_approved_at TIMESTAMP WITH TIME ZONE,
        cancelled_at TIMESTAMP WITH TIME ZONE,
        freelancer_response TEXT,
        started_at TIMESTAMP WITH TIME ZONE,
        revision_requested_at TIMESTAMP WITH TIME ZONE,
        revision_reason TEXT
      )
    `);

    // Add missing columns for order status management
    await query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS revision_requested_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS revision_reason TEXT
    `);

    // Order updates/revisions
    await query(`
      CREATE TABLE IF NOT EXISTS order_updates (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id),
        sender_id INTEGER REFERENCES users(id),
        content TEXT,
        attachment_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Reviews table
    await query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id),
        gig_id INTEGER REFERENCES gigs(id),
        reviewer_id INTEGER REFERENCES users(id),
        freelancer_id INTEGER REFERENCES users(id),
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Order milestones/deliverables
    await query(`
      CREATE TABLE IF NOT EXISTS order_milestones (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id),
        title VARCHAR(255),
        description TEXT,
        amount DECIMAL(10,2),
        due_date TIMESTAMP WITH TIME ZONE,
        status VARCHAR(50) DEFAULT 'pending',
        completed_at TIMESTAMP WITH TIME ZONE
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS gig_packages (
        id SERIAL PRIMARY KEY,
        gig_id INTEGER REFERENCES gigs(id) ON DELETE CASCADE,
        package_type VARCHAR(50) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        delivery_days INTEGER NOT NULL,
        revisions INTEGER DEFAULT 0,
        features JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(gig_id, package_type)
      )
    `);

    await query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS package_type VARCHAR(50) DEFAULT 'basic',
      ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1
    `);

    // Add notification table
    await query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        reference_id INTEGER,
        reference_type VARCHAR(50),
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add push subscriptions table
    await query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        endpoint VARCHAR(500) UNIQUE NOT NULL,
        p256dh VARCHAR(200) NOT NULL,
        auth VARCHAR(100) NOT NULL,
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

// Verify email configuration on startup
verifyEmailConnection();

// Initialize database on server start
initDb();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Associate user ID with socket for notifications
  socket.on('register-user', (userId) => {
    if (userId) {
      console.log(`User ${userId} registered with socket ${socket.id}`);
      socket.join(`user-${userId}`);
    }
  });
  
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
      
      // Send notification to other participants
      const participantsResult = await query(
        `SELECT user_id 
         FROM conversation_participants 
         WHERE conversation_id = $1 AND user_id != $2`,
        [conversationId, senderId]
      );
      
      // Get sender name
      const senderResult = await query(
        `SELECT display_name FROM users WHERE id = $1`,
        [senderId]
      );
      
      const senderName = senderResult.rows[0]?.display_name || 'Someone';
      
      // Get conversation title or participant names
      const conversationResult = await query(
        `SELECT gig_title FROM conversations WHERE id = $1`,
        [conversationId]
      );
      
      let conversationTitle = conversationResult.rows[0]?.gig_title || 'Chat';
      
      // Create notifications for each participant
      for (const participant of participantsResult.rows) {
        // Create notification in database
        await query(
          `INSERT INTO notifications (
            user_id, type, title, message, reference_id, reference_type
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            participant.user_id,
            'message',
            `New message from ${senderName}`,
            content.length > 50 ? content.substring(0, 47) + '...' : content,
            conversationId,
            'conversation'
          ]
        );
        
        // Send notification via WebSocket
        io.to(`user-${participant.user_id}`).emit('notification', {
          type: 'message',
          title: `New message from ${senderName}`,
          message: content.length > 50 ? content.substring(0, 47) + '...' : content,
          reference_id: conversationId,
          reference_type: 'conversation',
          sender_name: senderName,
          conversation_title: conversationTitle
        });

        // Send push notification (will only go to users who have subscribed)
        sendPushNotification(
          participant.user_id,
          `New message from ${senderName}`,
          content.length > 50 ? content.substring(0, 47) + '...' : content,
          `${FRONTEND_URL}/chat/${conversationId}`,
          `conversation-${conversationId}`
        );
      }
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

    // Improved check for existing conversation between these users
    // Sort participant IDs to ensure consistent query regardless of order
    const sortedParticipantIds = [...participantIds].sort((a, b) => a - b);
    
    // Check if conversation already exists between these users
    const existingConversation = await query(
      `SELECT c.id 
       FROM conversations c
       JOIN conversation_participants cp1 ON c.id = cp1.conversation_id AND cp1.user_id = $1
       JOIN conversation_participants cp2 ON c.id = cp2.conversation_id AND cp2.user_id = $2
       WHERE cp1.user_id != cp2.user_id
       LIMIT 1`,
      [sortedParticipantIds[0], sortedParticipantIds[1]]
    );

    if (existingConversation.rows.length > 0) {
      // Return existing conversation with full details
      const conversation = await query(
        `SELECT c.*, 
         (
           SELECT json_agg(json_build_object(
             'id', u.id,
             'display_name', u.display_name,
             'avatar_url', p.avatar_url
           ))
           FROM conversation_participants cp
           JOIN users u ON cp.user_id = u.id
           LEFT JOIN profiles p ON u.id = p.user_id
           WHERE cp.conversation_id = c.id
         ) as participants
         FROM conversations c
         WHERE c.id = $1`,
        [existingConversation.rows[0].id]
      );

      return res.json({ 
        success: true, 
        conversation: conversation.rows[0],
        existed: true // Flag to indicate this was an existing conversation
      });
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

// Replace server.listen with better error handling
const startServer = async (initialPort) => {
  const findAvailablePort = async (startPort) => {
    return new Promise((resolve, reject) => {
      server.once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          server.close();
          resolve(findAvailablePort(startPort + 1));
        } else {
          reject(err);
        }
      });
      
      server.listen(startPort, () => {
        resolve(startPort);
      });
    });
  };

  try {
    // Ensure port is a valid number
    let port = typeof initialPort === 'string' ? parseInt(initialPort, 10) : initialPort;
    port = isNaN(port) || port < 0 || port >= 65536 ? 5000 : port;
    
    port = await findAvailablePort(port);
    console.log(`Server running on port ${port}`);
    
    // Update environment variable for other parts of the application
    process.env.PORT = String(port);
    process.env.SERVER_URL = `http://localhost:${port}`;
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(PORT);

// Configure multer for memory storage only - no disk storage
const storage = multer.memoryStorage();

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

const upload = multer({ 
  storage: storage,  // Using memory storage only
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB limit
  }
});

// Image upload endpoint with Azure Blob Storage ONLY
app.post('/api/upload/image', upload.single('image'), async (req, res) => {
  if (!azureStorage) {
    return res.status(503).json({ 
      success: false, 
      message: 'File upload is currently unavailable' 
    });
  }
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    console.log('[Server] Uploading image to Azure:', req.file.originalname);
    console.log('[Server] File size:', req.file.size, 'bytes');
    console.log('[Server] File MIME type:', req.file.mimetype);
    
    // Upload to Azure Blob Storage
    const uploadResult = await azureStorage.uploadToAzure(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );
    
    console.log('[Server] Azure upload successful:', uploadResult);
    
    res.status(200).json({
      success: true,
      fileUrl: uploadResult.url, // URL with SAS token
      blobUrl: uploadResult.blobUrl, // Original URL without SAS
      blobName: uploadResult.blobName
    });
  } catch (error) {
    console.error('[Server] Error uploading image:', error);
    
    // Error details for debugging
    const errorDetails = {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      requestId: error.requestId || 'none'
    };
    
    console.error('[Server] Error details:', errorDetails);
    
    // Specific error handling for common Azure issues
    if (error.message && error.message.includes('container already exists')) {
      console.log('[Server] Container already exists - this is not actually an error');
      // Despite the error, we still want to upload the file
      try {
        const uploadResult = await azureStorage.uploadToAzure(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype,
          true // Skip container creation
        );
        
        return res.status(200).json({
          success: true,
          fileUrl: uploadResult.url,
          blobUrl: uploadResult.blobUrl,
          blobName: uploadResult.blobName
        });
      } catch (retryError) {
        console.error('[Server] Error in retry upload:', retryError);
        return res.status(500).json({ 
          success: false, 
          message: 'Error uploading image after retry: ' + retryError.message,
          errorDetails: {
            message: retryError.message,
            code: retryError.code || 'unknown'
          }
        });
      }
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Error uploading image: ' + error.message,
      errorDetails
    });
  }
});

// Update profile with avatar
app.put('/api/profile/:userId/avatar', async (req, res) => {
  if (!azureStorage) {
    return res.status(503).json({ 
      success: false, 
      message: 'File upload is currently unavailable' 
    });
  }
  try {
    const { userId } = req.params;
    const { avatarUrl, oldAvatarUrl } = req.body;
    
    if (!avatarUrl) {
      return res.status(400).json({ success: false, message: 'Avatar URL is required' });
    }
    
    console.log(`[Server] Updating avatar for user ${userId}`);
    console.log(`[Server] New avatar URL: ${avatarUrl}`);
    
    // Delete old avatar from Azure if it exists
    if (oldAvatarUrl && oldAvatarUrl.includes('blob.core.windows.net')) {
      try {
        console.log(`[Server] Attempting to delete old avatar: ${oldAvatarUrl}`);
        await azureStorage.deleteFromAzure(oldAvatarUrl);
        console.log(`[Server] Old avatar deleted successfully`);
      } catch (deleteError) {
        console.warn('[Server] Failed to delete old avatar, continuing anyway:', deleteError);
      }
    }
    
    // Update profile avatar in database
    await query(
      `UPDATE profiles SET avatar_url = $1 WHERE user_id = $2`,
      [avatarUrl, userId]
    );
    
    res.json({ success: true, avatarUrl });
  } catch (error) {
    console.error('Error updating avatar:', error);
    res.status(500).json({ success: false, message: 'Server error updating avatar: ' + error.message });
  }
});

// Add to gigs endpoints - upload gig image with Azure only
app.post('/api/gigs/:gigId/image', upload.single('image'), async (req, res) => {
  if (!azureStorage) {
    return res.status(503).json({ 
      success: false, 
      message: 'File upload is currently unavailable' 
    });
  }
  try {
    const { gigId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    console.log(`[Server] Uploading gig image for gig ${gigId}`);
    
    // Upload to Azure Blob Storage
    const uploadResult = await azureStorage.uploadToAzure(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );
    
    // Get old image URL to delete later
    const oldImageResult = await query(
      'SELECT image_url FROM gigs WHERE id = $1',
      [gigId]
    );
    
    const oldImageUrl = oldImageResult.rows[0]?.image_url;
    
    // Save new image URL to gig in database
    await query(
      `UPDATE gigs SET image_url = $1 WHERE id = $2 RETURNING id`,
      [uploadResult.url, gigId]
    );
    
    // Delete old image if it exists
    if (oldImageUrl && oldImageUrl.includes('blob.core.windows.net')) {
      try {
        console.log(`[Server] Attempting to delete old gig image: ${oldImageUrl}`);
        await azureStorage.deleteFromAzure(oldImageUrl);
        console.log(`[Server] Old gig image deleted successfully`);
      } catch (deleteError) {
        console.warn('[Server] Failed to delete old gig image, continuing anyway:', deleteError);
      }
    }
    
    res.status(200).json({
      success: true,
      gigId,
      imageUrl: uploadResult.url
    });
  } catch (error) {
    console.error('Error uploading gig image:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error uploading gig image: ' + error.message 
    });
  }
});

// Get cancelled orders for a seller
app.get('/api/orders/cancelled/seller/:sellerId', async (req, res) => {
  try {
    const sellerId = req.params.sellerId;

    console.log(`[Server] Fetching cancelled orders for seller ${sellerId}`);

    const result = await query(
      `SELECT o.*, g.title as gig_title, u.display_name as buyer_name 
       FROM orders o
       LEFT JOIN gigs g ON o.gig_id = g.id
       LEFT JOIN users u ON o.client_id = u.id
       WHERE o.freelancer_id = $1 AND o.status = 'cancelled'
       ORDER BY o.cancelled_at DESC NULLS LAST`,
      [sellerId]
    );

    if (result.rows.length === 0) {
      console.log(`[Server] No cancelled orders found for seller ${sellerId}`);
      return res.status(404).json({ success: false, message: 'No cancelled orders found' });
    }

    res.json({ success: true, orders: result.rows });
  } catch (error) {
    console.error(`[Server] Error fetching cancelled orders for seller ${sellerId}:`, error);
    res.status(500).json({ success: false, message: 'Server error fetching cancelled orders' });
  }
});

// Request order cancellation (initiated by client)
app.post('/api/orders/:orderId/request-cancellation', async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const { clientId, reason } = req.body;
    
    console.log(`[Server] Cancellation request for order ${orderId} by client ${clientId}, reason: ${reason}`);
    
    // First check if the order exists and belongs to this client
    const orderCheck = await query(
      'SELECT status, seller_id, freelancer_id FROM orders WHERE id = $1',
      [orderId]
    );
    
    if (orderCheck.rows.length === 0) {
      console.log(`[Server] Order ${orderId} not found`);
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    // Get client ID from the order
    const clientIdCheck = await query(
      'SELECT client_id FROM orders WHERE id = $1',
      [orderId]
    );
    
    // Check if this client is authorized to cancel this order
    // Convert both IDs to numbers to ensure proper comparison
    if (Number(clientIdCheck.rows[0].client_id) !== Number(clientId)) {
      console.log(`[Server] Client ${clientId} is not authorized to cancel order ${orderId}, belongs to client ${clientIdCheck.rows[0].client_id}`);
      return res.status(403).json({ 
        success: false, 
        message: 'You are not authorized to cancel this order' 
      });
    }
    
    const currentStatus = orderCheck.rows[0].status;
    const sellerId = orderCheck.rows[0].seller_id || orderCheck.rows[0].freelancer_id;
    
    console.log(`[Server] Order ${orderId} current status: ${currentStatus}, seller: ${sellerId}`);
    
    // Check if order is in a status that allows cancellation requests
    const allowedStatusForCancellation = ['pending', 'in_progress', 'verifying'];
    if (!allowedStatusForCancellation.includes(currentStatus)) {
      console.log(`[Server] Order ${orderId} cannot be cancelled in status ${currentStatus}`);
      return res.status(400).json({
        success: false,
        message: `Cancellation cannot be requested when order is in ${currentStatus} status`
      });
    }
    
    // Update the order to cancellation_requested status
    const result = await query(
      `UPDATE orders 
       SET status = 'cancellation_requested', 
           cancellation_reason = $1,
           cancellation_requested_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND client_id = $3
       RETURNING *`,
      [reason, orderId, clientId]
    );
    
    if (result.rows.length === 0) {
      console.log(`[Server] Failed to update order ${orderId} status`);
      return res.status(404).json({ 
        success: false, 
        message: 'Could not update order status' 
      });
    }
    
    console.log(`[Server] Order ${orderId} updated to cancellation_requested successfully`);
    
    // Get client name for notification
    const clientResult = await query(
      'SELECT display_name FROM users WHERE id = $1',
      [clientId]
    );
    
    const clientName = clientResult.rows[0]?.display_name || 'The client';
    
    // Create notification for the freelancer
    await query(
      `INSERT INTO notifications (
        user_id, type, title, message, reference_id, reference_type
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        sellerId,
        'order_cancellation',
        'Cancellation Request',
        `${clientName} has requested to cancel order #${orderId}${reason ? ': ' + reason : ''}`,
        orderId,
        'order'
      ]
    );
    
    // Send notification via WebSocket
    io.to(`user-${sellerId}`).emit('notification', {
      type: 'order_cancellation',
      title: 'Cancellation Request',
      message: `${clientName} has requested to cancel order #${orderId}${reason ? ': ' + reason : ''}`,
      reference_id: orderId,
      reference_type: 'order'
    });
    
    // Send push notification
    sendPushNotification(
      sellerId,
      'Cancellation Request',
      `${clientName} has requested to cancel order #${orderId}${reason ? ': ' + reason : ''}`,
      `${FRONTEND_URL}/orders/${orderId}`,
      `order-${orderId}`
    );
    
    // Success - return the updated order
    res.json({ 
      success: true, 
      order: result.rows[0],
      message: 'Cancellation request sent to freelancer'
    });
  } catch (error) {
    console.error('Error requesting order cancellation:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error requesting order cancellation: ' + error.message 
    });
  }
});

// Get orders with pending cancellation requests for a freelancer
app.get('/api/orders/cancellation-requests/:sellerId', async (req, res) => {
  try {
    const sellerId = req.params.sellerId;
    
    const result = await query(
      `SELECT o.*, g.title, u.display_name as buyer_name 
       FROM orders o
       JOIN gigs g ON o.gig_id = g.id
       JOIN users u ON o.client_id = u.id
       WHERE (o.seller_id = $1 OR o.freelancer_id = $1) AND o.status = 'cancellation_requested'
       ORDER BY o.cancellation_requested_at DESC`,
      [sellerId]
    );
    
    res.json({ success: true, orders: result.rows });
  } catch (error) {
    console.error('Error fetching cancellation requests:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching cancellation requests' 
    });
  }
});

// Respond to cancellation request (approve or reject)
app.put('/api/orders/:orderId/cancellation-response', async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const { sellerId, approved, response } = req.body;
    
    // First check if the order exists and belongs to this seller
    const orderCheck = await query(
      'SELECT status, client_id FROM orders WHERE id = $1 AND (seller_id = $2 OR freelancer_id = $2)',
      [orderId, sellerId]
    );
    
    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found or you are not authorized to respond to cancellation' 
      });
    }
    
    const currentStatus = orderCheck.rows[0].status;
    const clientId = orderCheck.rows[0].client_id;
    
    // Check if order is in cancellation_requested status
    if (currentStatus !== 'cancellation_requested') {
      return res.status(400).json({
        success: false,
        message: `Cannot respond to cancellation when order is in ${currentStatus} status`
      });
    }
    
    let result;
    
    if (approved) {
      // If approved, update to cancelled status
      result = await query(
        `UPDATE orders 
         SET status = 'cancelled', 
             cancellation_approved_at = CURRENT_TIMESTAMP,
             cancelled_at = CURRENT_TIMESTAMP,
             freelancer_response = $1
         WHERE id = $2 AND (seller_id = $3 OR freelancer_id = $3)
         RETURNING *`,
        [response || 'Cancellation approved', orderId, sellerId]
      );
      
      // Get detailed order information for email notifications
      const orderDetails = await query(
        `SELECT o.*, g.title as gig_title 
         FROM orders o
         JOIN gigs g ON o.gig_id = g.id
         WHERE o.id = $1`,
        [orderId]
      );
      
      // Get email addresses and names for both parties
      const userEmails = await query(
        `SELECT u.id, u.email, u.display_name 
         FROM users u 
         WHERE u.id IN ($1, $2)`,
        [clientId, sellerId]
      );
      
      const emailMap = {};
      const nameMap = {};
      userEmails.rows.forEach(user => {
        emailMap[user.id] = user.email;
        nameMap[user.id] = user.display_name;
      });
      
      // Send email to client
      sendEmail({
        to: emailMap[clientId],
        subject: `Order #${orderId} Cancellation Approved`,
        html: `
          <h1>Order Cancellation Approved</h1>
          <p>Hello ${nameMap[clientId]},</p>
          <p>Your request to cancel order #${orderId} for "${orderDetails.rows[0].gig_title}" has been approved.</p>
          ${response ? `<p><strong>Freelancer's response:</strong> ${response}</p>` : ''}
          <p>If you have any questions, please contact support.</p>
          <p>Thank you for using our platform.</p>
        `
      });
      
      // Send email to freelancer
      sendEmail({
        to: emailMap[sellerId],
        subject: `Order #${orderId} Has Been Cancelled`,
        html: `
          <h1>Order Has Been Cancelled</h1>
          <p>Hello ${nameMap[sellerId]},</p>
          <p>You have approved the cancellation request for order #${orderId} "${orderDetails.rows[0].gig_title}".</p>
          <p>This order is now officially cancelled.</p>
          <p>Thank you for using our platform.</p>
        `
      });
    } else {
      // If rejected, revert to previous status
      result = await query(
        `UPDATE orders 
         SET status = CASE 
                       WHEN completed_at IS NOT NULL THEN 'verifying'
                       WHEN started_at IS NOT NULL THEN 'in_progress'
                       ELSE 'pending'
                     END,
             freelancer_response = $1
         WHERE id = $2 AND (seller_id = $3 OR freelancer_id = $3)
         RETURNING *`,
        [response || 'Cancellation rejected', orderId, sellerId]
      );
    }
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Could not update order status' 
      });
    }
    
    // Get seller name for notification
    const sellerResult = await query(
      'SELECT display_name FROM users WHERE id = $1',
      [sellerId]
    );
    
    const sellerName = sellerResult.rows[0]?.display_name || 'The freelancer';
    
    // Create notification for the client
    await query(
      `INSERT INTO notifications (
        user_id, type, title, message, reference_id, reference_type
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        clientId,
        'order_status',
        approved ? 'Cancellation Approved' : 'Cancellation Rejected',
        `${sellerName} has ${approved ? 'approved' : 'rejected'} your cancellation request for order #${orderId}${response ? ': ' + response : ''}`,
        orderId,
        'order'
      ]
    );
    
    // Send notification via WebSocket
    io.to(`user-${clientId}`).emit('notification', {
      type: 'order_status',
      title: approved ? 'Cancellation Approved' : 'Cancellation Rejected',
      message: `${sellerName} has ${approved ? 'approved' : 'rejected'} your cancellation request for order #${orderId}${response ? ': ' + response : ''}`,
      reference_id: orderId,
      reference_type: 'order'
    });
    
    // Send push notification
    sendPushNotification(
      clientId,
      approved ? 'Cancellation Approved' : 'Cancellation Rejected',
      `${sellerName} has ${approved ? 'approved' : 'rejected'} your cancellation request for order #${orderId}${response ? ': ' + response : ''}`,
      `${FRONTEND_URL}/orders/${orderId}`,
      `order-${orderId}`
    );
    
    // Success - return the updated order
    res.json({ 
      success: true, 
      order: result.rows[0],
      message: `Cancellation ${approved ? 'approved' : 'rejected'}`
    });
  } catch (error) {
    console.error('Error responding to cancellation request:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error responding to cancellation request' 
    });
  }
});

// Add a new endpoint for updating order status
app.put('/api/orders/:orderId/status', async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const { status, userId } = req.body;
    
    console.log(`[Server] Updating order ${orderId} to status ${status} by user ${userId}`);
    
    if (!orderId || !status || !userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: orderId, status, or userId' 
      });
    }
    
    // First check if the order exists
    const orderCheck = await query(
      'SELECT client_id, seller_id, freelancer_id, status as current_status FROM orders WHERE id = $1',
      [orderId]
    );
    
    if (orderCheck.rows.length === 0) {
      console.log(`[Server] Order ${orderId} not found`);
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }
    
    const order = orderCheck.rows[0];
    const isSeller = order.seller_id === parseInt(userId) || order.freelancer_id === parseInt(userId);
    const isClient = order.client_id === parseInt(userId);
    
    // Check if user is authorized to update this order
    if (!isSeller && !isClient) {
      console.log(`[Server] User ${userId} not authorized for order ${orderId}`);
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this order' 
      });
    }
    
    // Define valid status transitions
    const validTransitions = {
      'pending': ['in_progress', 'cancellation_requested'],
      'in_progress': ['verifying', 'cancellation_requested'],
      'verifying': ['completed', 'cancellation_requested', 'revision_requested'],
      'completed': [],
      'cancelled': [],
      'cancellation_requested': ['cancelled', 'pending', 'in_progress', 'verifying'],
      'revision_requested': ['in_progress']
    };
    
    // Check if the status transition is valid
    if (!validTransitions[order.current_status]?.includes(status)) {
      console.log(`[Server] Invalid status transition from ${order.current_status} to ${status}`);
      return res.status(400).json({ 
        success: false, 
        message: `Cannot change status from ${order.current_status} to ${status}` 
      });
    }
    
    // Additional timestamp fields to update based on new status
    let additionalFields = '';
    
    if (status === 'in_progress') {
      additionalFields = ', started_at = CURRENT_TIMESTAMP';
    } else if (status === 'verifying') {
      additionalFields = ', completed_at = CURRENT_TIMESTAMP';
    } else if (status === 'completed') {
      additionalFields = ', completed_at = COALESCE(completed_at, CURRENT_TIMESTAMP)';
    } else if (status === 'cancelled') {
      additionalFields = ', cancelled_at = CURRENT_TIMESTAMP';
    } else if (status === 'cancellation_requested') {
      additionalFields = ', cancellation_requested_at = CURRENT_TIMESTAMP';
    }
    
    // Update the order status
    const result = await query(
      `UPDATE orders 
       SET status = $1, 
           updated_at = CURRENT_TIMESTAMP
           ${additionalFields}
       WHERE id = $2
       RETURNING *`,
      [status, orderId]
    );
    
    if (result.rows.length === 0) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to update order status' 
      });
    }
    
    // Get user names for notification
    const userResult = await query(
      'SELECT id, display_name FROM users WHERE id IN ($1, $2)',
      [order.client_id, isSeller ? userId : order.seller_id || order.freelancer_id]
    );
    
    const users = {};
    userResult.rows.forEach(user => {
      users[user.id] = user.display_name;
    });
    
    const clientName = users[order.client_id] || 'Client';
    const sellerName = users[order.seller_id || order.freelancer_id] || 'Freelancer';
    
    // Determine who to notify
    const notifyUserId = isSeller ? order.client_id : (order.seller_id || order.freelancer_id);
    const actorName = isSeller ? sellerName : clientName;
    
    // Create notification about status change
    await query(
      `INSERT INTO notifications (
        user_id, type, title, message, reference_id, reference_type
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        notifyUserId,
        'order_status',
        `Order Status Updated`,
        `${actorName} has updated order #${orderId} status to ${status}`,
        orderId,
        'order'
      ]
    );
    
    // Send notification via WebSocket
    io.to(`user-${notifyUserId}`).emit('notification', {
      type: 'order_status',
      title: `Order Status Updated`,
      message: `${actorName} has updated order #${orderId} status to ${status}`,
      reference_id: orderId,
      reference_type: 'order'
    });
    
    // Send push notification
    sendPushNotification(
      notifyUserId,
      `Order Status Updated`,
      `${actorName} has updated order #${orderId} status to ${status}`,
      `${FRONTEND_URL}/orders/${orderId}`,
      `order-${orderId}`
    );
    
    // Add email notification if status is changed to cancelled
    if (status === 'cancelled') {
      // Get detailed order information
      const orderDetails = await query(
        `SELECT o.*, g.title as gig_title 
         FROM orders o
         JOIN gigs g ON o.gig_id = g.id
         WHERE o.id = $1`,
        [orderId]
      );
      
      // Get email addresses for both parties
      const userEmails = await query(
        `SELECT u.id, u.email, u.display_name 
         FROM users u 
         WHERE u.id IN ($1, $2)`,
        [order.client_id, order.seller_id || order.freelancer_id]
      );
      
      const emailMap = {};
      const nameMap = {};
      userEmails.rows.forEach(user => {
        emailMap[user.id] = user.email;
        nameMap[user.id] = user.display_name;
      });
      
      // Send email to client
      sendEmail({
        to: emailMap[order.client_id],
        subject: `Order #${orderId} Has Been Cancelled`,
        html: `
          <h1>Order Cancelled</h1>
          <p>Hello ${nameMap[order.client_id]},</p>
          <p>Your order #${orderId} for "${orderDetails.rows[0].gig_title}" has been cancelled.</p>
          <p>If you have any questions, please contact support.</p>
          <p>Thank you for using our platform.</p>
        `
      });
      
      // Send email to freelancer
      const freelancerId = order.seller_id || order.freelancer_id;
      sendEmail({
        to: emailMap[freelancerId],
        subject: `Order #${orderId} Has Been Cancelled`,
        html: `
          <h1>Order Cancelled</h1>
          <p>Hello ${nameMap[freelancerId]},</p>
          <p>Order #${orderId} for "${orderDetails.rows[0].gig_title}" has been cancelled.</p>
          <p>If you have any questions, please contact support.</p>
          <p>Thank you for using our platform.</p>
        `
      });
    }
    
    // Success - return the updated order
    console.log(`[Server] Successfully updated order ${orderId} to status ${status}`);
    res.json({ 
      success: true, 
      order: result.rows[0] 
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error updating order status: ' + error.message 
    });
  }
});

// Update the complete order endpoint to check for cancelled status
app.put('/api/orders/:orderId/complete', async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const { sellerId } = req.body;
    
    // First check if the order exists and belongs to this seller
    const orderCheck = await query(
      'SELECT status FROM orders WHERE id = $1 AND (seller_id = $2 OR freelancer_id = $2)',
      [orderId, sellerId]
    );
    
    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found or you are not authorized to update it' 
      });
    }
    
    // Check if order is already cancelled
    if (orderCheck.rows[0].status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This order has been cancelled and cannot be updated'
      });
    }
    
    // Update the order to verifying status
    const result = await query(
      `UPDATE orders 
       SET status = 'verifying', completed_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND (seller_id = $2 OR freelancer_id = $2)
       RETURNING *`,
      [orderId, sellerId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Could not update order status' });
    }
    
    // Success - return the updated order
    res.json({ success: true, order: result.rows[0] });
  } catch (error) {
    console.error('Error completing order:', error);
    res.status(500).json({ success: false, message: 'Server error completing order' });
  }
});
