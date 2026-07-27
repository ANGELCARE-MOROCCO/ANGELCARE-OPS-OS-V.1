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
  'components/ac-capital-os/AcCapitalOsQualificationEngine.tsx',
  'components/ac-capital-os/ac-capital-os.module.css',
  'lib/ac-capital-os/types.ts',
  'lib/ac-capital-os/foundation.ts',
  'lib/ac-capital-os/executive-cockpit.ts',
  'lib/ac-capital-os/capital-radar.ts',
  'lib/ac-capital-os/qualification-engine.ts',
  'app/(protected)/ac-capital-os/page.tsx',
  'app/(protected)/ac-capital-os/radar/page.tsx',
  'app/(protected)/ac-capital-os/qualification/page.tsx',
  'app/api/ac-capital-os/foundation/route.ts',
  'app/api/ac-capital-os/executive-cockpit/route.ts',
  'app/api/ac-capital-os/capital-radar/route.ts',
  'app/api/ac-capital-os/qualification-engine/route.ts',
];

for (const rel of required) {
  assert(exists(path.join(detected.opsRoot, rel)), `Missing required file: apps/ops-web/${rel}`);
}

const mz3Migration = path.join(detected.repoRoot, 'supabase', 'migrations', '20260727_ac_capital_os_mz3_capital_radar.sql');
const mz4Migration = path.join(detected.repoRoot, 'supabase', 'migrations', '20260727_ac_capital_os_mz4_qualification_engine.sql');
assert(exists(mz3Migration), 'Missing MZ3 Supabase migration.');
assert(exists(mz4Migration), 'Missing MZ4 Supabase migration.');

const page = read(path.join(detected.opsRoot, 'app/(protected)/ac-capital-os/page.tsx'));
const qualification = read(path.join(detected.opsRoot, 'components/ac-capital-os/AcCapitalOsQualificationEngine.tsx'));
const qualificationLib = read(path.join(detected.opsRoot, 'lib/ac-capital-os/qualification-engine.ts'));
const qualificationApi = read(path.join(detected.opsRoot, 'app/api/ac-capital-os/qualification-engine/route.ts'));
const foundation = read(path.join(detected.opsRoot, 'lib/ac-capital-os/foundation.ts'));
const shell = read(path.join(detected.opsRoot, 'components/ac-capital-os/AcCapitalOsShell.tsx'));
const radar = read(path.join(detected.opsRoot, 'components/ac-capital-os/AcCapitalOsCapitalRadar.tsx'));
const cockpit = read(path.join(detected.opsRoot, 'components/ac-capital-os/AcCapitalOsExecutiveCockpit.tsx'));
const migrationText = read(mz4Migration);
const packageRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
assert(exists(path.join(packageRoot, 'MANIFEST.json')), 'Missing MANIFEST.json in package.');
assert(exists(path.join(packageRoot, 'README_FIRST.md')), 'Missing README_FIRST.md in package.');

const mz4Tokens = [
  'Qualification Engine',
  'Opportunity Fit',
  'Fit Score',
  'Eligibility Fit',
  'Women Cofounder Fit',
  'SaaS Fit',
  'Childcare Impact Fit',
  'Deadline Feasibility',
  'Documentation Readiness',
  'Strategic Watchlist',
  'Pursue Immediately',
  'Prepare Missing Documents',
  'Founder Review Required',
  'Risk and Objections',
  'Send to Case Builder',
  'MZ4_AC_CAPITAL_OS_QUALIFICATION_ENGINE',
  'qualificationDossiers',
  'qualificationCriteria',
  'qualificationScores',
  'qualificationDecisions',
  'qualificationRisks',
  'qualificationMissingDocuments',
  'qualificationNextActions',
  'qualificationHandoffTargets',
];
for (const token of mz4Tokens) {
  assert((qualification + qualificationLib + qualificationApi + foundation).includes(token), `Missing MZ4 token: ${token}`);
}

const preservationTokens = [
  'AC CAPITAL OS',
  'Capital Executive Cockpit',
  'Capital Radar',
  'Source Confidence',
  'Deadline Heat',
  'Research Adapter',
  'Protected internal access',
];
for (const token of preservationTokens) {
  assert((shell + radar + cockpit + page + foundation).includes(token), `Missing preservation token: ${token}`);
}

for (const token of [
  'ac_capital_qualification_dossiers',
  'ac_capital_qualification_scores',
  'ac_capital_qualification_criteria',
  'ac_capital_qualification_risks',
  'ac_capital_qualification_missing_documents',
  'ac_capital_qualification_next_actions',
  'ac_capital_qualification_decisions',
]) {
  assert(migrationText.includes(token), `Migration missing table token: ${token}`);
}

assert(!exists(path.join(detected.opsRoot, 'app', 'ac-capital-os')), 'Wrong unprotected root route app/ac-capital-os was created.');

console.log('MZ4_AC_CAPITAL_OS_QUALIFICATION_ENGINE_VERIFIED');
console.log(`Detected mode: ${detected.mode}`);
console.log(`Required files: ${required.length}`);
console.log('Route installed at: apps/ops-web/app/(protected)/ac-capital-os/page.tsx');
console.log('Qualification route installed at: apps/ops-web/app/(protected)/ac-capital-os/qualification/page.tsx');
console.log('Qualification API installed at: apps/ops-web/app/api/ac-capital-os/qualification-engine/route.ts');
console.log('MZ1 foundation + MZ2 cockpit + MZ3 radar preservation tokens verified.');
console.log('Next: run your normal TypeScript static check from apps/ops-web.');
