const CACHE_NAME = 'storehub-shell-v1';
const APP_SHELL = ['./', './index.html', './manifest.json', './storehub-icon.svg', './storehub-icon-192.png', './storehub-icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // หน้าเว็บและไฟล์ภายใน: ใช้เครือข่ายก่อน แล้ว fallback เป็น cache เมื่อออฟไลน์
  if (url.origin === self.location.origin && request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
      return response;
    }).catch(() => caches.match(request).then(cached => cached || caches.match('./index.html'))));
    return;
  }

  // ไฟล์ประกอบจาก CDN/Google Fonts: เก็บ response ไว้หลังโหลดสำเร็จ เพื่อให้เรียกใช้ซ้ำตอนออฟไลน์
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    if (response && (response.ok || response.type === 'opaque')) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
    }
    return response;
  })));
});
