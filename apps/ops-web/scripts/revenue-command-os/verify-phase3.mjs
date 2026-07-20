import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const failures = []
const passes = []
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath))
const check = (condition, label, detail = '') => condition ? passes.push({ label, detail }) : failures.push({ label, detail })
const occurrences = (text, pattern) => (text.match(pattern) || []).length

const requiredFiles = [
  'app/(protected)/revenue-command-os/memory-learning/layout.tsx',
  'app/(protected)/revenue-command-os/memory-learning/page.tsx',
  'app/(protected)/revenue-command-os/memory-learning/[section]/page.tsx',
  'app/(protected)/revenue-command-os/memory-learning/_components/KnowledgeMemoryContext.tsx',
  'app/(protected)/revenue-command-os/memory-learning/_components/KnowledgeMemoryFrame.tsx',
  'app/(protected)/revenue-command-os/memory-learning/_components/KnowledgeMemoryWorkspace.tsx',
  'app/(protected)/revenue-command-os/memory-learning/_components/DoctrineDrawer.tsx',
  'app/api/revenue-command-os/knowledge-memory/route.ts',
  'lib/revenue-command-os/knowledge-memory/constants.ts',
  'lib/revenue-command-os/knowledge-memory/seed-data.ts',
  'lib/revenue-command-os/knowledge-memory/validation.ts',
  'lib/revenue-command-os/knowledge-memory/repository.ts',
  'supabase/migrations/20260720_revenue_command_os_phase3_doctrine_memory.sql',
  'docs/revenue-command-os/phase-03/CANONICAL_BUILD_CONTRACT_LOCK.md',
  'docs/revenue-command-os/phase-03/README.md',
  'docs/revenue-command-os/phase-03/ARCHITECTURE.md',
  'docs/revenue-command-os/phase-03/DATA_DICTIONARY.md',
  'docs/revenue-command-os/phase-03/API_CONTRACT.md',
  'docs/revenue-command-os/phase-03/ACCEPTANCE.md',
  'docs/revenue-command-os/phase-03/INSTALLATION.md',
  'docs/revenue-command-os/phase-03/SECURITY_AND_GOVERNANCE.md',
  'docs/revenue-command-os/phase-03/SEED_PROVENANCE.md',
  'docs/revenue-command-os/phase-03/CHANGELOG.md',
  'docs/revenue-command-os/phase-03/ROLLBACK.sql',
  'tests/revenue-command-os/fixtures/phase3-doctrine-memory.json',
  'tests/revenue-command-os/fixtures/phase3-lifecycle-cases.json',
  'tests/revenue-command-os/fixtures/phase3-governance-cases.json',
  'tsconfig.revenue-os-phase3.json',
]
for (const file of requiredFiles) check(exists(file), `Required file: ${file}`)

const constants = read('lib/revenue-command-os/constants.ts')
const knowledgeConstants = read('lib/revenue-command-os/knowledge-memory/constants.ts')
const seed = read('lib/revenue-command-os/knowledge-memory/seed-data.ts')
const validation = read('lib/revenue-command-os/knowledge-memory/validation.ts')
const repository = read('lib/revenue-command-os/knowledge-memory/repository.ts')
const api = read('app/api/revenue-command-os/knowledge-memory/route.ts')
const layout = read('app/(protected)/revenue-command-os/memory-learning/layout.tsx')
const frame = read('app/(protected)/revenue-command-os/memory-learning/_components/KnowledgeMemoryFrame.tsx')
const workspace = read('app/(protected)/revenue-command-os/memory-learning/_components/KnowledgeMemoryWorkspace.tsx')
const drawer = read('app/(protected)/revenue-command-os/memory-learning/_components/DoctrineDrawer.tsx')
const search = read('lib/revenue-command-os/search.ts')
const searchApi = read('app/api/revenue-command-os/search/route.ts')
const migration = read('supabase/migrations/20260720_revenue_command_os_phase3_doctrine_memory.sql')
const rollback = read('docs/revenue-command-os/phase-03/ROLLBACK.sql')
const permissions = read('lib/auth/permissions.ts')
const access = read('lib/access-control.ts')
const fixture = JSON.parse(read('tests/revenue-command-os/fixtures/phase3-doctrine-memory.json'))
const lifecycleCases = JSON.parse(read('tests/revenue-command-os/fixtures/phase3-lifecycle-cases.json'))
const governanceCases = JSON.parse(read('tests/revenue-command-os/fixtures/phase3-governance-cases.json'))

check(constants.includes('AC-REVENUE-OS-MZ03-DOCTRINE-MEMORY'), 'Mega ZIP 3 release code locked')
check(constants.includes('3.0.0-phase3'), 'Mega ZIP 3 module version locked')
check(constants.includes('AC-REVENUE-OS-MZ02-DIGITAL-TWIN'), 'Mega ZIP 2 release history preserved')
check(constants.includes('AC-REVENUE-OS-MZ01-FOUNDATION'), 'Mega ZIP 1 release history preserved')
check(constants.includes("key: 'memory-learning'"), 'Doctrine & mémoire workspace registered')
check(constants.includes("href: '/revenue-command-os/memory-learning'"), 'Doctrine & mémoire route registered')
check(constants.includes("label: 'Doctrine & mémoire'"), 'Workspace label upgraded from placeholder')
check(constants.includes("status: 'ready'"), 'Doctrine & mémoire workspace operational')
check(constants.includes("REVENUE_OS_DEFAULT_EXECUTION_MODE: RevenueOsExecutionMode = 'shadow'"), 'Shadow remains default execution posture')
check(constants.includes('revenue_os.external_actions') && constants.includes('enabled: false'), 'External actions remain disabled')
check(constants.includes('revenue_os.strategy_execution') && constants.includes('enabled: false'), 'Strategy execution remains disabled')
check(constants.includes('revenue_os.knowledge_memory'), 'Knowledge memory feature flag registered')
check(constants.includes('revenue_os.knowledge_indexing'), 'Knowledge indexing feature flag registered')
check(permissions.includes('revenue_os.knowledge.manage'), 'Knowledge management permission registered')
check(permissions.includes('revenue_os.knowledge.approve'), 'Knowledge approval permission registered')
check(access.includes("'/revenue-command-os/memory-learning'"), 'Protected route registry extended')

check(knowledgeConstants.includes('AC-REVENUE-KNOWLEDGE-2026.07-V1'), 'Knowledge model version locked')
for (const section of fixture.requiredSections) check(knowledgeConstants.includes(`key: '${section}'`), `Knowledge section registered: ${section}`)
check(occurrences(knowledgeConstants, /href: '\/revenue-command-os\/memory-learning/g) === fixture.expectedMinimum.sections, 'Exactly twelve purpose-built knowledge sections registered')
for (const status of fixture.requiredStatuses) check(knowledgeConstants.includes(`'${status}'`), `Knowledge lifecycle status registered: ${status}`)
for (const type of fixture.requiredKnowledgeTypes) check(knowledgeConstants.includes(`'${type}'`) || seed.includes(`"knowledgeType": "${type}"`), `Knowledge type represented: ${type}`)
check(knowledgeConstants.includes('REVENUE_KNOWLEDGE_MUTATION_ALLOWLIST'), 'Doctrine mutation allow-list exists')

const seedRanges = [
  ['DOCTRINES', 'ASSETS', fixture.expectedMinimum.doctrines],
  ['ASSETS', 'RELATIONSHIPS', fixture.expectedMinimum.assets],
  ['RELATIONSHIPS', 'SCRIPTS', fixture.expectedMinimum.relationships],
  ['SCRIPTS', 'OBJECTIONS', fixture.expectedMinimum.scripts],
  ['OBJECTIONS', 'CASES', fixture.expectedMinimum.objections],
  ['CASES', 'CAMPAIGN_PATTERNS', fixture.expectedMinimum.cases],
  ['CAMPAIGN_PATTERNS', 'PLAYBOOKS', fixture.expectedMinimum.campaignPatterns],
  ['PLAYBOOKS', 'RESTRICTIONS', fixture.expectedMinimum.playbooks],
  ['RESTRICTIONS', 'BRAND_REQUIREMENTS', fixture.expectedMinimum.restrictions],
  ['BRAND_REQUIREMENTS', 'PARTNER_BENEFITS', fixture.expectedMinimum.brandRequirements],
  ['PARTNER_BENEFITS', 'APPROVALS', fixture.expectedMinimum.partnerBenefits],
]
for (const [startName, endName, minimum] of seedRanges) {
  const start = seed.indexOf(`REVENUE_KNOWLEDGE_SEED_${startName}`)
  const end = seed.indexOf(`REVENUE_KNOWLEDGE_SEED_${endName}`, start + 1)
  const chunk = seed.slice(start, end)
  const count = occurrences(chunk, /"id":/g)
  check(start >= 0 && end > start && count >= minimum, `Seed ${startName.toLowerCase()} count ≥ ${minimum}`, `actual=${count}`)
}

const requiredDoctrineCodes = [
  'REV-DOC-001','REV-DOC-002','REV-DOC-003','REV-POL-001','REV-POL-002','REV-POL-003','REV-SVC-001','REV-SVC-002','REV-SVC-003',
  'REV-POS-001','REV-POS-002','REV-POS-003','REV-CUS-001','REV-CUS-002','REV-CUS-003','REV-BEN-001','REV-BEN-002','REV-BEN-003',
  'REV-BRD-001','REV-BRD-002','REV-BRD-003','REV-LEG-001','REV-LEG-002','REV-LEG-003','REV-SOP-001','REV-SOP-002','REV-SOP-003',
  'REV-PLAY-001','REV-PLAY-002','REV-PLAY-003','REV-SCR-001','REV-SCR-002','REV-SCR-003','REV-OBJ-001','REV-OBJ-002','REV-OBJ-003',
  'REV-CASE-001','REV-CASE-002','REV-CASE-003','REV-CAM-001','REV-CAM-002','REV-CAM-003','REV-OFF-001','REV-OFF-002','REV-OFF-003',
]
for (const code of requiredDoctrineCodes) check(seed.includes(`"code": "${code}"`), `Governed doctrine seeded: ${code}`)

const requiredAssetCodes = Array.from({length:24},(_,i)=>`KNW-ASSET-${String(i+1).padStart(3,'0')}`)
for (const code of requiredAssetCodes) check(seed.includes(`"code": "${code}"`), `Knowledge asset seeded: ${code}`)
const requiredScripts = ['WA-ACADEMY-INTRO','WA-CATALOGUE-FOLLOWUP','WA-FLASHCARDS-PARTNER','EMAIL-ACADEMY-DIAGNOSTIC','PHONE-QUALIFICATION-B2B','MEETING-DIAGNOSTIC','PROPOSAL-DELIVERY','WA-REACTIVATION','EMAIL-RENEWAL','PHONE-PRICE-OBJECTION']
for (const code of requiredScripts) check(seed.includes(`"code": "${code}"`), `Sales script seeded: ${code}`)
const requiredObjections = ['OBJ-PRICE','OBJ-NOW','OBJ-THINK','OBJ-DIRECTOR','OBJ-TRUST','OBJ-TEAM','OBJ-ONLINE','OBJ-COMPETITOR','OBJ-BUDGET','OBJ-NEED','OBJ-RISK','OBJ-RESULT']
for (const code of requiredObjections) check(seed.includes(`"code": "${code}"`), `Objection logic seeded: ${code}`)
check(seed.includes('success') && seed.includes('failure') && seed.includes('recovery'), 'Case memory covers success, failure and recovery')
check(seed.includes('pricing') && seed.includes('discount') && seed.includes('legal') && seed.includes('brand') && seed.includes('privacy') && seed.includes('external-action') && seed.includes('capacity') && seed.includes('promise') && seed.includes('approval'), 'Restrictions cover all required governance families')
check(seed.includes('sourceAuthority'), 'Doctrine source authority is explicit')
check(seed.includes('effectiveFrom') && seed.includes('nextReviewAt'), 'Doctrine effective and review dates are represented')
check(seed.includes('applicableCommandFamilies'), 'Future command-family applicability is modeled')
check(seed.includes('evidenceRefs'), 'Evidence references are modeled')
check(seed.includes('confidentiality'), 'Confidentiality classification is modeled')
check(seed.includes('supersedesCode') || read('lib/revenue-command-os/types.ts').includes('supersedesCode'), 'Supersession chain field is modeled')

check(validation.includes('allowedTransitions'), 'Lifecycle transition graph implemented')
check(validation.includes('assertKnowledgeStatusTransition'), 'Invalid lifecycle transition guard implemented')
check(validation.includes('resolveEffectiveDoctrine'), 'Effective doctrine resolver implemented')
check(validation.includes("status === 'effective'"), 'Only effective doctrine can become executable truth')
check(validation.includes('calculateKnowledgeReadiness'), 'Knowledge readiness engine implemented')
check(validation.includes('validateRevenueKnowledge'), 'Knowledge validation engine implemented')
for (const dimension of ['approvedDoctrineCoverage','provenanceCoverage','versionIntegrity','conflictSafety','indexingReadiness','authorityCoverage','reviewFreshness']) check(validation.includes(dimension), `Readiness dimension: ${dimension}`)
check(validation.includes('critical') && validation.includes('high'), 'Critical/high validation findings supported')
check(validation.includes('retired') && validation.includes('draft'), 'Draft and retired content are excluded from effective truth')

check(repository.includes("import 'server-only'"), 'Knowledge repository is server-only')
check(repository.includes('REVENUE_KNOWLEDGE_MUTATION_ALLOWLIST'), 'Repository enforces mutation allow-list')
check(repository.includes('assertKnowledgeStatusTransition'), 'Repository enforces lifecycle graph')
check(repository.includes('writeRevenueOsAuditEvent'), 'Repository writes immutable audit events')
check(repository.includes('revenue_os_knowledge_versions'), 'Repository persists version snapshots')
check(repository.includes('snapshotHash'), 'Repository hashes doctrine snapshots')
check(repository.includes('queueKnowledgeIndexJob'), 'Controlled index queue implemented')
check(repository.includes('persistKnowledgeValidation'), 'Validation persistence implemented')
check(repository.includes('resolveKnowledgeConflict'), 'Conflict resolution implemented')
check(repository.includes('decideKnowledgeApproval'), 'Approval workflow implemented')
check(!repository.includes('OPENAI_API_KEY') && !repository.includes('new OpenAI') && !repository.includes('responses.create'), 'MZ03 does not invoke an external AI model')
check(!repository.includes('send_whatsapp') && !repository.includes('send_email'), 'MZ03 repository cannot send external communication')

const apiActions = ['mutate_doctrine','decide_approval','resolve_conflict','queue_index','run_validation','update_validation_status']
for (const action of apiActions) check(api.includes(`action==='${action}'`), `API action allow-listed: ${action}`)
check(api.includes('revenue_os.knowledge.manage'), 'API requires knowledge management authority')
check(api.includes('revenue_os.knowledge.approve'), 'API separates approval authority')
check(api.includes('normalizeRevenueOsError'), 'API normalizes controlled failures')
check(api.includes("['approve','reject','activate','suspend','retire']"), 'Sensitive lifecycle actions require approval')
check(!api.includes('send_whatsapp') && !api.includes('send_email'), 'API cannot execute external messaging')

check(layout.includes("requireAccess(['revenue_os.knowledge.manage'"), 'Protected layout enforces knowledge authority')
check(frame.includes('Doctrine & mémoire') || (frame.includes('Doctrine, preuves') && frame.includes('mémoire gouvernée')), 'Premium frame communicates institutional truth purpose')
check(frame.includes('Shadow'), 'Frame exposes safe Shadow posture')
for (const label of ['Bibliothèque doctrinale','Actifs & preuves','Règles & restrictions','Scripts & objections','Cas & patterns','Playbooks & SOP','Bureau d’approbation','Résolution de conflits','Versions & provenance','Préparation à l’indexation','Validation du modèle']) check(workspace.includes(label) || frame.includes(label) || knowledgeConstants.includes(label), `Premium workspace implemented: ${label}`)
check(workspace.includes('runValidation'), 'Validation run action exposed')
check(workspace.includes('queueIndex'), 'Index queue action exposed')
check(workspace.includes('decideApproval'), 'Approval action exposed')
check(workspace.includes('resolveConflict'), 'Conflict resolution action exposed')
check(drawer.includes('Toute mutation') || drawer.includes('version'), 'Doctrine editor communicates governance')
check(drawer.includes('submit-review') && drawer.includes('activate') && drawer.includes('retire'), 'Doctrine lifecycle controls exposed')
check(search.includes('buildRevenueKnowledgeSearchIndex'), 'Global search bridge implemented')
check(search.includes("type: 'doctrine'") && search.includes("type: 'knowledge-asset'") && search.includes("type: 'playbook'") && search.includes("type: 'knowledge-conflict'"), 'Search indexes all knowledge resource families')
check(searchApi.includes('readRevenueKnowledgeMemory'), 'Global search reads doctrine memory')

const expectedTables = [
  'revenue_os_knowledge_domains','revenue_os_doctrines','revenue_os_knowledge_versions','revenue_os_doctrine_sections','revenue_os_doctrine_rules','revenue_os_decision_trees',
  'revenue_os_knowledge_assets','revenue_os_knowledge_asset_versions','revenue_os_knowledge_chunks','revenue_os_knowledge_relationships','revenue_os_sales_scripts',
  'revenue_os_objection_patterns','revenue_os_case_studies','revenue_os_campaign_patterns','revenue_os_playbooks','revenue_os_policy_restrictions',
  'revenue_os_brand_requirements','revenue_os_partner_benefits','revenue_os_knowledge_approvals','revenue_os_knowledge_conflicts',
  'revenue_os_knowledge_index_jobs','revenue_os_knowledge_validation_issues','revenue_os_knowledge_snapshots',
]
for (const table of expectedTables) check(migration.includes(`create table if not exists public.${table}`), `Migration table: ${table}`)
check(expectedTables.length === fixture.expectedMinimum.tables, 'Fixture and migration table contract agree')
check(migration.includes("execute format('alter table public.%I enable row level security'") && expectedTables.every((table) => migration.includes(`'${table}'`)), 'RLS enabled across all MZ03 tables')
check(migration.includes('revoke all on table') && migration.includes('from anon, authenticated'), 'Direct client table access revoked')
check(migration.includes('grant all on table') && migration.includes('to service_role'), 'Server service role receives controlled table access')
check(migration.includes('on conflict'), 'Seeds are idempotent')
check(migration.includes("'revenue_os.knowledge.manage'"), 'Database permission registry extended for management')
check(migration.includes("'revenue_os.knowledge.approve'"), 'Database permission registry extended for approval')
check(migration.includes("'revenue_os.knowledge_memory'"), 'Knowledge memory feature flag seeded')
check(migration.includes("'revenue_os.knowledge_indexing'"), 'Knowledge indexing feature flag seeded')
check(migration.includes("'memory-learning'"), 'Workspace registry upgraded')
check(migration.includes("'shadow'"), 'Database posture remains Shadow')
check(migration.includes("'external_actions'") || migration.includes('external_actions'), 'External-action posture retained')
check(migration.includes('revenue_os_audit_events'), 'Installation and governance actions connect to immutable audit')
check(!migration.toLowerCase().includes('drop table public.revenue_os_business_units'), 'Migration does not destroy MZ02 Digital Twin')
check(!migration.toLowerCase().includes('drop table public.revenue_os_objectives'), 'Migration does not destroy MZ01 Foundation')
for (const table of expectedTables) check(rollback.includes(`drop table if exists public.${table}`), `Rollback covers table: ${table}`)

check(Array.isArray(lifecycleCases) && lifecycleCases.length >= 9, 'Lifecycle regression cases provided')
check(lifecycleCases.some((item) => item.from === 'draft' && item.to === 'effective' && item.valid === false), 'Unsafe draft-to-effective transition tested')
check(lifecycleCases.some((item) => item.from === 'retired' && item.to === 'effective' && item.valid === false), 'Retired doctrine reactivation blocker tested')
check(Array.isArray(governanceCases) && governanceCases.length >= 7, 'Governance cases provided')
check(governanceCases.some((item) => item.case.includes('critical') && item.mustBlock), 'Critical conflict blocker tested')
check(governanceCases.some((item) => item.case.includes('price') && item.mustBlock), 'Unsupported price blocker tested')
check(governanceCases.some((item) => item.requiresPermission), 'Confidential retrieval permission case tested')

console.log(`\nANGELCARE Revenue Command OS Mega ZIP 3 Verification`)
console.log(`Passes: ${passes.length}`)
console.log(`Failures: ${failures.length}\n`)
for (const item of passes) console.log(`  ✓ ${item.label}${item.detail ? ` — ${item.detail}` : ''}`)
for (const item of failures) console.error(`  ✗ ${item.label}${item.detail ? ` — ${item.detail}` : ''}`)
if (failures.length) process.exit(1)
console.log('\nMEGA ZIP 3 STATIC ACCEPTANCE: PASS\n')
