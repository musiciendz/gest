// يثبّت إلّي النصوص اللي يكتبها الأولياء ما تتنفّذش كود عند المدير.
// التشغيل:  npm i playwright && npx playwright install chromium && node tests/xss-check.js
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const Q = String.fromCharCode(39);
const X = t => 'نص <img src=x onerror="__hit(' + Q + t + Q + ')"> ' + Q + '-' + t;

function seed(){
  const st = {}, kid = 1700000000005;
  for(let i = 0; i < 20; i++){ const id = 1700000000000 + i;
    st[id] = { id, familyId:String(id), name:'طفل '+i, dob:'2021-03-1'+(i%9), gen:'ذكر', joinDate:'2025-09-15',
      legal:'الأب', f:{n:'أب '+i, p:'2'+(1000000+i)}, m:{n:'أم '+i, p:'5'+(1000000+i)}, life:{cls:'تحضيري'}, health:{status:'جيدة'} }; }
  const today = new Date().toISOString().slice(0,10), fut = new Date(Date.now()+3*864e5).toISOString().slice(0,10);
  const abs = { childId:kid, childName:X('abs.childName'), from:today, to:fut, days:3, reasonType:'أخرى', note:X('abs.note'), status:'active', createdAt:Date.now(), by:X('abs.by') };
  return { GestionPetitAnge: { students: st, settings: { instName:'P tit Ange' },
    appointments: { a1:{ childId:kid, childName:X('appt.childName'), reason:X('appt.reason'), wantDate:fut, wantTime:X('appt.wantTime'), status:'pending', ts:Date.now() } },
    absences: { [kid]: { ab1: abs } }, absencesLog: { ab1: abs },
    satBookings: { [fut]: { [kid]: { childId:kid, childName:X('sat.childName'), cls:X('sat.cls'), date:fut, price:10, by:X('sat.by'), ts:Date.now(), status:'pending' } } },
    toolRequests: { t1:{ item:X('tool.item'), qty:X('tool.qty'), by:X('tool.by'), ts:Date.now(), status:'pending' } } } };
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport:{ width:1280, height:900 } });
  page.on('dialog', d => d.dismiss());
  await page.addInitScript(() => { window.__hits = {}; window.__hit = t => { window.__hits[t] = 1; }; });
  const fake = fs.readFileSync(path.join(__dirname, 'fake-firebase.js'), 'utf8');
  const boot = 'window.__FAKE_DATA=' + JSON.stringify(seed()) + ';window.__FAKE_USER={email:"musiciendz@gmail.com",uid:"admin1"};';
  await page.route('**/*', r => {
    const u = r.request().url();
    if(u.includes('gstatic.com/firebasejs')) return r.fulfill({ contentType:'application/javascript', body: u.includes('firebase-app') ? boot + fake : '' });
    if(u === 'http://app.local/index.html') return r.fulfill({ contentType:'text/html', body: fs.readFileSync(path.join(root, 'index.html')) });
    return r.fulfill({ status:404, body:'' });
  });
  await page.goto('http://app.local/index.html');
  await page.waitForTimeout(8000);
  const screens = ['openNotifPanel','openApptAdmin','openAbsModal','openAbsLog','openSatAdmin','openToolsAdmin'];
  for(const fn of screens){
    await page.evaluate(fn => { try { window[fn](); } catch(e){} }, fn);
    await page.waitForTimeout(1000);
  }
  const hits = Object.keys(await page.evaluate(() => window.__hits));
  await browser.close();
  if(hits.length){ console.error('❌ XSS: الحقول هاذي تنفّذ كود:', hits.join(', ')); process.exit(1); }
  console.log('✅ ما فماش نص يتنفّذ كـ كود في شاشات الإدارة (' + screens.length + ' شاشات)');
})();
