const express = require('express');
const router = express.Router();

// Basic health check endpoint
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Azure Storage health check
router.get('/azure', async (req, res) => {
  try {
    // Conditionally check Azure Storage
    let azureStorage;
    try {
      azureStorage = require('../services/azureStorage');
    } catch (error) {
      return res.status(503).json({
        status: 'unavailable',
        service: 'azure_storage',
        error: 'Azure Storage module could not be loaded'
      });
    }
    
    // Test container access
    try {
      // Just try to access the container info without actually uploading anything
      const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'userimages';
      const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
      const testBlobUrl = `https://${accountName}.blob.core.windows.net/${containerName}`;
      
      // Fetch container metadata (just to test connectivity)
      const response = await fetch(testBlobUrl, {
        method: 'HEAD'
      });
      
      if (response.status === 200 || response.status === 404) {
        // 404 is fine as the container might not exist yet
        // 200 means it exists and we have public access
        return res.json({
          status: 'ok',
          service: 'azure_storage',
          message: 'Azure Storage connection successful',
          containerName,
          accountName
        });
      } else {
        return res.status(503).json({
          status: 'error',
          service: 'azure_storage',
          statusCode: response.status,
          message: 'Azure Storage returned an unexpected status'
        });
      }
    } catch (error) {
      return res.status(503).json({
        status: 'error',
        service: 'azure_storage',
        error: error.message || 'Unknown error accessing Azure Storage',
        code: error.code
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Unknown error checking Azure health'
    });
  }
});

module.exports = router;
