import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const NotificationBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const notificationsContext = useNotifications();
  
  // Handle case where context is not available yet
  if (!notificationsContext) return null;
  
  const { notificationPermission, pushEnabled, subscribeToPush, isSubscribing } = notificationsContext;
  
  // Show the banner when needed
  useEffect(() => {
    // Only show banner if:
    // 1. Notifications are not blocked by browser
    // 2. Push notifications aren't already enabled
    // 3. User has visited at least twice (using localStorage)
    
    const visitCount = parseInt(localStorage.getItem('visitCount') || '0');
    localStorage.setItem('visitCount', (visitCount + 1).toString());
    
    // Check if banner was dismissed in last 7 days
    const lastDismissed = localStorage.getItem('notificationBannerDismissed');
    const showAfterDismiss = !lastDismissed || (Date.now() - parseInt(lastDismissed)) > 7 * 24 * 60 * 60 * 1000;
    
    if (notificationPermission !== 'denied' && !pushEnabled && visitCount >= 2 && showAfterDismiss) {
      // Delay showing banner for better UX
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [notificationPermission, pushEnabled]);
  
  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('notificationBannerDismissed', Date.now().toString());
  };
  
  const handleEnable = async () => {
    try {
      await subscribeToPush();
      setShowBanner(false);
    } catch (error) {
      console.error('Failed to enable notifications:', error);
    }
  };
  
  if (!showBanner) return null;
  
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md">
      <div className="bg-gray-900 border border-purple-500/30 rounded-lg shadow-lg p-4 mx-4 animation-popup">
        <div className="flex items-start gap-3">
          <div className="bg-purple-500/20 p-2 rounded-full">
            <Bell className="w-5 h-5 text-purple-400" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-medium mb-1">Enable Notifications</h3>
            <p className="text-sm text-gray-400 mb-3">
              Stay updated on messages and orders even when your browser is closed.
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={handleEnable}
                disabled={isSubscribing}
                className={`px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1 ${
                  isSubscribing ? 'bg-gray-700 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-pink-600'
                }`}
              >
                {isSubscribing ? 'Enabling...' : 'Enable Notifications'}
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded text-sm"
              >
                Later
              </button>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="p-1 text-gray-500 hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationBanner;
