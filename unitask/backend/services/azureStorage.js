const { BlobServiceClient, StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions } = require('@azure/storage-blob');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// Azure Storage configuration
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'userimages';
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;

// Check if Azure Storage is properly configured
const isAzureConfigured = !!(connectionString && accountName && accountKey);

let blobServiceClient;
let containerClient;

// Local storage fallback for development
const LOCAL_STORAGE_DIR = path.join(__dirname, '../uploads');

// Ensure local storage directory exists
if (!isAzureConfigured) {
  console.warn('⚠️ Azure Storage not configured. Using local filesystem storage instead.');
  if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
    try {
      fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
      console.log(`Created local storage directory: ${LOCAL_STORAGE_DIR}`);
    } catch (err) {
      console.error(`Failed to create local storage directory: ${err.message}`);
    }
  }
} else {
  try {
    // Create BlobServiceClient
    blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    // Get a reference to the container
    containerClient = blobServiceClient.getContainerClient(containerName);
    console.log('Azure Blob Storage service initialized');
  } catch (error) {
    console.error('Failed to initialize Azure Blob Storage service:', error);
    console.warn('⚠️ Falling back to local filesystem storage');
  }
}

/**
 * Generate a SAS token for a blob with read permissions
 * @param {String} blobName - Name of the blob
 * @returns {String} - SAS token
 */
function generateSasToken(blobName) {
  if (!isAzureConfigured) return '';
  
  try {
    // Create a StorageSharedKeyCredential object
    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
    
    // Create a SAS token that expires in 7 days
    const expiryTime = new Date();
    expiryTime.setDate(expiryTime.getDate() + 7);
    
    const sasOptions = {
      containerName,
      blobName,
      permissions: BlobSASPermissions.parse("r"), // Read permission
      startsOn: new Date(),
      expiresOn: expiryTime,
    };
    
    // Generate SAS token
    const sasToken = generateBlobSASQueryParameters(sasOptions, sharedKeyCredential).toString();
    return sasToken;
  } catch (error) {
    console.error('Error generating SAS token:', error);
    return '';
  }
}

/**
 * Upload a file to storage (Azure or local filesystem)
 * @param {Buffer} fileBuffer - The file data as a buffer
 * @param {String} originalFilename - Original filename 
 * @param {String} contentType - MIME type of the file
 * @returns {Promise<Object>} - URL and info of the uploaded file
 */
async function uploadToAzure(fileBuffer, originalFilename, contentType) {
  try {
    // Generate a unique name for the file
    const extension = originalFilename.split('.').pop();
    const blobName = `${uuidv4()}.${extension}`;
    
    // If Azure is not configured, use local filesystem
    if (!isAzureConfigured || !containerClient) {
      return await uploadToLocalStorage(fileBuffer, blobName, contentType);
    }
    
    // Use Azure Blob Storage
    // Get a block blob client
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    // Set blob HTTP headers
    const options = {
      blobHTTPHeaders: {
        blobContentType: contentType
      }
    };
    
    // Upload file buffer
    await blockBlobClient.upload(fileBuffer, fileBuffer.length, options);
    console.log(`File "${originalFilename}" uploaded to Azure as ${blobName}`);
    
    // Generate SAS token for access
    const sasToken = generateSasToken(blobName);
    
    // Return the URL of the blob with SAS token
    return {
      url: `${blockBlobClient.url}?${sasToken}`,
      blobName,
      blobUrl: blockBlobClient.url,
      sasToken,
      storage: 'azure'
    };
  } catch (error) {
    console.error('Error uploading to storage:', error);
    throw new Error(`Failed to upload: ${error.message}`);
  }
}

/**
 * Upload file to local filesystem (fallback when Azure is not configured)
 * @param {Buffer} fileBuffer - File data buffer
 * @param {String} filename - Generated filename
 * @param {String} contentType - MIME type
 * @returns {Promise<Object>} - Local file information
 */
async function uploadToLocalStorage(fileBuffer, filename, contentType) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(LOCAL_STORAGE_DIR, filename);
    
    fs.writeFile(filePath, fileBuffer, (err) => {
      if (err) {
        console.error('Error saving file locally:', err);
        reject(err);
        return;
      }
      
      console.log(`File saved locally as: ${filePath}`);
      
      // Create a URL using relative path for serving from Express
      const url = `/uploads/${filename}`;
      resolve({
        url,
        filename,
        localPath: filePath,
        storage: 'local'
      });
    });
  });
}

/**
 * Delete a file from storage (Azure or local filesystem)
 * @param {String} fileUrl - The URL or path of the file to delete
 * @returns {Promise<Boolean>} - True if deletion was successful
 */
async function deleteFromAzure(fileUrl) {
  try {
    // For local storage URLs
    if (fileUrl.startsWith('/uploads/')) {
      return await deleteFromLocalStorage(fileUrl);
    }
    
    // For Azure storage
    if (!isAzureConfigured || !containerClient) {
      console.warn('Cannot delete from Azure: not configured');
      return false;
    }
    
    // Extract blob name from URL (remove SAS token if present)
    const urlObj = new URL(fileUrl);
    const pathParts = urlObj.pathname.split('/');
    const blobName = pathParts[pathParts.length - 1];
    
    // Get a block blob client
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    // Check if blob exists before deleting
    const exists = await blockBlobClient.exists();
    if (!exists) {
      console.log(`Blob "${blobName}" does not exist, skipping delete`);
      return true;
    }
    
    // Delete the blob
    await blockBlobClient.delete();
    console.log(`Blob "${blobName}" deleted successfully`);
    return true;
  } catch (error) {
    console.error('Error deleting from storage:', error);
    return false;
  }
}

/**
 * Delete file from local filesystem
 * @param {String} fileUrl - The URL of the locally stored file
 * @returns {Promise<Boolean>} - True if deletion was successful
 */
async function deleteFromLocalStorage(fileUrl) {
  return new Promise((resolve) => {
    const filename = fileUrl.split('/').pop();
    const filePath = path.join(LOCAL_STORAGE_DIR, filename);
    
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error('Error deleting local file:', err);
        resolve(false);
        return;
      }
      
      console.log(`Local file deleted: ${filePath}`);
      resolve(true);
    });
  });
}

module.exports = {
  uploadToAzure,
  deleteFromAzure,
  isAzureConfigured
};
