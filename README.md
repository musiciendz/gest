# إدارة روضة P'tit Ange

تطبيقة ويب (ملف واحد `index.html`) لإدارة الروضة: الأطفال، الخلاص، الفريق، النقل، المطبخ، وبوابات الأولياء والسواق والتلفاز والأنيسات.

- **المعطيات:** Firebase Realtime Database (مشروع `ptit-ange-admin`)، كل شي تحت `GestionPetitAnge/`.
- **الدخول:** Firebase Auth. المدير معرّف بالإيميل، والأدوار الأخرى حسب العقدة اللي فيها الـ uid (`parents`، `drivers`، `tvs`، `caterers`، `anissas`).
- **النشر:** `firebase deploy --only hosting` للموقع، و `firebase deploy --only database` للقواعد (الملفات في `tests/` و `rules/` ما تتنشرش).

## قواعد الداتابيز
`database.rules.json` يتولّد من `rules/build-rules.js` (القواعد ما فيهاش دوال، لذا الشروط مكتوبة مرّة وحدة في السكريبت). بعد أي تبديل: `node rules/build-rules.js`.
- حساب Firebase Auth ما عندوش سجلّ دور (`parents`، `drivers`، `tvs`، `caterers`، `anissas`) ما يقرا و ما يكتب شي، حتى لو عمل حساب بروحو.
- سجلّات الحسابات (فيها كلمات السر) كل واحد يقرا سجلّو برك.
- `loginIndex` يتقرا قبل الدخول، فيه كان hash الإيميل و الدور.

## ملفات ناقصة من الريبو
`index.html` يستعمل `manifest.json` و`icon-192.png` و`apple-touch-icon.png` و`audio/list.json`، وهاذم موش موجودين هنا. لازم يتزادو قبل أي نشر من الريبو، وإلا يتفسخو من الموقع.

## الاختبارات
```
npm i playwright && npx playwright install chromium
node tests/xss-check.js
```
يحلّ التطبيقة بـ Firebase وهمي (`tests/fake-firebase.js`) ويثبّت إلّي النص اللي يكتبو الأولياء ما يتنفّذش كـ كود في شاشات الإدارة.

القواعد (يلزم Java):
```
npm i firebase-tools @firebase/rules-unit-testing firebase playwright
npm i --prefix /tmp/fb8 firebase@8.10.1
FIREBASE8_DIR=/tmp/fb8/node_modules/firebase npx firebase emulators:exec --only database \
  "node rules/rules.test.js && node tests/roles-check.js"
```
- `rules/rules.test.js`: 33 حالة (شكون يقرا/يكتب شنوّة).
- `tests/roles-check.js`: يحلّ التطبيقة بالأدوار الستة على القواعد و يثبّت إلّي كل دور يوصل لواجهتو بلا حتى رفض.
