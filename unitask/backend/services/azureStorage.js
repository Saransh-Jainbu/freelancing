const { BlobServiceClient, StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions } = require('@azure/storage-blob');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Azure Storage configuration
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'userimages';

// Create the shared key credential
const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);

// Create the BlobServiceClient instance
const blobServiceClient = new BlobServiceClient(
  `https://${accountName}.blob.core.windows.net`,
  sharedKeyCredential
);

// Helper function to ensure container exists
async function ensureContainerExists() {
  try {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    await containerClient.createIfNotExists({
      access: 'blob' // Set public access at container level
    });
    console.log(`Container ${containerName} has been created or already exists`);
    return containerClient;
  } catch (error) {
    console.error(`Error creating container: ${error.message}`);
    throw error;
  }
}

// Generate a SAS token for a blob
function generateSasToken(blobName) {
  const now = new Date();
  const expiryTime = new Date(now);
  expiryTime.setMinutes(expiryTime.getMinutes() + 60); // Token valid for 60 minutes

  const permissions = new BlobSASPermissions();
  permissions.read = true; // Only allow read access

  const sasToken = generateBlobSASQueryParameters({
    containerName,
    blobName,
    permissions,
    startsOn: now,
    expiresOn: expiryTime,
  }, sharedKeyCredential).toString();

  return sasToken;
}

// Upload file to Azure Blob Storage
async function uploadToAzure(buffer, originalName, contentType, skipContainerCreation = false) {
  try {
    console.log('[Azure] Starting upload process...');
    
    // Generate a unique filename
    const extension = originalName.split('.').pop();
    const blobName = `${uuidv4()}.${extension}`;
    
    // Ensure container exists (unless told to skip)
    let containerClient;
    if (!skipContainerCreation) {
      containerClient = await ensureContainerExists();
    } else {
      containerClient = blobServiceClient.getContainerClient(containerName);
    }
    
    // Get a blob client and upload the file
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    console.log(`[Azure] Uploading blob: ${blobName}`);
    
    const options = {
      blobHTTPHeaders: {
        blobContentType: contentType
      }
    };
    
    await blockBlobClient.upload(buffer, buffer.length, options);
    console.log(`[Azure] Blob ${blobName} uploaded successfully`);
    
    // Generate SAS token for the blob
    const sasToken = generateSasToken(blobName);
    const blobUrl = blockBlobClient.url;
    const url = `${blobUrl}?${sasToken}`;
    
    return {
      success: true,
      blobName,
      blobUrl,
      url
    };
  } catch (error) {
    console.error(`[Azure] Error in uploadToAzure: ${error.message}`);
    throw error;
  }
}

// Delete file from Azure Blob Storage
async function deleteFromAzure(blobUrl) {
  try {
    // Extract blob name from the URL
    const url = new URL(blobUrl);
    const pathSegments = url.pathname.split('/');
    const blobName = pathSegments[pathSegments.length - 1];
    
    if (!blobName) {
      throw new Error('Invalid blob URL, could not extract blob name');
    }
    
    console.log(`[Azure] Deleting blob: ${blobName}`);
    
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    await blockBlobClient.delete();
    console.log(`[Azure] Blob ${blobName} deleted successfully`);
    
    return { success: true };
  } catch (error) {
    console.error(`[Azure] Error in deleteFromAzure: ${error.message}`);
    throw error;
  }
}

module.exports = {
  uploadToAzure,
  deleteFromAzure
};
