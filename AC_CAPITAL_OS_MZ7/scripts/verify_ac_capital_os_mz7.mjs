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
  'components/ac-capital-os/AcCapitalOsFundraisingCaseBuilder.tsx',
  'components/ac-capital-os/ac-capital-os.module.css',
  'lib/ac-capital-os/types.ts',
  'lib/ac-capital-os/foundation.ts',
  'lib/ac-capital-os/executive-cockpit.ts',
  'lib/ac-capital-os/capital-radar.ts',
  'lib/ac-capital-os/qualification-engine.ts',
  'lib/ac-capital-os/funder-intelligence.ts',
  'lib/ac-capital-os/capital-doctrine.ts',
  'lib/ac-capital-os/case-builder.ts',
  'app/(protected)/ac-capital-os/page.tsx',
  'app/(protected)/ac-capital-os/radar/page.tsx',
  'app/(protected)/ac-capital-os/qualification/page.tsx',
  'app/(protected)/ac-capital-os/funders/page.tsx',
  'app/(protected)/ac-capital-os/doctrine/page.tsx',
  'app/(protected)/ac-capital-os/cases/page.tsx',
  'app/api/ac-capital-os/foundation/route.ts',
  'app/api/ac-capital-os/executive-cockpit/route.ts',
  'app/api/ac-capital-os/capital-radar/route.ts',
  'app/api/ac-capital-os/qualification-engine/route.ts',
  'app/api/ac-capital-os/funder-intelligence/route.ts',
  'app/api/ac-capital-os/capital-doctrine/route.ts',
  'app/api/ac-capital-os/case-builder/route.ts',
];

for (const rel of required) {
  assert(exists(path.join(detected.opsRoot, rel)), `Missing required file: apps/ops-web/${rel}`);
}

const migration = path.join(detected.repoRoot, 'supabase', 'migrations', '20260727_ac_capital_os_mz7_fundraising_case_builder.sql');
assert(exists(migration), 'Missing MZ7 Supabase migration.');

const page = read(path.join(detected.opsRoot, 'app/(protected)/ac-capital-os/page.tsx'));
const shell = read(path.join(detected.opsRoot, 'components/ac-capital-os/AcCapitalOsShell.tsx'));
const caseComponent = read(path.join(detected.opsRoot, 'components/ac-capital-os/AcCapitalOsFundraisingCaseBuilder.tsx'));
const caseLib = read(path.join(detected.opsRoot, 'lib/ac-capital-os/case-builder.ts'));
const caseApi = read(path.join(detected.opsRoot, 'app/api/ac-capital-os/case-builder/route.ts'));
const foundation = read(path.join(detected.opsRoot, 'lib/ac-capital-os/foundation.ts'));
const cockpit = read(path.join(detected.opsRoot, 'components/ac-capital-os/AcCapitalOsExecutiveCockpit.tsx'));
const radar = read(path.join(detected.opsRoot, 'components/ac-capital-os/AcCapitalOsCapitalRadar.tsx'));
const qualification = read(path.join(detected.opsRoot, 'components/ac-capital-os/AcCapitalOsQualificationEngine.tsx'));
const funder = read(path.join(detected.opsRoot, 'components/ac-capital-os/AcCapitalOsFunderIntelligenceRoom.tsx'));
const doctrine = read(path.join(detected.opsRoot, 'components/ac-capital-os/AcCapitalOsCapitalDoctrineVault.tsx'));
const migrationText = read(migration);
const packageRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
assert(exists(path.join(packageRoot, 'MANIFEST.json')), 'Missing MANIFEST.json in package.');
assert(exists(path.join(packageRoot, 'README_FIRST.md')), 'Missing README_FIRST.md in package.');

const mz7Tokens = [
  'Fundraising Case Builder',
  'Opportunity-to-Package',
  'Capital Dossier Factory',
  'Case Readiness',
  'Required Documents Map',
  'AngelCare Positioning Builder',
  'Financial Section Builder',
  'Risk Plan Builder',
  'Impact Section Builder',
  'Outreach Scripts',
  'Proof Pack',
  'Founder Approval',
  'Coordinator Handover',
  'Bank Package',
  'VC Package',
  'Grant Package',
  'MZ7_AC_CAPITAL_OS_FUNDRAISING_CASE_BUILDER',
  'caseBuilderCases',
  'caseBuilderStages',
  'caseBuilderDocuments',
  'caseBuilderNarratives',
  'caseBuilderPositioningBlocks',
  'caseBuilderFinancialSections',
  'caseBuilderRiskPlans',
  'caseBuilderImpactSections',
  'caseBuilderOutreachScripts',
  'caseBuilderProofPacks',
  'caseBuilderFounderApprovals',
  'caseBuilderCoordinatorHandovers',
];
for (const token of mz7Tokens) {
  assert((caseComponent + caseLib + caseApi + foundation + page).includes(token), `Missing MZ7 token: ${token}`);
}

const preservationTokens = [
  'AC CAPITAL OS',
  'Capital Executive Cockpit',
  'Capital Radar',
  'Qualification Engine',
  'Funder Intelligence Room',
  'Capital Doctrine Vault',
  'Source Confidence',
  'Fit Score',
  'Investor Psychology',
  'Best AngelCare Narrative',
  'Monthly Doctrine Injection',
  'AI Agent Doctrine Binding',
];
for (const token of preservationTokens) {
  assert((shell + cockpit + radar + qualification + funder + doctrine + foundation + page + caseComponent).includes(token), `Missing preservation token: ${token}`);
}

for (const token of [
  'ac_capital_cases',
  'ac_capital_case_stages',
  'ac_capital_case_documents',
  'ac_capital_case_narratives',
  'ac_capital_case_positioning_blocks',
  'ac_capital_case_financial_sections',
  'ac_capital_case_risk_plans',
  'ac_capital_case_impact_sections',
  'ac_capital_case_outreach_scripts',
  'ac_capital_case_proof_packs',
  'ac_capital_case_founder_approvals',
  'ac_capital_case_coordinator_handovers',
  'ac_capital_case_audit_events',
]) {
  assert(migrationText.includes(token), `Migration missing table token: ${token}`);
}

assert(!exists(path.join(detected.opsRoot, 'app', 'ac-capital-os')), 'Wrong unprotected root route app/ac-capital-os was created.');

console.log('MZ7_AC_CAPITAL_OS_FUNDRAISING_CASE_BUILDER_VERIFIED');
console.log(`Detected mode: ${detected.mode}`);
console.log(`Required files: ${required.length}`);
console.log('Route installed at: apps/ops-web/app/(protected)/ac-capital-os/page.tsx');
console.log('Cases route installed at: apps/ops-web/app/(protected)/ac-capital-os/cases/page.tsx');
console.log('Case Builder API installed at: apps/ops-web/app/api/ac-capital-os/case-builder/route.ts');
console.log('MZ1 foundation + MZ2 cockpit + MZ3 radar + MZ4 qualification + MZ5 funder + MZ6 doctrine preservation tokens verified.');
console.log('Next: run your normal TypeScript static check from apps/ops-web.');
