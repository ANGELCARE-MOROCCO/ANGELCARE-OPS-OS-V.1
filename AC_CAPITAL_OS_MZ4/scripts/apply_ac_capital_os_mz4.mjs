import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const packageRoot = path.resolve(path.dirname(__filename), '..');
const cwd = process.cwd();

function exists(p) { return fs.existsSync(p); }
function copyDir(src, dest) {
  if (!exists(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function detectRepoRoot() {
  const fromRepo = path.join(cwd, 'apps', 'ops-web');
  const fromOps = cwd.endsWith(path.join('apps', 'ops-web')) ? cwd : null;
  if (exists(fromRepo)) return { mode: 'repository-root', repoRoot: cwd, opsRoot: fromRepo };
  if (fromOps && exists(path.join(fromOps, 'app'))) return { mode: 'ops-web-root', repoRoot: path.resolve(fromOps, '..', '..'), opsRoot: fromOps };
  throw new Error('Run from repository root containing apps/ops-web or from apps/ops-web.');
}

const detected = detectRepoRoot();
const payloadOps = path.join(packageRoot, 'payload', 'ops-web');
const payloadRoot = path.join(packageRoot, 'payload', 'root');

console.log('AC CAPITAL OS MZ4 installer');
console.log(`Detected mode: ${detected.mode}`);
console.log(`Repository root: ${detected.repoRoot}`);
console.log(`Ops-web root: ${detected.opsRoot}`);
console.log(`Protected route target: ${path.join(detected.opsRoot, 'app', '(protected)', 'ac-capital-os')}`);

copyDir(payloadOps, detected.opsRoot);
copyDir(payloadRoot, detected.repoRoot);

console.log('\nAC CAPITAL OS Mega ZIP 4 files copied successfully.');
console.log('Route installed at: apps/ops-web/app/(protected)/ac-capital-os/page.tsx');
console.log('Qualification route installed at: apps/ops-web/app/(protected)/ac-capital-os/qualification/page.tsx');
console.log('Qualification API installed at: apps/ops-web/app/api/ac-capital-os/qualification-engine/route.ts');
console.log('MZ1 Foundation, MZ2 Cockpit and MZ3 Radar payload files are preserved in this integrated package.');
console.log('Next: node ./AC_CAPITAL_OS_MZ4/scripts/verify_ac_capital_os_mz4.mjs');
console.log('No build, no git stage, no commit, no push.');
