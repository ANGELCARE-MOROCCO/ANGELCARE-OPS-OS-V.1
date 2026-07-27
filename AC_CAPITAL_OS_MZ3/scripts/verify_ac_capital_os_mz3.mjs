import fs from 'node:fs';
import path from 'node:path';

const cwd = process.cwd();
function exists(p) { return fs.existsSync(p); }
function read(p) { return fs.readFileSync(p, 'utf8'); }
function assert(condition, message) { if (!condition) throw new Error(message); }

function detectRepoRoot() {
  const fromRepo = path.join(cwd, 'apps', 'ops-web');
  const fromOps = cwd.endsWith(path.join('apps', 'ops-web')) ? cwd : null;
  if (exists(fromRepo)) return { mode: 'repository-root', repoRoot: cwd, opsRoot: fromRepo };
  if (fromOps && exists(path.join(fromOps, 'app'))) return { mode: 'ops-web-root', repoRoot: path.resolve(fromOps, '..', '..'), opsRoot: fromOps };
  throw new Error('Run from repository root containing apps/ops-web or from apps/ops-web.');
}

const detected = detectRepoRoot();
const required = [
  'components/ac-capital-os/AcCapitalOsShell.tsx',
  'components/ac-capital-os/AcCapitalOsExecutiveCockpit.tsx',
  'components/ac-capital-os/AcCapitalOsCapitalRadar.tsx',
  'components/ac-capital-os/ac-capital-os.module.css',
  'lib/ac-capital-os/types.ts',
  'lib/ac-capital-os/foundation.ts',
  'lib/ac-capital-os/executive-cockpit.ts',
  'lib/ac-capital-os/capital-radar.ts',
  'app/(protected)/ac-capital-os/page.tsx',
  'app/(protected)/ac-capital-os/radar/page.tsx',
  'app/api/ac-capital-os/foundation/route.ts',
  'app/api/ac-capital-os/executive-cockpit/route.ts',
  'app/api/ac-capital-os/capital-radar/route.ts',
];

for (const rel of required) {
  assert(exists(path.join(detected.opsRoot, rel)), `Missing required file: apps/ops-web/${rel}`);
}

const migration = path.join(detected.repoRoot, 'supabase', 'migrations', '20260727_ac_capital_os_mz3_capital_radar.sql');
assert(exists(migration), 'Missing MZ3 Supabase migration.');

const page = read(path.join(detected.opsRoot, 'app/(protected)/ac-capital-os/page.tsx'));
const radar = read(path.join(detected.opsRoot, 'components/ac-capital-os/AcCapitalOsCapitalRadar.tsx'));
const radarLib = read(path.join(detected.opsRoot, 'lib/ac-capital-os/capital-radar.ts'));
const radarApi = read(path.join(detected.opsRoot, 'app/api/ac-capital-os/capital-radar/route.ts'));
const foundation = read(path.join(detected.opsRoot, 'lib/ac-capital-os/foundation.ts'));
const cockpit = read(path.join(detected.opsRoot, 'components/ac-capital-os/AcCapitalOsExecutiveCockpit.tsx'));
const shell = read(path.join(detected.opsRoot, 'components/ac-capital-os/AcCapitalOsShell.tsx'));
const migrationText = read(migration);

const requiredTokens = [
  'Capital Radar',
  'Funding Intelligence',
  'Send to Qualification',
  'Source Confidence',
  'Deadline Heat',
  'Research Adapter',
  'Morocco',
  'International',
  'MZ3_AC_CAPITAL_OS_CAPITAL_RADAR',
  'capitalRadarOpportunities',
  'capitalRadarResearchRuns',
  'capitalRadarSources',
  'capitalRadarFilters',
  'capitalRadarAdapterStatus',
  'capitalRadarHandoffQueue',
];
for (const token of requiredTokens) {
  assert((radar + radarLib + radarApi + foundation).includes(token), `Missing MZ3 token: ${token}`);
}

const preservationTokens = [
  'Capital Executive Cockpit',
  'Capital Readiness Score',
  'Today’s command plan',
  'AC CAPITAL OS',
  'Protected internal access',
];
for (const token of preservationTokens) {
  assert((cockpit + shell + page + radar + foundation).includes(token), `Missing preservation token: ${token}`);
}

for (const token of [
  'ac_capital_radar_opportunities',
  'ac_capital_radar_sources',
  'ac_capital_radar_research_runs',
  'ac_capital_radar_opportunity_tags',
  'ac_capital_radar_handoff_queue',
]) {
  assert(migrationText.includes(token), `Migration missing table token: ${token}`);
}

assert(!exists(path.join(detected.opsRoot, 'app', 'ac-capital-os')), 'Wrong unprotected root route app/ac-capital-os was created.');

console.log('MZ3_AC_CAPITAL_OS_CAPITAL_RADAR_VERIFIED');
console.log(`Detected mode: ${detected.mode}`);
console.log(`Required files: ${required.length}`);
console.log('Route installed at: apps/ops-web/app/(protected)/ac-capital-os/page.tsx');
console.log('Radar route installed at: apps/ops-web/app/(protected)/ac-capital-os/radar/page.tsx');
console.log('Radar API installed at: apps/ops-web/app/api/ac-capital-os/capital-radar/route.ts');
console.log('MZ1 foundation + MZ2 cockpit preservation tokens verified.');
console.log('Next: run your normal TypeScript static check from apps/ops-web.');
