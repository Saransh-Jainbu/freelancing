/**
 * Health check routes for monitoring system status
 */

const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { BlobServiceClient } = require('@azure/storage-blob');

// Get database pool from the server
const getPool = () => {
  try {
    // Try to access the pool created in server.js
    return require('../server').pool;
  } catch (error) {
    // Fallback: create a new pool
    return new Pool({
      connectionString: process.env.DATABASE_URL
    });
  }
};

/**
 * Basic health check endpoint
 */
router.get('/', (req, res) => {
  const status = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: process.env.DATABASE_URL ? 'connected' : 'not connected',
      storage: process.env.AZURE_STORAGE_CONNECTION_STRING ? 'configured' : 'not configured',
      notifications: process.env.VAPID_PUBLIC_KEY ? 'configured' : 'not configured'
    }
  };
  
  res.json(status);
});

/**
 * Check database connection
 */
router.get('/db', async (req, res) => {
  const pool = getPool();
  
  try {
    const result = await pool.query('SELECT NOW() as time');
    res.json({
      status: 'ok',
      message: 'Database connection successful',
      timestamp: result.rows[0].time
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message
    });
  }
});

/**
 * Check Azure Blob Storage connection
 */
router.get('/storage', async (req, res) => {
  try {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'userimages';
    
    if (!connectionString) {
      return res.status(503).json({
        status: 'error',
        message: 'Azure Storage connection string not configured'
      });
    }
    
    // Create a BlobServiceClient
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    // Check if container exists
    const exists = await containerClient.exists();
    
    if (exists) {
      res.json({
        status: 'ok',
        message: `Azure Blob Storage connected, container '${containerName}' exists`,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'error',
        message: `Azure Blob Storage connected, but container '${containerName}' does not exist`,
      });
    }
  } catch (error) {
    console.error('Azure Storage health check failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Azure Storage connection failed',
      error: error.message
    });
  }
});

/**
 * Get system information
 */
router.get('/system', (req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    node_version: process.version,
    uptime: process.uptime(),
    memory_usage: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

/**
 * Check notification system
 */
router.get('/notifications', (req, res) => {
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  
  if (vapidPublicKey && vapidPrivateKey) {
    res.json({
      status: 'ok',
      message: 'Web Push notification system is configured',
      vapid_public_key_available: true,
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(503).json({
      status: 'error',
      message: 'Web Push notification system is not properly configured',
      missing_keys: {
        vapid_public_key: !vapidPublicKey,
        vapid_private_key: !vapidPrivateKey
      }
    });
  }
});

module.exports = router;
