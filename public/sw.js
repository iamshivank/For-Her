const CACHE_NAME = 'cyclewise-v1.0.0'
const STATIC_CACHE = 'cyclewise-static-v1.0.0'
const DYNAMIC_CACHE = 'cyclewise-dynamic-v1.0.0'

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/offline.html'
]

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static files')
        return cache.addAll(STATIC_FILES)
      })
      .then(() => {
        console.log('Service Worker: Installed successfully')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker: Activated successfully')
        return self.clients.claim()
      })
  )
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }
  
  // Skip chrome-extension requests
  if (url.protocol === 'chrome-extension:') {
    return
  }
  
  // Handle navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache successful responses
          if (response.ok) {
            const responseClone = response.clone()
            caches.open(DYNAMIC_CACHE)
              .then((cache) => cache.put(request, responseClone))
          }
          return response
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse
              }
              // Return offline page if available
              return caches.match('/offline.html')
            })
        })
    )
    return
  }
  
  // Handle static assets
  if (url.pathname.startsWith('/_next/static/') || 
      url.pathname.startsWith('/static/') ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.jpg') ||
      url.pathname.endsWith('.svg')) {
    
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }
          
          return fetch(request)
            .then((response) => {
              if (response.ok) {
                const responseClone = response.clone()
                caches.open(STATIC_CACHE)
                  .then((cache) => cache.put(request, responseClone))
              }
              return response
            })
        })
    )
    return
  }
  
  // Handle API requests and other resources
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Don't cache API errors or non-2xx responses
        if (!response.ok) {
          return response
        }
        
        // Cache successful API responses temporarily
        const responseClone = response.clone()
        caches.open(DYNAMIC_CACHE)
          .then((cache) => cache.put(request, responseClone))
        
        return response
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(request)
      })
  )
})

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag)
  
  if (event.tag === 'period-log-sync') {
    event.waitUntil(syncPeriodLogs())
  } else if (event.tag === 'symptom-log-sync') {
    event.waitUntil(syncSymptomLogs())
  }
})

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received', event)
  
  if (!event.data) {
    return
  }
  
  const data = event.data.json()
  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/icon-96x96.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'open',
        title: 'Open App',
        icon: '/icon-96x96.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icon-96x96.png'
      }
    ],
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
    tag: data.tag || 'cyclewise-notification'
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event)
  
  event.notification.close()
  
  if (event.action === 'dismiss') {
    return
  }
  
  const urlToOpen = event.notification.data?.url || '/'
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if the app is already open
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus()
          }
        }
        
        // Open new window/tab
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen)
        }
      })
  )
})

// Message handling from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        )
      })
    )
  }
})

// Helper functions for background sync
async function syncPeriodLogs() {
  try {
    // Get pending period logs from IndexedDB
    // This would integrate with the Dexie database
    console.log('Service Worker: Syncing period logs...')
    // Implementation would go here
  } catch (error) {
    console.error('Service Worker: Failed to sync period logs', error)
    throw error
  }
}

async function syncSymptomLogs() {
  try {
    // Get pending symptom logs from IndexedDB
    console.log('Service Worker: Syncing symptom logs...')
    // Implementation would go here
  } catch (error) {
    console.error('Service Worker: Failed to sync symptom logs', error)
    throw error
  }
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('Service Worker: Periodic sync triggered', event.tag)
  
  if (event.tag === 'daily-reminder-check') {
    event.waitUntil(checkDailyReminders())
  }
})

async function checkDailyReminders() {
  try {
    console.log('Service Worker: Checking daily reminders...')
    // Implementation for checking and triggering reminders
  } catch (error) {
    console.error('Service Worker: Failed to check reminders', error)
  }
}
