const { BlobServiceClient, StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions } = require('@azure/storage-blob');
const { v4: uuidv4 } = require('uuid');

// Azure Storage configuration
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'userimages';
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;

// Create BlobServiceClient
const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

// Get a reference to the container
const containerClient = blobServiceClient.getContainerClient(containerName);

/**
 * Generate a SAS token for a blob with read permissions
 * @param {String} blobName - Name of the blob
 * @returns {String} - SAS token
 */
function generateSasToken(blobName) {
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
}

/**
 * Upload a file to Azure Blob Storage
 * @param {Buffer} fileBuffer - The file data as a buffer
 * @param {String} originalFilename - Original filename 
 * @param {String} contentType - MIME type of the file
 * @returns {Promise<Object>} - URL and SAS token of the uploaded blob
 */
async function uploadToAzure(fileBuffer, originalFilename, contentType) {
  try {
    // Check if container exists, if not, create it
    await ensureContainerExists();
    
    // Generate a unique name for the blob
    const extension = originalFilename.split('.').pop();
    const blobName = `${uuidv4()}.${extension}`;
    
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
      sasToken
    };
  } catch (error) {
    console.error('Error uploading to Azure:', error);
    throw new Error(`Failed to upload to Azure: ${error.message}`);
  }
}

/**
 * Delete a file from Azure Blob Storage
 * @param {String} blobUrl - The URL of the blob to delete (can include SAS token)
 * @returns {Promise<Boolean>} - True if deletion was successful
 */
async function deleteFromAzure(blobUrl) {
  try {
    // Extract blob name from URL (remove SAS token if present)
    const urlObj = new URL(blobUrl);
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
    console.error('Error deleting from Azure:', error);
    throw new Error(`Failed to delete from Azure: ${error.message}`);
  }
}

/**
 * Ensure the blob container exists
 * @returns {Promise<void>}
 */
async function ensureContainerExists() {
  try {
    // Check if container exists - note that the exists() method may not be available
    // in all versions of the SDK, so we use a try-catch approach
    try {
      const containers = await blobServiceClient.listContainers();
      const containerExists = containers.some(container => container.name === containerName);
      
      if (!containerExists) {
        console.log(`Creating container "${containerName}"...`);
        await containerClient.create({ access: 'private' }); // Use private access for security
        console.log(`Container "${containerName}" created successfully`);
      }
    } catch (err) {
      // If container doesn't exist, create it
      console.log(`Attempting to create container "${containerName}"...`);
      await containerClient.create({ access: 'private' }); // Use private access for security
      console.log(`Container "${containerName}" created successfully`);
    }
  } catch (error) {
    console.error('Error ensuring container exists:', error);
    throw error;
  }
}

module.exports = {
  uploadToAzure,
  deleteFromAzure
};
