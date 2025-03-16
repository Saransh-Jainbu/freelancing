// Use relative import paths for serverless functions
import { query } from '../../db';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { email, password, displayName, university, location, dateOfBirth, contactNumber } = req.body;
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    // Start a transaction
    await query('BEGIN');
    
    try {
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
      
      throw error;
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
}
