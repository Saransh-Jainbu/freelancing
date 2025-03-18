/**
 * Script to generate VAPID keys for Web Push
 * Run with: node scripts/generateVapidKeys.js
 */

const webPush = require('web-push');
const fs = require('fs');
const path = require('path');

// Generate VAPID keys
const vapidKeys = webPush.generateVAPIDKeys();

console.log('Generated VAPID Keys:');
console.log('===================');
console.log(`Public Key: ${vapidKeys.publicKey}`);
console.log(`Private Key: ${vapidKeys.privateKey}`);
console.log('===================');

// Find the .env file
const envPath = path.resolve(__dirname, '../.env');

// Check if .env file exists
if (fs.existsSync(envPath)) {
  // Read the .env file
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Check if VAPID keys already exist
  const publicKeyExists = envContent.includes('VAPID_PUBLIC_KEY=');
  const privateKeyExists = envContent.includes('VAPID_PRIVATE_KEY=');
  
  // Replace existing keys or append new ones
  if (publicKeyExists) {
    envContent = envContent.replace(
      /VAPID_PUBLIC_KEY=.*\n/,
      `VAPID_PUBLIC_KEY=${vapidKeys.publicKey}\n`
    );
  } else {
    envContent += `\nVAPID_PUBLIC_KEY=${vapidKeys.publicKey}`;
  }
  
  if (privateKeyExists) {
    envContent = envContent.replace(
      /VAPID_PRIVATE_KEY=.*\n/,
      `VAPID_PRIVATE_KEY=${vapidKeys.privateKey}\n`
    );
  } else {
    envContent += `\nVAPID_PRIVATE_KEY=${vapidKeys.privateKey}`;
  }
  
  // Write the updated .env file
  fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf8');
  console.log(`Updated .env file with new VAPID keys at: ${envPath}`);
} else {
  // Create a new .env file with VAPID keys
  const envContent = `# VAPID keys for Web Push\nVAPID_PUBLIC_KEY=${vapidKeys.publicKey}\nVAPID_PRIVATE_KEY=${vapidKeys.privateKey}\n`;
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log(`Created .env file with VAPID keys at: ${envPath}`);
}

console.log('Remember to restart your server to apply these changes.');
