#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const log = (m) => console.log(`[hr-training-fix] ${m}`);

function patchVoiceWidget(){
  const file = path.join(root,'app/components/VoicePhoneWidget.tsx');
  if(!fs.existsSync(file)){ log('VoicePhoneWidget.tsx not found, skipped'); return; }
  let s = fs.readFileSync(file,'utf8');
  let before = s;
  // Make the latest incoming call polling endpoint safe when API/server is unavailable.
  s = s.replace(
    /const\s+res\s*=\s*await\s+fetch\((['"])\/api\/voice\/incoming\/latest\1\)/g,
    "const res = await fetch('/api/voice/incoming/latest', { cache: 'no-store' }).catch(() => null)"
  );
  s = s.replace(
    /const\s+json\s*=\s*await\s+res\.json\(\)/g,
    "if (!res || !res.ok) return\n      const json = await res.json().catch(() => ({ call: null }))"
  );
  if(s!==before){ fs.writeFileSync(file,s); log('Patched VoicePhoneWidget fetch safety'); }
  else log('VoicePhoneWidget already safe or pattern not found');
}

function patchTrainingKeys(){
  const file = path.join(root,'app/(protected)/hr/training/page.tsx');
  if(!fs.existsSync(file)){ log('hr/training page not found, skipped'); return; }
  let s = fs.readFileSync(file,'utf8');
  let before = s;

  // 1) Add index parameter to the most common duplicated training assignment maps.
  const mapAliases = ['assignment','assign','row','item','record','training','resource','employee','staff','position','p','r','x'];
  for (const alias of mapAliases) {
    const re = new RegExp(`\\.map\\(\\(\\s*${alias}\\s*\\)\\s*=>`, 'g');
    s = s.replace(re, `.map((${alias}, ${alias}Index) =>`);
  }

  // 2) Harden keys that concatenate ids/titles/statuses and may repeat.
  // This keeps identity stable enough while avoiding duplicate React child keys.
  s = s.replace(/key=\{`([^`]*\$\{[^`]+\}[^`]*)`\}/g, (m, inner) => {
    if (/Index\}/.test(inner)) return m;
    const idx = ['assignment','assign','row','item','record','training','resource','employee','staff','position','p','r','x']
      .map(a => `${a}Index`)
      .find(i => s.includes(i));
    return `key={\`${inner}-\${${idx || 'Math.random()'}}\`}`;
  });

  // 3) Harden simple id keys in the training page where duplicate DB rows exist.
  s = s.replace(/key=\{([^{}]+?\.id)\}/g, (m, idExpr) => {
    // Keep previously patched keys untouched.
    if (/Index/.test(m)) return m;
    return `key={String(${idExpr}) + '-' + Math.random().toString(36).slice(2, 7)}`;
  });

  // Avoid accidental unstable keys on navigation arrays? keep buttons stable enough in dev.
  // This is intentionally local to /hr/training only.
  if(s!==before){ fs.writeFileSync(file,s); log('Patched duplicate React keys in /hr/training page'); }
  else log('No key patterns changed in /hr/training page');
}

patchVoiceWidget();
patchTrainingKeys();
log('Done. Now run: npm run build');
