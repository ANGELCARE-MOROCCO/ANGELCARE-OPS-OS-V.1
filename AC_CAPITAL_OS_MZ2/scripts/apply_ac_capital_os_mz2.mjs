import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const packageRoot = path.resolve(path.dirname(__filename), '..');
const cwd = process.cwd();
function exists(p) { return fs.existsSync(p); }
function fail(message) { console.error(`\nAC CAPITAL OS MZ2 installer stopped:\n${message}\n`); process.exit(1); }
function findRoots() {
  const repoOps = path.join(cwd, 'apps', 'ops-web');
  if (exists(repoOps) && exists(path.join(repoOps, 'app'))) return { repoRoot: cwd, opsRoot: repoOps, mode: 'repository-root' };
  if (path.basename(cwd) === 'ops-web' && exists(path.join(cwd, 'app')) && exists(path.join(cwd, 'package.json'))) return { repoRoot: path.resolve(cwd, '../..'), opsRoot: cwd, mode: 'ops-web-root' };
  fail('Could not detect target. Run from angelcare-platform repository root containing apps/ops-web, or from apps/ops-web.');
}
function copyDir(src, dest) {
  if (!exists(src)) fail(`Missing payload directory: ${src}. Re-unzip the package completely.`);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) { fs.mkdirSync(destPath, { recursive: true }); copyDir(srcPath, destPath); }
    else {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      if (exists(destPath)) fs.copyFileSync(destPath, `${destPath}.backup-ac-capital-os-mz2-${Date.now()}`);
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
if (!exists(path.join(packageRoot, 'payload', 'ops-web'))) fail(`Package payload not found at ${path.join(packageRoot, 'payload', 'ops-web')}.`);
const { repoRoot, opsRoot, mode } = findRoots();
console.log('AC CAPITAL OS MZ2 installer');
console.log('Detected mode:', mode);
console.log('Repository root:', repoRoot);
console.log('Ops-web root:', opsRoot);
console.log('Protected route target:', path.join(opsRoot, 'app', '(protected)', 'ac-capital-os'));
copyDir(path.join(packageRoot, 'payload', 'ops-web'), opsRoot);
copyDir(path.join(packageRoot, 'payload', 'root'), repoRoot);
console.log('\nAC CAPITAL OS Mega ZIP 2 files copied successfully.');
console.log('Executive Cockpit installed at: apps/ops-web/app/(protected)/ac-capital-os/page.tsx');
console.log('API installed at: apps/ops-web/app/api/ac-capital-os/executive-cockpit/route.ts');
console.log('Next: node ./AC_CAPITAL_OS_MZ2/scripts/verify_ac_capital_os_mz2.mjs');
console.log('No build, no git stage, no commit, no push.');
