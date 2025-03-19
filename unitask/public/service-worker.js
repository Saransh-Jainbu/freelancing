// UniTask Service Worker for background notifications

const CACHE_NAME = 'unitask-cache-v2'; // Increment cache version
const OFFLINE_URL = '/offline.html';

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  
  // Force activation immediately
  self.skipWaiting();
  
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

// Activate event - clean up old caches and take control immediately
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  
  // Take control of all clients immediately
  event.waitUntil(self.clients.claim());
  
  // Clean up old caches
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
});

// Fetch event - network first, then cache
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

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

// Push notification event - this handles incoming notifications when site is closed
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push Received:', event.data?.text());
  
  let data = {};
  try {
    data = event.data.json();
    console.log('[ServiceWorker] Push data:', data);
  } catch (e) {
    // If we couldn't parse JSON, use the raw text as the message body
    const rawText = event.data ? event.data.text() : "You have a new notification";
    console.log('[ServiceWorker] Raw push data:', rawText);
    
    data = {
      title: "New Message",
      body: rawText,
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
    requireInteraction: data.requireInteraction !== false, // Default to requiring interaction
    renotify: true // Always notify the user for new messages
  };
  
  console.log('[ServiceWorker] Showing notification with options:', options);
  event.waitUntil(self.registration.showNotification(data.title || "UniTask", options));
});

// Notification click event - opens the app when notification is clicked
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

// Listen for message from client
self.addEventListener('message', (event) => {
  console.log('[ServiceWorker] Received message:', event.data);
  
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
