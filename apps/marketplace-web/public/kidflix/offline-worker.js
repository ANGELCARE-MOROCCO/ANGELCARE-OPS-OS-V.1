/* Scope is /kidflix/. No APIs, admin documents, advertising or automatic media caching. */
const NAME='kidflix-offline-v3';
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{const u=new URL(event.request.url);if(event.request.method!=='GET'||u.origin!==self.location.origin||(!u.pathname.startsWith('/kidflix/offline-file/')&&u.pathname!=='/kidflix/offline.html'&&u.pathname!=='/kidflix/kidflix-official.png'))return;
 event.respondWith((async()=>{const cache=await caches.open(NAME),cached=await cache.match(u.pathname);if(cached&&Number(cached.headers.get('X-Kidflix-Expires')||Date.now()+1)>Date.now())return cached;if(cached)await cache.delete(u.pathname);return fetch(event.request);})());});
