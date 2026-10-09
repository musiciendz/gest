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
  students: { '.read': MEMBER, '$sid': { rulesAck: { '.write': MEMBER }, docs: { '.write': MEMBER } } },
  settings: r,
  mealMenu: r,
  payments: { '$sid': r },
  // فهرس شاشة الدخول: يتقرا قبل الدخول، فيه كان hash متاع الإيميل و الدور (بلا أسماء). يكتبو المدير برك.
  loginIndex: { '.read': true }
};
shared.forEach(n => { node[n] = rw; });
// سجلّات الحسابات (فيها كلمات السر): كل واحد يقرا سجلّو برك، المدير يقرا الكل.
ROLE_NODES.forEach(n => { node[n] = { '$uid': { '.read': SELF } }; });

const out = { rules: { GestionPetitAnge: node } };
fs.writeFileSync(path.join(__dirname, '..', 'database.rules.json'), JSON.stringify(out, null, 2) + '\n');
console.log('database.rules.json: ' + Object.keys(node).filter(k => k[0] !== '.').length + ' عقدة');
