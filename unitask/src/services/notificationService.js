import { API_URL } from '../constants';

// Check if browser supports notifications and service worker
const canUseNotifications = () => {
  return "Notification" in window && "serviceWorker" in navigator;
};

// Register service worker
const registerServiceWorker = async () => {
  if (!canUseNotifications()) return false;
  
  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js');
    console.log('ServiceWorker registration successful with scope:', registration.scope);
    return registration;
  } catch (error) {
    console.error('ServiceWorker registration failed:', error);
    return false;
  }
};

// Check if permission is blocked (permission prompt has been ignored multiple times)
const isPermissionBlocked = async () => {
  if (!canUseNotifications()) return false;
  
  // First check the standard Notification.permission
  if (Notification.permission === 'denied') {
    return true;
  }
  
  // If permission is default (prompt), we need to check if it might be blocked
  if (Notification.permission === 'default') {
    try {
      // Try to request permission
      const result = await Promise.race([
        Notification.requestPermission(),
        // If no prompt appears after 300ms, it's likely blocked
        new Promise(resolve => setTimeout(() => resolve('no_prompt'), 300))
      ]);
      
      // If we got 'no_prompt' but permission is still default, the prompt is likely blocked
      return result === 'no_prompt' && Notification.permission === 'default';
    } catch (err) {
      // In some browsers, this error indicates the permission prompt is blocked
      return true;
    }
  }
  
  return false;
};

// Request notification permission
const requestNotificationPermission = async () => {
  if (!canUseNotifications()) return false;
  
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

// Get current notification permission
const getNotificationPermission = () => {
  if (!canUseNotifications()) return 'unsupported';
  return Notification.permission;
};

// Show notification
const showNotification = async (title, options = {}) => {
  if (!canUseNotifications() || Notification.permission !== 'granted') {
    console.log('Cannot show notification: permissions not granted or notifications not supported');
    return false;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    console.log('Showing notification:', title, options);
    await registration.showNotification(title, {
      icon: '/favicon.ico',
      badge: '/notification-badge.png',
      vibrate: [100, 50, 100],
      requireInteraction: true, // Make notification stay until user interacts
      ...options
    });
    return true;
  } catch (error) {
    console.error('Error showing notification:', error);
    return false;
  }
};

// Play notification sound with vibration for mobile devices
const playNotificationSound = () => {
  try {
    const audio = new Audio('/notification-sound.mp3');
    audio.volume = 0.5; // 50% volume
    
    // Play sound with user interaction requirement workaround
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        console.warn('Could not play notification sound (probably needs user interaction):', err);
        // We'll try again on next user interaction
        document.addEventListener('click', function playOnInteraction() {
          audio.play().catch(e => console.warn('Still could not play sound:', e));
          document.removeEventListener('click', playOnInteraction);
        }, { once: true });
      });
    }
    
    // Vibrate for mobile devices if supported
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  } catch (error) {
    console.warn('Error creating audio element:', error);
  }
};

// Show chat message notification with enhanced mobile support
const showChatNotification = async (message, sender, conversationId) => {
  console.log('Attempting to show chat notification:', {message, sender, conversationId});
  
  // If message is too long, truncate it for the notification
  const truncatedMessage = message.length > 100 ? message.substring(0, 97) + '...' : message;
  
  const title = `New message from ${sender.display_name}`;
  const options = {
    body: truncatedMessage, // Use the actual message as the notification body
    icon: sender.avatar_url || '/favicon.ico',
    badge: '/notification-badge.png',
    tag: `chat-${conversationId}`, // Replace older notifications from same conversation
    data: {
      url: `/chat/${conversationId}`,
      senderId: sender.id,
      message: message
    },
    requireInteraction: false, // Less annoying on mobile
    renotify: true, // Notify each time even if from same conversation
    silent: false, // Allow sound
    vibrate: [100, 50, 100] // Vibration pattern for mobile
  };
  
  // Always play sound and vibrate for new message notifications
  playNotificationSound();
  
  let notificationShown = false;
  
  // First try using the Notification API directly (works better in some browsers)
  if (Notification.permission === 'granted') {
    try {
      const notification = new Notification(title, {
        ...options,
        icon: options.icon || '/favicon.ico'
      });
      
      notification.onclick = () => {
        window.focus();
        notification.close();
        window.location.href = options.data.url;
      };
      
      notificationShown = true;
      console.log('Direct notification shown successfully');
    } catch (error) {
      console.error('Direct notification failed:', error);
    }
  }
  
  // If direct notification fails, try service worker notification
  if (!notificationShown) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, options);
      console.log('Service worker notification shown successfully');
      notificationShown = true;
    } catch (error) {
      console.error('Service worker notification failed:', error);
    }
  }
  
  // If both methods fail, show in-app notification
  if (!notificationShown) {
    showInAppNotification(title, options.body);
  }

  return notificationShown;
};

// Show an in-app notification for when system notifications fail
const showInAppNotification = (title, body) => {
  // Create or get notification container
  let container = document.getElementById('in-app-notification-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'in-app-notification-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      width: 300px;
      max-width: 80vw;
    `;
    document.body.appendChild(container);
  }
  
  // Create notification element
  const notification = document.createElement('div');
  notification.style.cssText = `
    background: rgba(30, 30, 30, 0.9);
    border-left: 4px solid #9333ea;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    padding: 12px;
    animation: slideIn 0.3s ease-out forwards;
    transition: all 0.3s ease;
    cursor: pointer;
  `;
  
  // Create title element
  const titleEl = document.createElement('div');
  titleEl.textContent = title;
  titleEl.style.cssText = 'font-weight: bold; margin-bottom: 5px;';
  
  // Create body element
  const bodyEl = document.createElement('div');
  bodyEl.textContent = body;
  bodyEl.style.cssText = 'font-size: 14px; color: rgba(255, 255, 255, 0.8);';
  
  // Add elements to notification
  notification.appendChild(titleEl);
  notification.appendChild(bodyEl);
  
  // Add to container
  container.appendChild(notification);
  
  // Handle click
  notification.addEventListener('click', () => {
    notification.style.opacity = '0';
    setTimeout(() => {
      container.removeChild(notification);
    }, 300);
  });
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      if (container.contains(notification)) {
        container.removeChild(notification);
      }
    }, 300);
  }, 5000);
  
  // Add CSS animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
};

export {
  canUseNotifications,
  registerServiceWorker,
  requestNotificationPermission,
  getNotificationPermission,
  isPermissionBlocked,
  showNotification,
  showChatNotification,
  playNotificationSound,
  showInAppNotification
};
