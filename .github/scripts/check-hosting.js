// Checks run before every Firebase Hosting deploy.
// A Hosting release replaces the whole site, so anything missing here would disappear from the live site.
//   node .github/scripts/check-hosting.js live      -> any problem fails the run (deploy to the live site)
//   node .github/scripts/check-hosting.js preview   -> missing site files are warnings (temporary preview URL)
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const PROJECT_ID = 'ptit-ange-admin';
const DATABASE_URL = 'https://ptit-ange-admin-default-rtdb.europe-west1.firebasedatabase.app';
// Files the live site serves today (production upload of 2026-10-09).
const REQUIRED_FILES = ['index.html', 'sw.js', 'logo.png', 'manifest.json', 'icon-192.png', 'apple-touch-icon.png', 'audio/list.json'];

const mode = process.argv[2];
if (mode !== 'live' && mode !== 'preview') {
  console.error('usage: check-hosting.js live|preview');
  process.exit(2);
}
const strict = mode === 'live';
const root = process.cwd();
const errors = [];
const warnings = [];
const siteProblem = msg => (strict ? errors : warnings).push(msg);

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
  } catch (e) {
    errors.push(`${file}: ${e.code === 'ENOENT' ? 'missing' : 'invalid JSON (' + e.message + ')'}`);
    return null;
  }
}

// Firebase project and Hosting config
const rc = readJson('.firebaserc');
if (rc && (rc.projects || {}).default !== PROJECT_ID) errors.push(`.firebaserc: default project is not ${PROJECT_ID}`);
const fb = readJson('firebase.json');
const publicDir = fb && fb.hosting && fb.hosting.public;
if (fb && !publicDir) errors.push('firebase.json: hosting.public is not set');
const site = path.join(root, publicDir || '.');
const has = f => {
  try { return fs.statSync(path.join(site, f)).size > 0; } catch (e) { return false; }
};

// Site files
for (const f of REQUIRED_FILES) if (!has(f)) siteProblem(`${f} is missing (the live site serves it)`);

// index.html must talk to the production database, not an old copy pointing elsewhere
if (has('index.html')) {
  const html = fs.readFileSync(path.join(site, 'index.html'), 'utf8');
  if (!html.includes(DATABASE_URL)) errors.push(`index.html does not use the production database ${DATABASE_URL}`);
  if (!/<\/html>\s*$/i.test(html)) errors.push('index.html does not end with </html> (truncated file?)');
}

// Service worker syntax
if (has('sw.js')) {
  try {
    execFileSync(process.execPath, ['--check', path.join(site, 'sw.js')], { stdio: 'pipe' });
  } catch (e) {
    errors.push('sw.js has a syntax error: ' + String(e.stderr).trim());
  }
}

// PWA manifest icons
if (has('manifest.json')) {
  const m = readJson(path.join(publicDir || '.', 'manifest.json'));
  for (const icon of (m && m.icons) || []) if (!has(icon.src)) warnings.push(`manifest.json lists ${icon.src}, which does not exist`);
}

// Local audio files referenced by the playlist (the mp3s are not in git; the workflow downloads them)
if (has('audio/list.json')) {
  const list = readJson(path.join(publicDir || '.', 'audio/list.json')) || {};
  for (const [cat, items] of Object.entries(list)) {
    for (const src of items || []) {
      if (/^https?:\/\//.test(src)) continue;
      if (!has(src)) siteProblem(`${src} is missing (audio/list.json, "${cat}")`);
    }
  }
}

for (const w of warnings) console.log(`::warning::${w}`);
for (const e of errors) console.log(`::error::${e}`);
if (errors.length) {
  console.log(`\n${errors.length} problem(s): not deploying to the ${mode} site.`);
  process.exit(1);
}
console.log(`Hosting checks passed for the ${mode} site (${warnings.length} warning(s)).`);
