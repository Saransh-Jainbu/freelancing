import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcryptjs';

// Initialize database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Helper function to execute queries
const query = async (text, params) => {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

export default async function handler(req, res) {
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }
  
  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Log incoming request for debugging
    console.log('Login request received:', req.body);
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }
    
    // Get user from database
    const userResult = await query(
      'SELECT id, email, password_hash, display_name FROM users WHERE email = $1',
      [email]
    );
    
    console.log('User query result:', userResult.rows);
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    const user = userResult.rows[0];
    
    // Debug logging
    console.log('Comparing password with hash for:', email);
    console.log('Password hash from DB:', user.password_hash);
    
    // Compare passwords - with proper error handling
    try {
      const isMatch = await bcrypt.compare(password, user.password_hash);
      
      console.log('Password match result:', isMatch);
      
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
    } catch (bcryptError) {
      console.error('bcrypt comparison error:', bcryptError);
      // If the hash is not in the correct format or there's another bcrypt error
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication error',
        debug: bcryptError.message
      });
    }
    
    // Don't return password hash to client
    const { password_hash, ...userData } = user;
    
    console.log('Login successful for user:', userData);
    
    res.status(200).json({ success: true, user: userData });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login',
      error: error.message 
    });
  }
}
