import { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, Loader } from 'lucide-react';
import { getNotificationPermission, requestNotificationPermission, showNotification } from '../../services/notificationService';
import { subscribeToPushNotifications } from '../../api/notifications';
import { useAuth } from '../../context/AuthContextValue';

const EnablePushNotifications = () => {
  const { currentUser } = useAuth();
  const [permission, setPermission] = useState(getNotificationPermission());
  const [showBanner, setShowBanner] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  useEffect(() => {
    // Only show the banner if permission is not granted and not unsupported
    const hasSeenBanner = localStorage.getItem('notification-banner-seen');
    
    // Show banner if permission is not granted and browser supports notifications
    if (permission !== 'granted' && permission !== 'unsupported' && hasSeenBanner) {
      setShowBanner(true);
    }
    
    // Mark banner as seen after first visit
    localStorage.setItem('notification-banner-seen', 'true');
  }, [permission]);
  
  const handleRequestPermission = async () => {
    if (!currentUser) return;
    
    try {
      setIsLoading(true);
      
      // Step 1: Request browser permission
      const granted = await requestNotificationPermission();
      setPermission(granted ? 'granted' : 'denied');
      
      if (!granted) {
        setIsLoading(false);
        return;
      }
      
      // Step 2: Register for push notifications with our backend
      const subscribeSuccess = await subscribeToPushNotifications(currentUser.id);
      
      if (subscribeSuccess) {
        // Step 3: Show success state
        setIsSuccess(true);
        
        // Step 4: Send a test notification to confirm it works
        setTimeout(() => {
          showNotification('Notifications Enabled!', {
            body: 'You will now receive notifications for new messages.',
            requireInteraction: false
          });
          
          // Hide banner after a moment
          setTimeout(() => {
            setShowBanner(false);
          }, 3000);
        }, 1000);
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Don't show anything if permission is granted or banner should be hidden
  if (!showBanner || (!isSuccess && permission === 'granted')) return null;
  
  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 rounded-lg shadow-lg p-4 max-w-sm border border-gray-700 z-50 animate-fade-in">
      <div className="flex items-start">
        <div className="flex-shrink-0 bg-purple-600/20 p-2 rounded-full">
          {isSuccess ? (
            <CheckCircle className="w-5 h-5 text-green-400" />
          ) : (
            <Bell className="w-5 h-5 text-purple-400" />
          )}
        </div>
        <div className="ml-3 flex-1">
          <div className="flex justify-between">
            <h3 className="text-sm font-medium text-white">
              {isSuccess ? 'Notifications enabled!' : 'Enable notifications'}
            </h3>
            <button 
              onClick={() => setShowBanner(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {isSuccess ? (
            <p className="mt-1 text-sm text-gray-300">
              You'll now receive notifications when you get new messages.
            </p>
          ) : (
            <>
              <p className="mt-1 text-sm text-gray-400">
                Get notified about new messages, even when you're not active on the site.
              </p>
              
              <div className="mt-3 flex space-x-3">
                <button 
                  onClick={handleRequestPermission}
                  disabled={isLoading}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-md text-sm font-medium flex items-center"
                >
                  {isLoading ? (
                    <>
                      <Loader className="w-3 h-3 mr-2 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    'Enable'
                  )}
                </button>
                <button 
                  onClick={() => setShowBanner(false)}
                  className="text-gray-400 hover:text-white px-3 py-1 rounded-md text-sm font-medium"
                  disabled={isLoading}
                >
                  Dismiss
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnablePushNotifications;
