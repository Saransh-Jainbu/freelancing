// This is the main API entry point for Vercel serverless functions
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Return API information for the root endpoint
  res.status(200).json({
    message: 'UniTask API is running',
    version: '1.0.0',
    endpoints: ['/api/auth/login', '/api/auth/register']
  });
}
