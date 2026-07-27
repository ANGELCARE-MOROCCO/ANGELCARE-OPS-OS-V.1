import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const packageRoot = path.resolve(path.dirname(__filename), '..');
const cwd = process.cwd();

function exists(p) { return fs.existsSync(p); }

function fail(message) {
  console.error(`\nAC CAPITAL OS MZ1 installer stopped:\n${message}\n`);
  process.exit(1);
}

function findRoots() {
  const repoOps = path.join(cwd, 'apps', 'ops-web');
  if (exists(repoOps) && exists(path.join(repoOps, 'app'))) {
    return { repoRoot: cwd, opsRoot: repoOps, mode: 'repository-root' };
  }
  if (path.basename(cwd) === 'ops-web' && exists(path.join(cwd, 'app')) && exists(path.join(cwd, 'package.json'))) {
    return { repoRoot: path.resolve(cwd, '../..'), opsRoot: cwd, mode: 'ops-web-root' };
  }
  fail('Could not detect target. Run from angelcare-platform repository root containing apps/ops-web, or from apps/ops-web.');
}

function copyDir(src, dest) {
  if (!exists(src)) fail(`Missing payload directory: ${src}. Re-unzip the package completely.`);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyDir(srcPath, destPath);
    } else {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      if (exists(destPath)) {
        const backupPath = `${destPath}.backup-ac-capital-os-mz1-${Date.now()}`;
        fs.copyFileSync(destPath, backupPath);
      }
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

if (!exists(path.join(packageRoot, 'payload', 'ops-web'))) {
  fail(`Package payload not found at ${path.join(packageRoot, 'payload', 'ops-web')}. You likely did not unzip the package from the repository root.`);
}

const { repoRoot, opsRoot, mode } = findRoots();
const protectedRouteTarget = path.join(opsRoot, 'app', '(protected)', 'ac-capital-os');

console.log('AC CAPITAL OS MZ1 installer');
console.log('Detected mode:', mode);
console.log('Repository root:', repoRoot);
console.log('Ops-web root:', opsRoot);
console.log('Protected route target:', protectedRouteTarget);

copyDir(path.join(packageRoot, 'payload', 'ops-web'), opsRoot);
copyDir(path.join(packageRoot, 'payload', 'root'), repoRoot);

console.log('\nAC CAPITAL OS Mega ZIP 1 files copied successfully.');
console.log('Route installed at: apps/ops-web/app/(protected)/ac-capital-os/page.tsx');
console.log('Next: node ./AC_CAPITAL_OS_MZ1/scripts/verify_ac_capital_os_mz1.mjs');
console.log('No build, no git stage, no commit, no push.');
