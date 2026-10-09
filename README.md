# إدارة روضة P'tit Ange

تطبيقة ويب (ملف واحد `index.html`) لإدارة الروضة: الأطفال، الخلاص، الفريق، النقل، المطبخ، وبوابات الأولياء والسواق والتلفاز والأنيسات.

- **المعطيات:** Firebase Realtime Database (مشروع `ptit-ange-admin`)، كل شي تحت `GestionPetitAnge/`.
- **الدخول:** Firebase Auth. المدير معرّف بالإيميل، والأدوار الأخرى حسب العقدة اللي فيها الـ uid (`parents`، `drivers`، `tvs`، `caterers`، `anissas`).
- **النشر:** `firebase deploy --only hosting` (الملفات في `tests/` ما تتنشرش).

## ملفات ناقصة من الريبو
`index.html` يستعمل `manifest.json` و`icon-192.png` و`apple-touch-icon.png` و`audio/list.json`، وهاذم موش موجودين هنا. لازم يتزادو قبل أي نشر من الريبو، وإلا يتفسخو من الموقع.

## الاختبارات
```
npm i playwright && npx playwright install chromium
node tests/xss-check.js
```
يحلّ التطبيقة بـ Firebase وهمي (`tests/fake-firebase.js`) ويثبّت إلّي النص اللي يكتبو الأولياء ما يتنفّذش كـ كود في شاشات الإدارة.
