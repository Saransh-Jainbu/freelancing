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
5. Public access level: "Private" (no anonymous access)
6. Click "Create"

### 4. Get Your Access Keys
1. In your storage account, go to "Access keys" under "Security + networking"
2. Click "Show keys"
3. Copy the following information for your .env file:
   - Key 1 > Key
   - Connection string

### 5. Update Your Environment Variables
Add the following to your `.env` file:

```properties
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=unitaskstorage;AccountKey=your-key-here;EndpointSuffix=core.windows.net
AZURE_STORAGE_CONTAINER_NAME=userimages
AZURE_STORAGE_ACCOUNT_NAME=unitaskstorage
AZURE_STORAGE_ACCOUNT_KEY=your-key-here
```

## Security Considerations
- Never commit your Azure keys to Git repositories
- When deploying to Render.com, add these environment variables in your service settings
- Consider using Azure Key Vault for production deployments

## Troubleshooting
If you encounter issues:
1. Check that your connection string is correct
2. Verify the container has been created
3. Check service logs for specific error messages
4. Verify your Azure subscription is active
