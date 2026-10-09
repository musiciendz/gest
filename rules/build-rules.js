// يولّد database.rules.json. بدّل هنا، و بعد: node rules/build-rules.js
// القواعد في Firebase ما فيهاش دوال، لذا نكتبو الشروط مرّة وحدة هنا و نعاودو نستعملوها.
const fs = require('fs'), path = require('path');

const P = 'GestionPetitAnge/';
const ADMIN = "auth.token.email === 'musiciendz@gmail.com'";
const ROLE_NODES = ['parents', 'drivers', 'tvs', 'caterers', 'anissas'];
// عضو = المدير ولا حساب عندو سجلّ في عقدة دور. حساب تعمل بروحو من برّا (auth بلا دور) ما يقرا شي.
const MEMBER = 'auth != null && (' + [ADMIN]
  .concat(ROLE_NODES.map(n => "root.child('" + P + n + "/' + auth.uid).exists()"))
  .join(' || ') + ')';
const SELF = 'auth != null && auth.uid === $uid';
// الفريق = المدير و السواق و التلفاز و الطبّاخ و الأنيسات (الأولياء لا): يقراو الأطفال الكل.
const STAFF = 'auth != null && (' + [ADMIN]
  .concat(ROLE_NODES.filter(n => n !== 'parents').map(n => "root.child('" + P + n + "/' + auth.uid).exists()"))
  .join(' || ') + ')';
const IS_PARENT = "auth != null && root.child('" + P + "parents/' + auth.uid).exists()";
const PARENT_FAM = "root.child('" + P + "parents/' + auth.uid + '/familyId').val()";
// الوليّ: كان أطفال عائلتو. familyId متاع الطفل يحافظ عليه المدير (فهرس العائلات في index.html).
const OWN_KID = IS_PARENT + " && data.child('familyId').val() === " + PARENT_FAM;
const OWN_KID_PARENT = IS_PARENT + " && data.parent().child('familyId').val() === " + PARENT_FAM;
// famIndex/{id الطفل} = عائلتو: يكتبو المدير برك (القاعدة العامّة)، و القواعد تقراه.
const OWN_KID_ID = IS_PARENT + " && root.child('" + P + "famIndex/' + $sid).val() === " + PARENT_FAM;

const rw = { '.read': MEMBER, '.write': MEMBER };
const r = { '.read': MEMBER };

const shared = ['gallery', 'monthlyNeeds', 'photoOfDay', 'toolRequests', 'appointments', 'dailyReports',
  'transWeekly', 'medications', 'medicationsArchive', 'teamMessages', 'attendance', 'medicationsLog',
  'satBookings', 'extras', 'medDoses', 'adminNotifs', 'absences', 'absencesArchive', 'absencesLog',
  'parentNotifs', 'parentLogins', 'workShifts', 'punch', 'mealPrep', 'catPayments', 'mealProposals',
  'mealOrders', 'tvBoards', 'photos', 'transportLog'];

const node = {
  '.read': 'auth != null && ' + ADMIN,
  '.write': 'auth != null && ' + ADMIN,
  students: {
    // الوليّ لازم يطلب: orderByChild('familyId').equalTo(عائلتو)
    '.read': '(' + STAFF + ') || (' + IS_PARENT + " && query.orderByChild === 'familyId' && query.equalTo === " + PARENT_FAM + ')',
    '.indexOn': ['familyId'],
    '$sid': {
      '.read': OWN_KID,
      rulesAck: { '.write': '(' + STAFF + ') || (' + OWN_KID_PARENT + ')' },
      docs: { '.write': '(' + STAFF + ') || (' + OWN_KID_PARENT + ')' }
    }
  },
  settings: r,
  mealMenu: r,
  payments: { '$sid': { '.read': '(' + STAFF + ') || (' + OWN_KID_ID + ')' } },
  // فهرس شاشة الدخول: يتقرا قبل الدخول، فيه كان hash متاع الإيميل و الدور (بلا أسماء). يكتبو المدير برك.
  loginIndex: { '.read': true }
};
shared.forEach(n => { node[n] = rw; });
// سجلّات الحسابات (فيها كلمات السر): كل واحد يقرا سجلّو برك، المدير يقرا الكل.
ROLE_NODES.forEach(n => { node[n] = { '$uid': { '.read': SELF } }; });

const out = { rules: { GestionPetitAnge: node } };
fs.writeFileSync(path.join(__dirname, '..', 'database.rules.json'), JSON.stringify(out, null, 2) + '\n');
console.log('database.rules.json: ' + Object.keys(node).filter(k => k[0] !== '.').length + ' عقدة');
