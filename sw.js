const CACHE_NAME = 'task-manager-v5'; // Bump version to ensure update
const urlsToCache = [
  './',
  'index.html', // This is the login page now
  'dashboard.html', // This is the main app page
  'style.css',
  'script.js',
  'login.js',
  'supabase.js',
  'favicon.ico',
  'icons/icon-192x192.png',
  'icons/icon-512x512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  // Ignore non-GET requests to prevent caching POST, etc.
  if (event.request.method !== 'GET') {
    return; // Let the browser handle it
  }

  // Use Stale-While-Revalidate strategy for GET requests
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(response => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          // If we got a valid response, update the cache
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(err => {
          console.error('SW Fetch failed:', err);
          // If fetch fails (e.g., offline) and there's no cache, the browser will show its default error page.
        });

        // Return the cached response immediately, while the fetch happens in the background.
        return response || fetchPromise;
      });
    })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // Delete old caches
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
