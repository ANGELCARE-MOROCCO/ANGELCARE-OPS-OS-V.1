import fs from 'node:fs';
import path from 'node:path';
const cwd = process.cwd();
function exists(p) { return fs.existsSync(p); }
function fail(message) { console.error(`\nAC CAPITAL OS MZ2 verification failed:\n${message}\n`); process.exit(1); }
function findRoots() {
  const repoOps = path.join(cwd, 'apps', 'ops-web');
  if (exists(repoOps) && exists(path.join(repoOps, 'app'))) return { repoRoot: cwd, opsRoot: repoOps, mode: 'repository-root' };
  if (path.basename(cwd) === 'ops-web' && exists(path.join(cwd, 'app')) && exists(path.join(cwd, 'package.json'))) return { repoRoot: path.resolve(cwd, '../..'), opsRoot: cwd, mode: 'ops-web-root' };
  fail('Could not detect ops-web. Run from angelcare-platform root or apps/ops-web.');
}
const { repoRoot, opsRoot, mode } = findRoots();
const required = [
  path.join(opsRoot, 'app/(protected)/ac-capital-os/page.tsx'),
  path.join(opsRoot, 'app/api/ac-capital-os/executive-cockpit/route.ts'),
  path.join(opsRoot, 'components/ac-capital-os/AcCapitalOsExecutiveCockpit.tsx'),
  path.join(opsRoot, 'components/ac-capital-os/AcCapitalOsShell.tsx'),
  path.join(opsRoot, 'components/ac-capital-os/AcCapitalOsFoundation.tsx'),
  path.join(opsRoot, 'components/ac-capital-os/AcCapitalOsWorkspaceCard.tsx'),
  path.join(opsRoot, 'components/ac-capital-os/ac-capital-os.module.css'),
  path.join(opsRoot, 'lib/ac-capital-os/types.ts'),
  path.join(opsRoot, 'lib/ac-capital-os/foundation.ts'),
  path.join(opsRoot, 'lib/ac-capital-os/routes.ts'),
  path.join(opsRoot, 'lib/ac-capital-os/executive-cockpit.ts'),
  path.join(opsRoot, 'lib/ac-capital-os/rbac.ts'),
  path.join(opsRoot, 'lib/ac-capital-os/audit.ts'),
  path.join(repoRoot, 'supabase/migrations/20260727_ac_capital_os_mz2_executive_cockpit.sql'),
];
const missing = required.filter((file) => !exists(file));
if (missing.length) fail(`Missing files after apply:\n${missing.map((f) => `- ${f}`).join('\n')}\n\nRun the apply script first.`);
const cockpitFile = path.join(opsRoot, 'components/ac-capital-os/AcCapitalOsExecutiveCockpit.tsx');
const cockpit = fs.readFileSync(cockpitFile, 'utf8');
for (const token of ['Capital Executive Cockpit', 'Today’s command plan', 'AI-prepared actions', 'Capital Readiness Score', 'Human coordinator approves and executes']) {
  if (!cockpit.includes(token)) fail(`Missing contract token in ${cockpitFile}: ${token}`);
}
const apiFile = path.join(opsRoot, 'app/api/ac-capital-os/executive-cockpit/route.ts');
const api = fs.readFileSync(apiFile, 'utf8');
if (!api.includes('getAcCapitalExecutiveCockpitSnapshot')) fail('Executive Cockpit API is not wired to snapshot provider.');
if (!api.includes("../../../../../lib/ac-capital-os/executive-cockpit")) fail('Executive Cockpit API import path is not compatible with apps/ops-web/app/api/ac-capital-os/executive-cockpit depth.');
const pageFile = path.join(opsRoot, 'app/(protected)/ac-capital-os/page.tsx');
const page = fs.readFileSync(pageFile, 'utf8');
if (!page.includes('AcCapitalOsExecutiveCockpit')) fail('Protected AC CAPITAL OS page does not render the Executive Cockpit.');
console.log('MZ2_AC_CAPITAL_OS_EXECUTIVE_COCKPIT_VERIFIED');
console.log('Detected mode:', mode);
console.log('Required files:', required.length);
console.log('Route installed at: apps/ops-web/app/(protected)/ac-capital-os/page.tsx');
console.log('API installed at: apps/ops-web/app/api/ac-capital-os/executive-cockpit/route.ts');
console.log('Next: run your normal TypeScript static check from apps/ops-web.');
