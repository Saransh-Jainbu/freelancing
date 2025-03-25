import { useState, useRef, useEffect } from 'react';
import { Bell, BellOff, Check, AlertCircle, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

const NotificationBell = () => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead,
    notificationPermission,
    pushEnabled,
    subscribeToPush,
    unsubscribeFromPush,
    isSubscribing
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const notificationRef = useRef(null);
  const navigate = useNavigate();
  
  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowSettings(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleNotificationClick = (notification) => {
    setIsOpen(false);
    markAsRead(notification.id);
    
    if (notification.reference_type === 'conversation') {
      navigate(`/chat/${notification.reference_id}`);
    } else if (notification.reference_type === 'order') {
      navigate(`/orders/${notification.reference_id}`);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message':
        return '💬';
      case 'order':
        return '🛒';
      case 'order_status':
        return '📦';
      default:
        return '🔔';
    }
  };

  const handleTogglePush = async () => {
    if (pushEnabled) {
      await unsubscribeFromPush();
    } else {
      await subscribeToPush();
    }
  };
  
  return (
    <div className="relative" ref={notificationRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setShowSettings(false);
        }}
        className="relative p-2 rounded-full hover:bg-white/5"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && !showSettings && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-900 border border-white/10 rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="p-3 border-b border-white/10 flex justify-between items-center">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-purple-400 hover:text-purple-300"
                >
                  Mark all as read
                </button>
              )}
              <button
                onClick={() => {
                  setShowSettings(true);
                }}
                className="text-xs text-purple-400 hover:text-purple-300"
              >
                Settings
              </button>
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full text-left p-3 hover:bg-white/5 border-b border-white/5 transition-colors flex ${
                    !notification.is_read ? 'bg-purple-500/10' : ''
                  }`}
                >
                  <div className="mr-3 text-xl">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{notification.title}</p>
                    <p className="text-sm text-gray-400 truncate">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-gray-400">
                No notifications
              </div>
            )}
          </div>
        </div>
      )}

      {isOpen && showSettings && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-900 border border-white/10 rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="p-3 border-b border-white/10 flex justify-between items-center">
            <button
              onClick={() => setShowSettings(false)}
              className="text-sm hover:text-purple-300"
            >
              &larr; Back
            </button>
            <h3 className="font-semibold">Notification Settings</h3>
          </div>
          
          <div className="p-4 space-y-4">
            <div className="flex flex-col gap-2">
              <h4 className="font-medium">Push Notifications</h4>
              <p className="text-sm text-gray-400">
                Get notified even when the browser is closed
              </p>
              
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm">
                  {pushEnabled ? 'Enabled' : 'Disabled'}
                </span>
                <button
                  onClick={handleTogglePush}
                  disabled={isSubscribing}
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg flex items-center gap-2"
                >
                  {isSubscribing ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : pushEnabled ? (
                    <>
                      <BellOff className="w-4 h-4" />
                      Disable
                    </>
                  ) : (
                    <>
                      <Bell className="w-4 h-4" />
                      Enable
                    </>
                  )}
                </button>
              </div>
              
              {notificationPermission === 'denied' && (
                <div className="mt-2 p-3 bg-red-500/10 text-red-400 rounded-lg flex items-start gap-2 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <div>
                    Notifications are blocked in your browser. Please update your browser settings to enable notifications.
                  </div>
                </div>
              )}
              
              {pushEnabled && (
                <div className="mt-2 p-3 bg-green-500/10 text-green-400 rounded-lg flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 flex-shrink-0" />
                  <div>
                    You will now receive push notifications for orders and messages, even when the browser is closed.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
