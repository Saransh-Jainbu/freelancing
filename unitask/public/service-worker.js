// UniTask Service Worker for background notifications

const CACHE_NAME = 'unitask-cache-v1';
const OFFLINE_URL = '/offline.html';

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Caching app shell');
      return cache.addAll([
        '/',
        '/index.html',
        '/offline.html',
        '/favicon.ico',
        '/notification-badge.png',
        '/notification-sound.mp3'
      ]);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});

// Fetch event - network first, then cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            } else if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            return caches.match('/offline.html');
          });
      })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push Received');
  
  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    data = {
      title: "New Message",
      body: event.data ? event.data.text() : "You have a new notification",
      icon: "/favicon.ico",
      badge: "/notification-badge.png",
      tag: "unitask-notification",
      data: {
        url: "/chat"
      }
    };
  }
  
  const options = {
    body: data.body || "New message received",
    icon: data.icon || "/favicon.ico",
    badge: data.badge || "/notification-badge.png",
    tag: data.tag || "unitask-notification",
    data: data.data || { url: "/chat" },
    vibrate: [100, 50, 100],
    silent: false,
    requireInteraction: data.requireInteraction || false
  };
  
  event.waitUntil(self.registration.showNotification(data.title || "UniTask", options));
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification click received');
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/chat';
  
  event.waitUntil(
    self.clients.matchAll({type: 'window', includeUncontrolled: true})
      .then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        // If no window/tab is open or doesn't match our URL, open a new one
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});
