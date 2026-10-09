// يجرّب database.rules.json في emulator متاع Firebase.
// التشغيل: npm i firebase-tools @firebase/rules-unit-testing firebase
//          npx firebase emulators:exec --only database "node rules/rules.test.js"
const fs = require('fs'), path = require('path');
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { ref, get, set } = require('firebase/database');

const P = 'GestionPetitAnge/';
(async () => {
  const env = await initializeTestEnvironment({
    projectId: 'demo-ptit-ange',
    database: { rules: fs.readFileSync(path.join(__dirname, '..', 'database.rules.json'), 'utf8'), host: '127.0.0.1', port: 9000 }
  });
  await env.withSecurityRulesDisabled(async c => {
    await set(ref(c.database(), 'GestionPetitAnge'), {
      students: { s1: { name: 'طفل', familyId: 'f1' } }, settings: { instName: 'x' },
      parents: { pUid: { email: 'p@ptitange.tn', password: 'x', familyId: 'f1' } },
      drivers: { dUid: { email: 'd@ptitange.tn', password: 'y' } },
      tvs: { tUid: { email: 't@ptitange.tn' } }, anissas: { aUid: { email: 'a@ptitange.tn' } },
      caterers: { cUid: { email: 'c@ptitange.tn' } },
      payments: { s1: { '2025-09': { amount: 1 } } }, loginIndex: { hx: { role: 'parent' } }
    });
  });
  const db = (uid, email) => (uid ? env.authenticatedContext(uid, { email }) : env.unauthenticatedContext()).database();
  const admin = db('admUid', 'musiciendz@gmail.com'), parent = db('pUid', 'p@ptitange.tn'), driver = db('dUid', 'd@ptitange.tn'),
        tv = db('tUid', 't@ptitange.tn'), anissa = db('aUid', 'a@ptitange.tn'), stranger = db('xUid', 'x@evil.com'), anon = db(null);
  let n = 0, bad = 0;
  async function check(label, ok, p) { n++; try { await (ok ? assertSucceeds(p) : assertFails(p)); } catch (e) { bad++; console.log('❌', label); } }
  const R = (d, p) => get(ref(d, P + p)), W = (d, p, v) => set(ref(d, P + p), v);

  // حساب تعمل من برّا (Auth بلا دور): ما يقرا و ما يكتب شي
  for (const p of ['students', 'settings', 'medications', 'absences', 'payments/s1', 'appointments', 'adminNotifs'])
    await check('stranger read ' + p, false, R(stranger, p));
  await check('stranger write appointments', false, W(stranger, 'appointments/z', { reason: 'x' }));
  await check('stranger write drivers', false, W(stranger, 'drivers/xUid', { email: 'x' }));
  await check('anon read students', false, R(anon, 'students'));

  // الأدوار العادية تخدم كيف قبل
  await check('parent read students', true, R(parent, 'students'));
  await check('parent read settings', true, R(parent, 'settings'));
  await check('parent read payments/s1', true, R(parent, 'payments/s1'));
  await check('parent write appointments', true, W(parent, 'appointments/a1', { reason: 'x' }));
  await check('parent write absences', true, W(parent, 'absences/s1/x', { note: 'x' }));
  await check('parent write rulesAck', true, W(parent, 'students/s1/rulesAck', true));
  await check('parent read own record', true, R(parent, 'parents/pUid'));
  await check('parent read role probes', true, R(parent, 'drivers/pUid'));
  await check('tv read students', true, R(tv, 'students'));
  await check('anissa write punch', true, W(anissa, 'punch/x', { t: 1 }));
  await check('driver read own record', true, R(driver, 'drivers/dUid'));
  await check('driver write transportLog', true, W(driver, 'transportLog/2026-10-09/x', { t: 1 }));

  // السواق: ما عادش حد يقرا كلمات السر متاعهم ولا يزيد روحو سايق
  await check('parent read drivers list', false, R(parent, 'drivers'));
  await check('parent read driver record', false, R(parent, 'drivers/dUid'));
  await check('parent write drivers', false, W(parent, 'drivers/pUid', { email: 'x' }));
  await check('driver read other parents', false, R(driver, 'parents/pUid'));
  await check('parent write students name', false, W(parent, 'students/s1/name', 'x'));
  await check('parent write settings', false, W(parent, 'settings/x', 1));

  // فهرس الدخول
  await check('anon read loginIndex', true, R(anon, 'loginIndex'));
  await check('parent write loginIndex', false, W(parent, 'loginIndex', { a: 1 }));
  await check('admin write loginIndex', true, W(admin, 'loginIndex', { hx: { role: 'parent' } }));

  // المدير يقرا و يكتب كل شي
  await check('admin read all', true, R(admin, ''));
  await check('admin write drivers', true, W(admin, 'drivers/new', { email: 'n' }));

  await env.cleanup();
  console.log(bad ? ('❌ ' + bad + '/' + n + ' فشلو') : ('✅ ' + n + ' اختبار نجحو'));
  process.exit(bad ? 1 : 0);
})();
