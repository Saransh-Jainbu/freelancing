import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContextValue';  // Updated import path
import { Loader, AlertCircle } from 'lucide-react';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithOAuth } = useAuth();
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processOAuthCallback = async () => {
      // Extract user data from URL parameter
      const searchParams = new URLSearchParams(location.search);
      const userData = searchParams.get('user');
      
      if (!userData) {
        console.error('No user data received from OAuth provider');
        setError('Authentication failed. No user data received.');
        setIsProcessing(false);
        setTimeout(() => navigate('/login?error=oauth_failed'), 3000);
        return;
      }
      
      try {
        // Parse user data
        const user = JSON.parse(decodeURIComponent(userData));
        console.log('Received OAuth user data:', user);
        
        // Set user in auth context
        await loginWithOAuth(user);
        
        // Redirect to dashboard
        navigate('/dashboard');
      } catch (error) {
        console.error('Error processing OAuth callback:', error);
        setError('Failed to process authentication response.');
        setIsProcessing(false);
        setTimeout(() => navigate('/login?error=oauth_processing_failed'), 3000);
      }
    };
    
    processOAuthCallback();
  }, [location, navigate, loginWithOAuth]);

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Authentication Error</h2>
        <p className="text-gray-400">{error}</p>
        <p className="text-gray-400 mt-4">Redirecting to login page...</p>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <Loader className="w-12 h-12 text-purple-500 animate-spin mb-4" />
        <h2 className="text-xl font-semibold mb-2">Logging you in...</h2>
        <p className="text-gray-400">Please wait while we complete the authentication process.</p>
      </div>
    );
  }

  return null;
};

export default OAuthCallback;
