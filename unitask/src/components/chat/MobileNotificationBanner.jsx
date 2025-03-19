import { useState, useEffect } from 'react';
import { Bell, X, ArrowRight } from 'lucide-react';
import { getNotificationPermission, requestNotificationPermission } from '../../services/notificationService';

/**
 * Special notification banner optimized for mobile devices
 */
const MobileNotificationBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [permission, setPermission] = useState(getNotificationPermission());
  
  useEffect(() => {
    // Only show on mobile devices when permission isn't granted
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const hasSeenMobileBanner = localStorage.getItem('mobile-notification-banner-seen');
    
    if (isMobile && permission !== 'granted' && permission !== 'unsupported' && !hasSeenMobileBanner) {
      // Delay showing to avoid banner fatigue
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [permission]);
  
  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setPermission(granted ? 'granted' : 'denied');
    if (granted) {
      setShowBanner(false);
      localStorage.setItem('mobile-notification-banner-seen', 'true');
    }
  };
  
  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('mobile-notification-banner-seen', 'true');
  };
  
  if (!showBanner) return null;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-purple-900/90 to-pink-900/90 backdrop-blur-md p-4 z-50 shadow-lg animate-slide-up">
      <div className="flex items-center gap-3">
        <div className="bg-white/10 p-2 rounded-full">
          <Bell className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-white">Get notified on mobile</h3>
          <p className="text-sm text-white/80">Never miss a message when you're on the go</p>
        </div>
        <button 
          onClick={handleRequestPermission}
          className="bg-white p-2 rounded-full"
        >
          <ArrowRight className="w-5 h-5 text-purple-900" />
        </button>
        <button 
          onClick={handleDismiss}
          className="text-white/70 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default MobileNotificationBanner;
