# Azure Blob Storage Setup for UniTask

## Overview
UniTask uses Azure Blob Storage for all image storage. This document explains how to set up and configure your Azure account.

## Setup Steps

### 1. Create an Azure Account
If you don't already have one, create an account at [Azure Portal](https://portal.azure.com).

### 2. Create a Storage Account
1. In the Azure portal, search for "Storage accounts"
2. Click "Create storage account"
3. Fill in the required information:
   - Subscription: Your Azure subscription
   - Resource group: Create new or select existing
   - Storage account name: `unitaskstorage` (or choose your own unique name)
   - Region: Choose a region close to your users
   - Performance: Standard
   - Redundancy: Locally-redundant storage (LRS)

### 3. Create a Blob Container
1. Once your storage account is created, navigate to it
2. In the left menu, under "Data storage", click "Containers"
3. Click "+ Container"
4. Name: `userimages`
5. Public access level: "Private (no anonymous access)" 
   - Note: Our code will generate SAS tokens for secure access
6. Click "Create"

### 4. Enable CORS for Your Storage Account
1. In your storage account, navigate to "Resource sharing (CORS)" under "Settings"
2. Add a new CORS rule with these settings:
   - Allowed origins: * (or your specific domain)
   - Allowed methods: GET, PUT, POST, DELETE, HEAD
   - Allowed headers: *
   - Exposed headers: *
   - Max age: 86400

### 5. Get Your Access Keys
1. In your storage account, go to "Access keys" under "Security + networking"
2. Click "Show keys"
3. Copy the following information for your .env file:
   - Key 1 > Key (this is your AZURE_STORAGE_ACCOUNT_KEY)
   - Connection string (this is your AZURE_STORAGE_CONNECTION_STRING)

### 6. Update Your Environment Variables
Add the following to your `.env` file:

```properties
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=unitaskstorage;AccountKey=your-key-here;EndpointSuffix=core.windows.net
AZURE_STORAGE_CONTAINER_NAME=userimages
AZURE_STORAGE_ACCOUNT_NAME=unitaskstorage
AZURE_STORAGE_ACCOUNT_KEY=your-key-here
```

## Common Errors and Solutions

### "private is not a valid value for options.access"
If you see this error, it means the Azure SDK has changed its API. Our application now creates containers without specifying the access level parameter, which will default to private.

### "Mixed Content Warning"
If you see mixed content warnings, ensure all your API URLs are using HTTPS. The application is configured to use Azure Storage with SAS tokens to avoid this issue.

## Security Considerations
- The application generates Shared Access Signature (SAS) tokens for accessing private blobs
- These tokens expire after 7 days by default
- Never commit your Azure keys to Git repositories
- When deploying to Render.com, add these environment variables in your service settings

## Troubleshooting
If you encounter issues:
1. Check that your connection string and account key are correct
2. Verify the container has been created in your Azure account
3. Look for detailed error messages in the server logs
4. Make sure CORS is properly configured for your storage account
