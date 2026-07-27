import fs from 'node:fs';
import path from 'node:path';

const cwd = process.cwd();
function exists(p) { return fs.existsSync(p); }
function read(p) { return fs.readFileSync(p, 'utf8'); }
function detectRepoRoot() {
  const fromRepo = path.join(cwd, 'apps', 'ops-web');
  const fromOps = cwd.endsWith(path.join('apps', 'ops-web')) ? cwd : null;
  if (exists(fromRepo)) return { mode: 'repository-root', repoRoot: cwd, opsRoot: fromRepo };
  if (fromOps && exists(path.join(fromOps, 'app'))) return { mode: 'ops-web-root', repoRoot: path.resolve(fromOps, '..', '..'), opsRoot: fromOps };
  throw new Error('Run verifier from repository root containing apps/ops-web or from apps/ops-web.');
}

const detected = detectRepoRoot();
const required = [
  'app/(protected)/ac-capital-os/page.tsx',
  'app/(protected)/ac-capital-os/data-room/page.tsx',
  'app/api/ac-capital-os/foundation/route.ts',
  'app/api/ac-capital-os/executive-cockpit/route.ts',
  'app/api/ac-capital-os/capital-radar/route.ts',
  'app/api/ac-capital-os/qualification-engine/route.ts',
  'app/api/ac-capital-os/funder-intelligence/route.ts',
  'app/api/ac-capital-os/capital-doctrine/route.ts',
  'app/api/ac-capital-os/case-builder/route.ts',
  'app/api/ac-capital-os/data-room/route.ts',
  'components/ac-capital-os/AcCapitalOsDueDiligenceDataRoom.tsx',
  'lib/ac-capital-os/data-room.ts',
  'lib/ac-capital-os/foundation.ts',
  'lib/ac-capital-os/types.ts',
].map((p) => path.join(detected.opsRoot, p));

const missing = required.filter((p) => !exists(p));
if (missing.length) {
  console.error('Missing required files:');
  for (const p of missing) console.error(`- ${p}`);
  process.exit(1);
}

const migration = path.join(detected.repoRoot, 'supabase', 'migrations', '20260727_ac_capital_os_mz8_due_diligence_data_room.sql');
if (!exists(migration)) {
  console.error(`Missing migration: ${migration}`);
  process.exit(1);
}

const pageText = read(path.join(detected.opsRoot, 'components', 'ac-capital-os', 'AcCapitalOsDueDiligenceDataRoom.tsx')) + '\n' + read(path.join(detected.opsRoot, 'lib', 'ac-capital-os', 'foundation.ts'));
const apiText = read(path.join(detected.opsRoot, 'app', 'api', 'ac-capital-os', 'data-room', 'route.ts'));
const allText = pageText + '\n' + apiText;
const tokens = [
  'Due Diligence Data Room',
  'Capital Proof Vault',
  'Evidence Vault',
  'Data Room Readiness',
  'Missing Evidence',
  'Version Control',
  'Bank Pack',
  'VC Pack',
  'Grant Pack',
  'Case Evidence Linker',
  'Submission Archive',
  'Credibility Score',
  'Founder Approval',
  'Signature Required',
  'Stamp Required',
  'MZ8_AC_CAPITAL_OS_DUE_DILIGENCE_DATA_ROOM',
  'AC CAPITAL OS',
  'Capital Executive Cockpit',
  'Capital Radar',
  'Qualification Engine',
  'Funder Intelligence Room',
  'Capital Doctrine Vault',
  'Fundraising Case Builder',
  'Source Confidence',
  'Fit Score',
  'Investor Psychology',
  'Best AngelCare Narrative',
  'Monthly Doctrine Injection',
  'Coordinator Handover',
];
const missingTokens = tokens.filter((token) => !allText.includes(token));
if (missingTokens.length) {
  console.error('Missing contract tokens:');
  for (const token of missingTokens) console.error(`- ${token}`);
  process.exit(1);
}

const wrongRoot = path.join(detected.repoRoot, 'app', 'ac-capital-os', 'page.tsx');
if (exists(wrongRoot)) {
  console.error(`Wrong root route detected: ${wrongRoot}`);
  process.exit(1);
}

console.log('MZ8_AC_CAPITAL_OS_DUE_DILIGENCE_DATA_ROOM_VERIFIED');
console.log(`Detected mode: ${detected.mode}`);
console.log('Required files:', required.length);
console.log('Route installed at: apps/ops-web/app/(protected)/ac-capital-os/page.tsx');
console.log('Data Room route installed at: apps/ops-web/app/(protected)/ac-capital-os/data-room/page.tsx');
console.log('API installed at: apps/ops-web/app/api/ac-capital-os/data-room/route.ts');
console.log('Next: run your normal TypeScript static check from apps/ops-web.');
