// Service Worker for Web Push Notifications

self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.message,
      icon: '/notification-icon.png',
      badge: '/badge-icon.png',
      data: {
        url: data.url
      },
      vibrate: [200, 100, 200],
      tag: data.tag || 'unitask-notification',
      requireInteraction: data.requireInteraction || false
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  // Open the target URL when notification is clicked
  if (event.notification.data && event.notification.data.url) {
    // Use clients.openWindow to open a new window or tab with the URL
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  } else {
    // If no specific URL, try to focus an existing window
    event.waitUntil(
      clients.matchAll({
        type: 'window'
      }).then(clientList => {
        if (clientList.length > 0) {
          // Focus the first client/window found
          return clientList[0].focus();
        }
        // If no client is found, open the home page
        return clients.openWindow('/');
      })
    );
  }
});
