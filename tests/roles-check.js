// يحلّ التطبيقة بكل دور (مدير، ولي، سائق، تلفاز، طبّاخ، أنيسة) على database emulator بالقواعد الحقيقية،
// و يثبّت إلّي كل دور يوصل لواجهتو بلا حتى PERMISSION_DENIED.
// التشغيل: npm i firebase-tools playwright firebase@8.10.1 && npx playwright install chromium
//          npx firebase emulators:exec --project ptit-ange-admin --only database "node tests/roles-check.js"
const { chromium } = require('playwright');
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..'); const rulesPath=process.argv[2]||path.join(root,'database.rules.json'), htmlPath=process.argv[3]||path.join(root,'index.html');
const NS='ptit-ange-admin-default-rtdb', DBU='http://127.0.0.1:9000', AU='http://127.0.0.1:9099';
const H={'Authorization':'Bearer owner','Content-Type':'application/json'};
const roles=[['admin','musiciendz@gmail.com'],['parent','parent1@ptitange.tn'],['driver','chauffeur1@ptitange.tn'],['tv','tv1@ptitange.tn'],['caterer','cuisine1@ptitange.tn'],['anissa','anissa1@ptitange.tn']];
(async()=>{
 const uids={}; for(const [r] of roles) uids[r]='uid_'+r;
 const st={}; for(let i=0;i<20;i++){ const id=1700000000000+i; st[id]={id,familyId:String(id-(i%3)),name:'طفل رقم '+i,dob:'2021-03-1'+(i%9),gen:'ذكر',joinDate:'2025-09-15',legal:'الأب',f:{n:'أب',p:'2'+(1000000+i)},m:{n:'أم',p:'5'+(1000000+i)},life:{cls:'تحضيري'},health:{status:'جيدة'}}; }
 // بيانات قديمة كيف الإنتاج: طفل بلا familyId و طفل familyId متاعو رقم. المدير يصلّحهم كي يدخل (فهرس العائلات).
 delete st[1700000000000].familyId; st[1700000000001].familyId=1700000000000;
 const D={GestionPetitAnge:{students:st,settings:{instName:'P tit Ange'},payments:{'1700000000001':{'2025-09':{amount:120}},'1700000000004':{'2025-09':{amount:120}}}}}; const G=D.GestionPetitAnge;
 G.parents={[uids.parent]:{email:'parent1@ptitange.tn',password:'secret123',name:'ولي',familyId:'1700000000000'}};
 G.drivers={[uids.driver]:{email:'chauffeur1@ptitange.tn',password:'secret123',name:'سائق',payMode:'fixed',salary:500}};
 G.tvs={[uids.tv]:{email:'tv1@ptitange.tn',name:'تلفاز'}};
 G.caterers={[uids.caterer]:{email:'cuisine1@ptitange.tn',name:'طباخ'}};
 G.anissas={[uids.anissa]:{email:'anissa1@ptitange.tn',name:'أنيسة',role:'anissa',classes:['تحضيري']}};
 let r=await fetch(DBU+'/.json?ns='+NS,{method:'PUT',headers:H,body:JSON.stringify(D)}); if(!r.ok) throw new Error('seed '+await r.text());
 r=await fetch(DBU+'/.settings/rules.json?ns='+NS,{method:'PUT',headers:H,body:fs.readFileSync(rulesPath,'utf8')}); if(!r.ok) throw new Error('rules '+await r.text());
 const sdk=n=>fs.readFileSync(require.resolve((process.env.FIREBASE8_DIR||'firebase')+'/'+n),'utf8');
 const patch="\n(function(){var o=firebase.initializeApp;firebase.initializeApp=function(c,n){var a=o.apply(this,arguments);try{a.auth().useEmulator('http://127.0.0.1:9099');}catch(e){}try{a.database().useEmulator('127.0.0.1',9000);}catch(e){}return a;};})();\n";
 const b=await chromium.launch({args:['--no-proxy-server']});
 const out={};
 for(const [role,email] of roles.slice(0,+process.env.NROLES||6)){
  const ctx=await b.newContext({viewport:{width:1280,height:900}}); const p=await ctx.newPage();
  const msgs=new Set(); p.on('console',m=>{const t=m.text(); if(/permission_denied|PERMISSION_DENIED|Permission denied/i.test(t)) msgs.add(t.replace(/^.*?(set|on\(\)|once\(\)|update|remove|transaction)/,'$1').replace(/\d{4}-\d\d-\d\d/g,'DATE').replace(/-[A-Za-z0-9_]{19,20}/g,'-ID').slice(0,140));});
  p.on('pageerror',e=>msgs.add('PAGEERROR '+e.message.slice(0,140))); p.on('dialog',d=>{msgs.add('DIALOG '+d.message().slice(0,80)); d.dismiss();});
  await p.route(u=>!/127\.0\.0\.1:9(099|000)/.test(u.href),rt=>{const u=rt.request().url();
    if(u.includes('127.0.0.1:9') ) return rt.continue();
    if(u.includes('gstatic.com/firebasejs')){ const n=u.split('/').pop(); return rt.fulfill({contentType:'application/javascript',body: n==='firebase-auth.js' ? ('window.__ROLE_USER='+JSON.stringify({uid:uids[role],email})+';'+fs.readFileSync(path.join(__dirname,'auth-shim.js'),'utf8')) : sdk(n)}); }
    if(u.startsWith('http://127.0.0.1:5999/index.html')) return rt.fulfill({body:fs.readFileSync(htmlPath),contentType:'text/html'});
    if(!/fonts|cdnjs|jsdelivr/.test(u)) msgs.add('BLOCKED '+u.slice(0,90)); return rt.fulfill({status:404,body:''}); });
  await p.goto('http://127.0.0.1:5999/index.html'); await p.waitForTimeout(2500);
  
  await p.waitForTimeout(16000);
  const shown=await p.evaluate(()=>['parentApp','driverApp','tvApp','catApp','anApp','anissaApp'].filter(id=>document.getElementById(id)).join(',')||((document.getElementById('home')||{}).classList||{contains:()=>false}).contains('active')&&'admin-home'||'?');
  const txt=await p.evaluate(()=>document.body.innerText.length);   const kids=role==='parent'?await p.evaluate(()=>students.map(s=>s.name).sort().join(',')):'';
  if(role==='parent'){
   // تحيين حيّ: الإدارة تبدّل اسم طفل من العائلة، لازم يوصل للوليّ (ما تقصّش الربط)
   await fetch(DBU+'/GestionPetitAnge/students/1700000000002/name.json?ns='+NS,{method:'PUT',headers:H,body:JSON.stringify('طفل رقم 2 ✓')});
   await p.waitForTimeout(2500);
   const live=await p.evaluate(()=>students.some(s=>s.name==='طفل رقم 2 ✓'));
   if(!live) msgs.add('LIVE تحيين الأطفال ما وصلش للوليّ');
  } out[role]={shown,txt,kids,denied:[...msgs].filter(m=>!m.startsWith('BLOCKED')).sort()};
  await ctx.close();
 }
 await b.close();
 if(out.parent && out.parent.kids!=='طفل رقم 0,طفل رقم 1,طفل رقم 2'){ out.parent.denied.push('KIDS '+out.parent.kids); }
 let bad=0; const want={admin:'admin-home',parent:'parentApp',driver:'driverApp',tv:'tvApp',caterer:'catApp',anissa:'anissaApp'};
 for(const k in out){ const ok=out[k].shown===want[k]&&!out[k].denied.length; if(!ok) bad++; console.log((ok?'✅ ':'❌ ')+k.padEnd(8),out[k].shown,out[k].denied.join(' | ')); }
 process.exit(bad?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
