const CACHE_NAME = 'ptit-ange-decor-v1';

// الملفات اللي نحبو نخبيوها في المتصفح
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/logo.png'
];

// 1. وقت تشغيل التطبيقة لأول مرة: نخبّيو الديكور
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('تم حفظ الديكور بنجاح 📦');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// 2. وقت الاستعمال: نراقبو الإنترنيت
self.addEventListener('fetch', event => {
    // نتجاوزو طلبات فايربيس (باش ما نخبوش البيانات القديمة متاع التلامذة والفلوس)
    if (event.request.url.includes('firebase')) return;

    event.respondWith(
        // نجربو نجيبو النسخة الجديدة من الإنترنيت
        fetch(event.request).catch(() => {
            // إذا قصت الإنترنيت، نخرجو الديكور المخبي (لا لصفحة الديناصور 🦖)
            return caches.match(event.request).then(response => {
                return response || caches.match('/index.html');
            });
        })
    );
});