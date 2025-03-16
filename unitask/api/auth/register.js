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
    console.log('Register request received:', JSON.stringify(req.body));
    
    const { email, password, displayName, university, location, dateOfBirth, contactNumber } = req.body;
    
    if (!email || !password || !displayName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }
    
    // Hash password - use a fixed salt rounds value for consistency
    const salt = await bcrypt.genSalt(10);
    console.log('Generated salt:', salt);
    
    const passwordHash = await bcrypt.hash(password, salt);
    console.log('Generated password hash:', passwordHash);
    
    // Start a transaction
    await query('BEGIN');
    
    try {
      // Insert user with properly quoted column names
      const userResult = await query(
        'INSERT INTO users (email, password_hash, display_name) VALUES ($1, $2, $3) RETURNING id, email, display_name',
        [email, passwordHash, displayName]
      );
      
      console.log('User inserted:', userResult.rows[0]);
      
      const userId = userResult.rows[0].id;
      
      // Create empty profile with better error handling
      try {
        await query(
          'INSERT INTO profiles (user_id, location) VALUES ($1, $2)',
          [userId, location || '']
        );
        console.log('Profile created for user ID:', userId);
      } catch (profileError) {
        console.error('Profile creation error:', profileError);
        // We'll still commit the transaction if only the profile insert fails
        // but we'll log the error
      }
      
      await query('COMMIT');
      
      // Return user data (without password)
      return res.status(201).json({ 
        success: true, 
        userId,
        user: {
          id: userId,
          email,
          display_name: displayName
        }
      });
    } catch (error) {
      await query('ROLLBACK');
      
      if (error.code === '23505') { // Unique violation
        console.log('Email already exists:', email);
        return res.status(400).json({ success: false, message: 'Email already exists' });
      }
      
      console.error('Database error during registration:', error);
      throw error;
    }
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during registration', 
      error: error.message,
      stack: error.stack
    });
  }
}
