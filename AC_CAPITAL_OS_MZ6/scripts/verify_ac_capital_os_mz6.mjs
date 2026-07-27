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
  'components/ac-capital-os/AcCapitalOsFunderIntelligenceRoom.tsx',
  'components/ac-capital-os/AcCapitalOsCapitalDoctrineVault.tsx',
  'components/ac-capital-os/ac-capital-os.module.css',
  'lib/ac-capital-os/types.ts',
  'lib/ac-capital-os/foundation.ts',
  'lib/ac-capital-os/executive-cockpit.ts',
  'lib/ac-capital-os/capital-radar.ts',
  'lib/ac-capital-os/qualification-engine.ts',
  'lib/ac-capital-os/funder-intelligence.ts',
  'lib/ac-capital-os/capital-doctrine.ts',
  'app/(protected)/ac-capital-os/page.tsx',
  'app/(protected)/ac-capital-os/radar/page.tsx',
  'app/(protected)/ac-capital-os/qualification/page.tsx',
  'app/(protected)/ac-capital-os/funders/page.tsx',
  'app/(protected)/ac-capital-os/doctrine/page.tsx',
  'app/api/ac-capital-os/foundation/route.ts',
  'app/api/ac-capital-os/executive-cockpit/route.ts',
  'app/api/ac-capital-os/capital-radar/route.ts',
  'app/api/ac-capital-os/qualification-engine/route.ts',
  'app/api/ac-capital-os/funder-intelligence/route.ts',
  'app/api/ac-capital-os/capital-doctrine/route.ts',
];

for (const rel of required) {
  assert(exists(path.join(detected.opsRoot, rel)), `Missing required file: apps/ops-web/${rel}`);
}

const migration = path.join(detected.repoRoot, 'supabase', 'migrations', '20260727_ac_capital_os_mz6_capital_doctrine_vault.sql');
assert(exists(migration), 'Missing MZ6 Supabase migration.');

const page = read(path.join(detected.opsRoot, 'app/(protected)/ac-capital-os/page.tsx'));
const shell = read(path.join(detected.opsRoot, 'components/ac-capital-os/AcCapitalOsShell.tsx'));
const doctrineComponent = read(path.join(detected.opsRoot, 'components/ac-capital-os/AcCapitalOsCapitalDoctrineVault.tsx'));
const doctrineLib = read(path.join(detected.opsRoot, 'lib/ac-capital-os/capital-doctrine.ts'));
const doctrineApi = read(path.join(detected.opsRoot, 'app/api/ac-capital-os/capital-doctrine/route.ts'));
const foundation = read(path.join(detected.opsRoot, 'lib/ac-capital-os/foundation.ts'));
const cockpit = read(path.join(detected.opsRoot, 'components/ac-capital-os/AcCapitalOsExecutiveCockpit.tsx'));
const radar = read(path.join(detected.opsRoot, 'components/ac-capital-os/AcCapitalOsCapitalRadar.tsx'));
const qualification = read(path.join(detected.opsRoot, 'components/ac-capital-os/AcCapitalOsQualificationEngine.tsx'));
const funder = read(path.join(detected.opsRoot, 'components/ac-capital-os/AcCapitalOsFunderIntelligenceRoom.tsx'));
const migrationText = read(migration);
const packageRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
assert(exists(path.join(packageRoot, 'MANIFEST.json')), 'Missing MANIFEST.json in package.');
assert(exists(path.join(packageRoot, 'README_FIRST.md')), 'Missing README_FIRST.md in package.');

const mz6Tokens = [
  'Capital Doctrine Vault',
  'Monthly Doctrine Injection',
  'Manual Doctrine Injection',
  'Founder Doctrine',
  'Bank Funding Doctrine',
  'VC Investor Doctrine',
  'Grant Impact Doctrine',
  'SaaS Partner OS Doctrine',
  'Prompt Library',
  'Skills Library',
  'Doctrine Conflicts',
  'Doctrine Application Matrix',
  'AI Agent Doctrine Binding',
  'Founder Approval Required',
  'Apply Doctrine to Active Cases',
  'MZ6_AC_CAPITAL_OS_CAPITAL_DOCTRINE',
  'capitalDoctrineItems',
  'capitalDoctrineCategories',
  'capitalDoctrineCommands',
  'capitalDoctrinePrompts',
  'capitalDoctrineSkills',
  'capitalDoctrineConflicts',
  'capitalDoctrineApplications',
  'capitalDoctrineAgentBindings',
  'capitalDoctrineMonthlyInjections',
  'capitalDoctrineAuditEvents',
];
for (const token of mz6Tokens) {
  assert((doctrineComponent + doctrineLib + doctrineApi + foundation + page).includes(token), `Missing MZ6 token: ${token}`);
}

const preservationTokens = [
  'AC CAPITAL OS',
  'Capital Executive Cockpit',
  'Capital Radar',
  'Qualification Engine',
  'Funder Intelligence Room',
  'Source Confidence',
  'Deadline Heat',
  'Fit Score',
  'Investor Psychology',
  'Best AngelCare Narrative',
];
for (const token of preservationTokens) {
  assert((shell + cockpit + radar + qualification + funder + foundation + page).includes(token), `Missing preservation token: ${token}`);
}

for (const token of [
  'ac_capital_doctrine_items',
  'ac_capital_doctrine_versions',
  'ac_capital_doctrine_categories',
  'ac_capital_doctrine_commands',
  'ac_capital_doctrine_prompts',
  'ac_capital_doctrine_skills',
  'ac_capital_doctrine_conflicts',
  'ac_capital_doctrine_applications',
  'ac_capital_doctrine_agent_bindings',
  'ac_capital_doctrine_monthly_injections',
  'ac_capital_doctrine_audit_events',
]) {
  assert(migrationText.includes(token), `Migration missing table token: ${token}`);
}

assert(!exists(path.join(detected.opsRoot, 'app', 'ac-capital-os')), 'Wrong unprotected root route app/ac-capital-os was created.');

console.log('MZ6_AC_CAPITAL_OS_CAPITAL_DOCTRINE_VERIFIED');
console.log(`Detected mode: ${detected.mode}`);
console.log(`Required files: ${required.length}`);
console.log('Route installed at: apps/ops-web/app/(protected)/ac-capital-os/page.tsx');
console.log('Doctrine route installed at: apps/ops-web/app/(protected)/ac-capital-os/doctrine/page.tsx');
console.log('Capital Doctrine API installed at: apps/ops-web/app/api/ac-capital-os/capital-doctrine/route.ts');
console.log('MZ1 foundation + MZ2 cockpit + MZ3 radar + MZ4 qualification + MZ5 funder preservation tokens verified.');
console.log('Next: run your normal TypeScript static check from apps/ops-web.');
