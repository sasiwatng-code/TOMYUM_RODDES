// Service worker: ใช้งานออฟไลน์ + อัปเดตอัตโนมัติ (เปลี่ยน V ทุกครั้งที่แก้ไฟล์แอป)
const V = 'tomyum-v11';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  // ไม่แตะคำขอไป Google Apps Script
  if (u.hostname === 'script.google.com' || u.hostname.endsWith('googleusercontent.com')) return;
  // หน้าแอป: ลองโหลดใหม่ก่อน ถ้าออฟไลน์ใช้ที่เก็บไว้
  if (r.mode === 'navigate') {
    e.respondWith(
      fetch(r).then(res => { const cp = res.clone(); caches.open(V).then(c => c.put('index.html', cp)); return res; })
        .catch(() => caches.match('index.html'))
    );
    return;
  }
  // ไฟล์อื่น (ไอคอน ฟอนต์): ใช้ที่เก็บไว้ก่อน แล้วเก็บเพิ่มตอนมีเน็ต
  e.respondWith(
    caches.match(r).then(m => m || fetch(r).then(res => {
      if (res.ok || res.type === 'opaque') { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); }
      return res;
    }).catch(() => m))
  );
});
