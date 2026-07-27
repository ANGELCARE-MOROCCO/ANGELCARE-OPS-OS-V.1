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
  'components/ac-capital-os/ac-capital-os.module.css',
  'lib/ac-capital-os/types.ts',
  'lib/ac-capital-os/foundation.ts',
  'lib/ac-capital-os/executive-cockpit.ts',
  'lib/ac-capital-os/capital-radar.ts',
  'lib/ac-capital-os/qualification-engine.ts',
  'lib/ac-capital-os/funder-intelligence.ts',
  'app/(protected)/ac-capital-os/page.tsx',
  'app/(protected)/ac-capital-os/radar/page.tsx',
  'app/(protected)/ac-capital-os/qualification/page.tsx',
  'app/(protected)/ac-capital-os/funders/page.tsx',
  'app/api/ac-capital-os/foundation/route.ts',
  'app/api/ac-capital-os/executive-cockpit/route.ts',
  'app/api/ac-capital-os/capital-radar/route.ts',
  'app/api/ac-capital-os/qualification-engine/route.ts',
  'app/api/ac-capital-os/funder-intelligence/route.ts',
];

for (const rel of required) {
  assert(exists(path.join(detected.opsRoot, rel)), `Missing required file: apps/ops-web/${rel}`);
}

const migration = path.join(detected.repoRoot, 'supabase', 'migrations', '20260727_ac_capital_os_mz5_funder_intelligence.sql');
assert(exists(migration), 'Missing MZ5 Supabase migration.');

const page = read(path.join(detected.opsRoot, 'app/(protected)/ac-capital-os/page.tsx'));
const shell = read(path.join(detected.opsRoot, 'components/ac-capital-os/AcCapitalOsShell.tsx'));
const funderComponent = read(path.join(detected.opsRoot, 'components/ac-capital-os/AcCapitalOsFunderIntelligenceRoom.tsx'));
const funderLib = read(path.join(detected.opsRoot, 'lib/ac-capital-os/funder-intelligence.ts'));
const funderApi = read(path.join(detected.opsRoot, 'app/api/ac-capital-os/funder-intelligence/route.ts'));
const foundation = read(path.join(detected.opsRoot, 'lib/ac-capital-os/foundation.ts'));
const cockpit = read(path.join(detected.opsRoot, 'components/ac-capital-os/AcCapitalOsExecutiveCockpit.tsx'));
const radar = read(path.join(detected.opsRoot, 'components/ac-capital-os/AcCapitalOsCapitalRadar.tsx'));
const qualification = read(path.join(detected.opsRoot, 'components/ac-capital-os/AcCapitalOsQualificationEngine.tsx'));
const migrationText = read(migration);
const packageRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
assert(exists(path.join(packageRoot, 'MANIFEST.json')), 'Missing MANIFEST.json in package.');
assert(exists(path.join(packageRoot, 'README_FIRST.md')), 'Missing README_FIRST.md in package.');

const mz5Tokens = [
  'Funder Intelligence Room',
  'Investor Psychology',
  'Likely Objections',
  'Best AngelCare Narrative',
  'Relationship Status',
  'Relationship Temperature',
  'Contact Strategy',
  'Ticket Range',
  'Funding Stage Focus',
  'Strategic Priority',
  'Follow-Up Due',
  'Founder-Level Approach',
  'Opportunity Links',
  'MZ5_AC_CAPITAL_OS_FUNDER_INTELLIGENCE',
  'funderProfiles',
  'funderContacts',
  'funderRelationshipHistory',
  'funderPsychologyBriefs',
  'funderLikelyObjections',
  'funderNarrativeRecommendations',
  'funderOpportunityLinks',
  'funderFollowUpActions',
  'funderStrategicSegments',
];
for (const token of mz5Tokens) {
  assert((funderComponent + funderLib + funderApi + foundation + page).includes(token), `Missing MZ5 token: ${token}`);
}

const preservationTokens = [
  'AC CAPITAL OS',
  'Capital Executive Cockpit',
  'Capital Radar',
  'Qualification Engine',
  'Source Confidence',
  'Deadline Heat',
  'Fit Score',
  'Documentation Readiness',
  'Send to Case Builder',
];
for (const token of preservationTokens) {
  assert((shell + cockpit + radar + qualification + foundation + page).includes(token), `Missing preservation token: ${token}`);
}

for (const token of [
  'ac_capital_funders',
  'ac_capital_funder_contacts',
  'ac_capital_funder_relationship_events',
  'ac_capital_funder_psychology_briefs',
  'ac_capital_funder_objections',
  'ac_capital_funder_narratives',
  'ac_capital_funder_opportunity_links',
  'ac_capital_funder_followup_actions',
]) {
  assert(migrationText.includes(token), `Migration missing table token: ${token}`);
}

assert(!exists(path.join(detected.opsRoot, 'app', 'ac-capital-os')), 'Wrong unprotected root route app/ac-capital-os was created.');

console.log('MZ5_AC_CAPITAL_OS_FUNDER_INTELLIGENCE_VERIFIED');
console.log(`Detected mode: ${detected.mode}`);
console.log(`Required files: ${required.length}`);
console.log('Route installed at: apps/ops-web/app/(protected)/ac-capital-os/page.tsx');
console.log('Funder Intelligence route installed at: apps/ops-web/app/(protected)/ac-capital-os/funders/page.tsx');
console.log('Funder Intelligence API installed at: apps/ops-web/app/api/ac-capital-os/funder-intelligence/route.ts');
console.log('MZ1 foundation + MZ2 cockpit + MZ3 radar + MZ4 qualification preservation tokens verified.');
console.log('Next: run your normal TypeScript static check from apps/ops-web.');
