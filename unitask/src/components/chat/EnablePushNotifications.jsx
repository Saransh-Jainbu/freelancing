import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { getNotificationPermission, requestNotificationPermission } from '../../services/notificationService';

const EnablePushNotifications = () => {
  const [permission, setPermission] = useState(getNotificationPermission());
  const [showBanner, setShowBanner] = useState(false);
  
  useEffect(() => {
    // Only show the banner if permission is not granted and not denied
    // Also don't show on first visit (let the system request handle it)
    const hasSeenBanner = localStorage.getItem('notification-banner-seen');
    
    if (permission !== 'granted' && permission !== 'unsupported' && hasSeenBanner) {
      setShowBanner(true);
    }
    
    // Mark banner as seen
    localStorage.setItem('notification-banner-seen', 'true');
  }, [permission]);
  
  const handleRequestPermission = async () => {
    const newPermission = await requestNotificationPermission();
    setPermission(newPermission ? 'granted' : 'denied');
    
    if (newPermission) {
      setShowBanner(false);
    }
  };
  
  if (!showBanner) return null;
  
  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 rounded-lg shadow-lg p-4 max-w-sm border border-gray-700 z-50 animate-fade-in">
      <div className="flex items-start">
        <div className="flex-shrink-0 bg-purple-600/20 p-2 rounded-full">
          <Bell className="w-5 h-5 text-purple-400" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-white">Enable notifications</h3>
          <p className="mt-1 text-sm text-gray-400">
            Get notified about new messages, even when you're not active on the site.
          </p>
          <div className="mt-3 flex space-x-3">
            <button 
              onClick={handleRequestPermission}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-md text-sm font-medium"
            >
              Enable
            </button>
            <button 
              onClick={() => setShowBanner(false)}
              className="text-gray-400 hover:text-white px-3 py-1 rounded-md text-sm font-medium"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnablePushNotifications;
