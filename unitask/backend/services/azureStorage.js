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
    // We won't try to create the container every time,
    // assume it already exists from deployment setup
    console.log(`Using existing container "${containerName}" for uploads`);
    
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
 * Check if the container exists (but don't try to create it)
 * @returns {Promise<Boolean>} - True if container exists
 */
async function checkContainerExists() {
  try {
    console.log(`Checking if container "${containerName}" exists...`);
    
    // List containers and check if our container is in the list
    const containersList = [];
    
    // List containers in the account
    let iter = blobServiceClient.listContainers();
    let containerItem = await iter.next();
    
    while (!containerItem.done) {
      containersList.push(containerItem.value.name);
      containerItem = await iter.next();
    }
    
    const containerExists = containersList.includes(containerName);
    
    if (containerExists) {
      console.log(`Container "${containerName}" exists and is ready for use`);
    } else {
      console.log(`Container "${containerName}" does not exist. Please create it in the Azure portal`);
    }
    
    return containerExists;
  } catch (error) {
    console.error('Error checking container:', error);
    // Even if there's an error checking, we'll try to use the container anyway
    return true;
  }
}

// Check container on service initialization (no need to create it)
checkContainerExists()
  .then(() => console.log('Azure Blob Storage service initialized'))
  .catch(err => console.error('Failed to initialize Azure Blob Storage service:', err));

module.exports = {
  uploadToAzure,
  deleteFromAzure
};
