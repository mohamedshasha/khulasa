// خلاصة — عامل الخدمة: يجعل التطبيق قابلاً للتثبيت ويعمل دون إنترنت بعد أول زيارة
const CACHE = 'khulasa-v3';
const CORE = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png', './icons/favicon.png', './icons/brand-mark.png'];
// المكتبات الاختيارية (قارئ PDF والتعرف على النص) وبيانات اللغات: تُخزَّن عند أول استخدام
const CDN = /^https:\/\/(cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|tessdata\.projectnaptha\.com)\//;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return; // طلبات الترجمة والذكاء الاصطناعي لا تُخزَّن أبداً
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    // ملفات التطبيق: الشبكة أولاً (لتصل التحديثات)، ثم النسخة المخزنة عند انقطاع الإنترنت
    e.respondWith(fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
    return;
  }
  if (CDN.test(req.url)) {
    // المكتبات بإصدار ثابت: المخزن أولاً
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => {
      if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    })));
  }
});
