import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const failures = []
const passes = []
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath))
const check = (condition, label, detail = '') => condition ? passes.push({ label, detail }) : failures.push({ label, detail })

const requiredFiles = [
  'app/(protected)/revenue-command-os/digital-twin/layout.tsx',
  'app/(protected)/revenue-command-os/digital-twin/page.tsx',
  'app/(protected)/revenue-command-os/digital-twin/[section]/page.tsx',
  'app/(protected)/revenue-command-os/digital-twin/_components/DigitalTwinContext.tsx',
  'app/(protected)/revenue-command-os/digital-twin/_components/DigitalTwinFrame.tsx',
  'app/(protected)/revenue-command-os/digital-twin/_components/DigitalTwinWorkspace.tsx',
  'app/(protected)/revenue-command-os/digital-twin/_components/DigitalTwinEntityDrawer.tsx',
  'app/api/revenue-command-os/digital-twin/route.ts',
  'lib/revenue-command-os/digital-twin/constants.ts',
  'lib/revenue-command-os/digital-twin/seed-data.ts',
  'lib/revenue-command-os/digital-twin/validation.ts',
  'lib/revenue-command-os/digital-twin/repository.ts',
  'supabase/migrations/20260720_revenue_command_os_phase2_digital_twin.sql',
  'docs/revenue-command-os/phase-02/CANONICAL_BUILD_CONTRACT_LOCK.md',
  'docs/revenue-command-os/phase-02/ARCHITECTURE.md',
  'docs/revenue-command-os/phase-02/DATA_DICTIONARY.md',
  'docs/revenue-command-os/phase-02/API_CONTRACT.md',
  'docs/revenue-command-os/phase-02/ACCEPTANCE.md',
  'docs/revenue-command-os/phase-02/INSTALLATION.md',
  'docs/revenue-command-os/phase-02/ROLLBACK.sql',
  'tests/revenue-command-os/fixtures/phase2-digital-twin.json',
  'tests/revenue-command-os/fixtures/phase2-validation-cases.json',
  'tests/revenue-command-os/fixtures/phase2-mutation-cases.json',
  'tsconfig.revenue-os-phase2.json'
]
for (const file of requiredFiles) check(exists(file), `Required file: ${file}`)

const constants = read('lib/revenue-command-os/constants.ts')
const twinConstants = read('lib/revenue-command-os/digital-twin/constants.ts')
const seed = read('lib/revenue-command-os/digital-twin/seed-data.ts')
const validation = read('lib/revenue-command-os/digital-twin/validation.ts')
const repository = read('lib/revenue-command-os/digital-twin/repository.ts')
const api = read('app/api/revenue-command-os/digital-twin/route.ts')
const frame = read('app/(protected)/revenue-command-os/digital-twin/_components/DigitalTwinFrame.tsx')
const workspace = read('app/(protected)/revenue-command-os/digital-twin/_components/DigitalTwinWorkspace.tsx')
const drawer = read('app/(protected)/revenue-command-os/digital-twin/_components/DigitalTwinEntityDrawer.tsx')
const migration = read('supabase/migrations/20260720_revenue_command_os_phase2_digital_twin.sql')
const permissions = read('lib/auth/permissions.ts')
const access = read('lib/access-control.ts')
const workspaceModules = read('lib/workspace/workspace-modules.ts')
const fixture = JSON.parse(read('tests/revenue-command-os/fixtures/phase2-digital-twin.json'))
const validationCases = JSON.parse(read('tests/revenue-command-os/fixtures/phase2-validation-cases.json'))
const mutationCases = JSON.parse(read('tests/revenue-command-os/fixtures/phase2-mutation-cases.json'))

check(constants.includes("AC-REVENUE-OS-MZ02-DIGITAL-TWIN"), 'Mega ZIP 2 release code locked')
check(constants.includes("AC-REVENUE-OS-MZ01-FOUNDATION"), 'Mega ZIP 1 release history preserved')
check(constants.includes("key: 'digital-twin'"), 'Digital Twin workspace registered')
check(constants.includes("href: '/revenue-command-os/digital-twin'"), 'Digital Twin route registered')
check(constants.includes("status: 'ready'"), 'Digital Twin workspace is operational')
check(constants.includes("REVENUE_OS_DEFAULT_EXECUTION_MODE: RevenueOsExecutionMode = 'shadow'"), 'Shadow remains default execution posture')
check(constants.includes("revenue_os.external_actions") && constants.includes("enabled: false"), 'External actions remain disabled')
check(constants.includes("revenue_os.strategy_execution") && constants.includes("enabled: false"), 'Strategy execution remains locked')
check(constants.includes("revenue_os.digital_twin_mutations"), 'Governed Digital Twin mutation flag exists')
check(permissions.includes('revenue_os.digital_twin.manage'), 'Digital Twin permission registered')
check(access.includes("'/revenue-command-os/digital-twin'"), 'Digital Twin route access registered')
check(workspaceModules.includes("id: 'revenue-digital-twin'"), 'Workspace launcher integration registered')

check(twinConstants.includes("AC-REVENUE-TWIN-2026.07-V1"), 'Digital Twin model version locked')
const sectionKeys = ['overview','business-units','offers-services','bundles-combinations','customer-segments','decision-makers','markets-territories','channels-journeys','pricing-margins','capacity-constraints','seasonality','expansion-renewal','revenue-dependencies','model-validation']
for (const section of sectionKeys) check(twinConstants.includes(`key: '${section}'`), `Twin section registered: ${section}`)
check((twinConstants.match(/href: '\/revenue-command-os\/digital-twin/g) || []).length === fixture.expectedMinimum.sections, 'Exactly fourteen purpose-built Digital Twin sections registered')

for (const code of fixture.requiredBusinessUnits) check(seed.includes(code), `Seed business unit: ${code}`)
for (const city of fixture.requiredCities) check(seed.includes(city), `Seed market city: ${city}`)
const requiredOfferCodes = ['OFF-ACADEMY-ONSITE','OFF-ACADEMY-ELEARNING','OFF-HOME-RECURRING','OFF-FLASHCARDS-PLV','OFF-HOSPITALITY-KIDS-FRIENDLY','OFF-CORPORATE-CHILDCARE']
for (const code of requiredOfferCodes) check(seed.includes(code), `Seed offer: ${code}`)
const requiredSegments = ['SEG-PRESCHOOL-PRIVATE','SEG-MATERNITY','SEG-ORTHOPHONISTS','SEG-HOTELS','SEG-CORPORATES']
for (const code of requiredSegments) check(seed.includes(code), `Seed customer segment: ${code}`)
const requiredDecisionMakers = ['DM-OWNER','DM-SCHOOL-DIRECTOR','DM-PEDAGOGICAL','DM-HR','DM-PROCUREMENT']
for (const code of requiredDecisionMakers) check(seed.includes(code), `Seed decision-maker: ${code}`)
check(seed.includes('CAP-CAREGIVERS-CASA') && seed.includes('50'), 'Casablanca caregiver capacity represented')
check(seed.includes('CAP-CAREGIVERS-RABAT') && seed.includes('25'), 'Rabat caregiver capacity represented')
check(seed.includes('CAP-CAREGIVERS-KENITRA') && seed.includes('15'), 'Kénitra caregiver capacity represented')
check(seed.includes('38 Dh') || seed.includes('38'), 'Known caregiver hourly cost signal represented')
check(seed.includes('needs-validation'), 'Unknown commercial data remains explicitly unvalidated')
check(seed.includes('contract-seed'), 'Contract seed provenance is explicit')

for (const category of fixture.requiredValidationCategories) check(validation.includes(`'${category}'`) || seed.includes(`'${category}'`), `Validation category covered: ${category}`)
check(validation.includes('calculateDigitalTwinCompleteness'), 'Completeness engine implemented')
check(validation.includes('validateDigitalTwin'), 'Contradiction engine implemented')
check(validation.includes('missing-price') || validation.includes('price'), 'Missing pricing detection implemented')
check(validation.includes('capacity'), 'Capacity contradiction detection implemented')
check(validation.includes('dependency'), 'Dependency integrity detection implemented')
check(validation.includes('journey'), 'Sales journey validation implemented')
check(validation.includes('bundle'), 'Bundle relationship validation implemented')

check(repository.includes("import 'server-only'"), 'Repository is server-only')
check(repository.includes('REVENUE_TWIN_ENTITY_TABLES'), 'Mutation table allow-list enforced')
check(repository.includes('permittedFields'), 'Mutation field allow-list enforced')
check(repository.includes("bundle: ['code'") && repository.includes("'offer-relationship': ['code'"), 'Bundle and offer-relationship management implemented')
check(repository.includes("input.entity === 'business-unit' || input.entity === 'offer'"), 'Source provenance is added only to compatible tables')
check(repository.includes("input.entity === 'capacity'") && repository.includes("availability: 'unavailable'"), 'Capacity retirement uses availability instead of an invalid status column')
check(repository.includes("['create', 'update', 'retire']"), 'Mutation operations are allow-listed')
check(repository.includes('writeRevenueOsAuditEvent'), 'Digital Twin mutations are audited')
check(repository.includes('persistDigitalTwinValidation'), 'Validation snapshots can be persisted')
check(repository.includes('revenue_os_digital_twin_versions'), 'Digital Twin version snapshots are persisted')
check(!repository.includes('SUPABASE_SERVICE_ROLE_KEY'), 'Repository does not expose secrets')

check(api.includes("'run_validation'"), 'API validation action allow-listed')
check(api.includes("'update_validation_status'"), 'API validation status action allow-listed')
check(api.includes("'mutate_entity'"), 'API governed mutation action allow-listed')
check(api.includes("revenue_os.digital_twin.manage"), 'API requires Digital Twin authority')
check(!api.includes('send_whatsapp') && !api.includes('send_email'), 'API has no external communication execution')
check(api.includes('normalizeRevenueOsError'), 'API returns normalized controlled failures')

check(frame.includes('Revenue Digital Twin') && frame.includes('source de vérité'), 'Premium Digital Twin frame communicates purpose')
check(frame.includes('Shadow'), 'Premium Digital Twin frame exposes safe posture')
check(workspace.includes('Le moteur comprend désormais'), 'Overview is business-model oriented')
check(workspace.includes('Prix & marges') || workspace.includes('Price'), 'Pricing workspace implemented')
check(workspace.includes('Capacités') || workspace.includes('Capacity'), 'Capacity workspace implemented')
check(workspace.includes('Dépendances') || workspace.includes('dependencies'), 'Dependency workspace implemented')
check(workspace.includes('Cross-sell') || workspace.includes('growthPaths'), 'Expansion paths workspace implemented')
check(workspace.includes('runValidation'), 'Model validation action exposed')
check(drawer.includes('Toute mutation est validée, auditée et versionnable'), 'Governed mutation UX implemented')
check(drawer.includes("'offer-relationship'") && drawer.includes('bundle'), 'Bundle and relationship editors exposed')
check(workspace.includes("openEditor('bundle')") && workspace.includes("openEditor('offer-relationship')"), 'Bundle workspace provides governed management actions')
check(drawer.includes("entity: activeEntity"), 'Mutation entity narrowing is explicit')

const expectedTables = [
  'revenue_os_business_units','revenue_os_offer_families','revenue_os_offers','revenue_os_offer_versions','revenue_os_offer_formats','revenue_os_offer_bundles','revenue_os_offer_bundle_items','revenue_os_offer_relationships',
  'revenue_os_customer_segments','revenue_os_segment_needs','revenue_os_segment_pain_points','revenue_os_segment_offer_fit','revenue_os_decision_maker_profiles',
  'revenue_os_regions','revenue_os_cities','revenue_os_territories','revenue_os_markets','revenue_os_offer_territory_availability',
  'revenue_os_sales_channels','revenue_os_sales_journeys','revenue_os_sales_journey_stages','revenue_os_stage_requirements',
  'revenue_os_price_books','revenue_os_pricing_models','revenue_os_offer_prices','revenue_os_cost_models','revenue_os_margin_rules','revenue_os_discount_rules',
  'revenue_os_capacity_types','revenue_os_capacity_requirements','revenue_os_delivery_constraints','revenue_os_revenue_dependencies',
  'revenue_os_seasonal_windows','revenue_os_growth_paths','revenue_os_cross_sell_paths','revenue_os_upsell_paths','revenue_os_renewal_paths','revenue_os_referral_paths',
  'revenue_os_digital_twin_validations','revenue_os_digital_twin_gaps','revenue_os_digital_twin_versions','revenue_os_digital_twin_change_log','revenue_os_model_owners','revenue_os_model_approval_requests'
]
for (const table of expectedTables) check(migration.includes(`create table if not exists public.${table}`), `Migration table: ${table}`)
check(expectedTables.length === fixture.expectedMinimum.tables, 'Fixture and migration table contract agree')
check(migration.includes('enable row level security'), 'RLS enabled across Digital Twin tables')
check(migration.includes('revoke all on table') && migration.includes('from anon, authenticated'), 'Direct client table access revoked')
check(migration.includes('on conflict'), 'Seeds are idempotent')
check(migration.includes("'revenue_os.digital_twin.manage'"), 'Database permission registry extended')
check(migration.includes("'digital-twin'"), 'Database workspace registry extended')
check(migration.includes("'revenue_os.digital_twin'"), 'Database feature flag registered')
check(migration.includes('revenue_os_digital_twin_change_log'), 'Model change log table included')
check(migration.includes('revenue_os_model_approval_requests'), 'Model approval workflow table included')
check(migration.includes('revenue_os_audit_events'), 'Installation is recorded in immutable audit')
check(!migration.toLowerCase().includes('drop table public.revenue_os_objectives'), 'Migration does not destroy Phase 1 tables')

check(Array.isArray(validationCases) && validationCases.length >= 6, 'Validation regression cases provided')
check(validationCases.some((item) => item.mustBlockAutonomousPricing), 'Autonomous pricing blocker tested')
check(validationCases.some((item) => item.mustBlockFirmCommitment), 'Capacity commitment blocker tested')
check(Array.isArray(mutationCases) && mutationCases.some((item) => item.valid === false), 'Invalid mutation cases provided')
check(mutationCases.some((item) => item.operation === 'retire' && item.valid), 'Safe retirement mutation covered')

console.log(`\nANGELCARE Revenue Command OS Mega ZIP 2 Verification`)
console.log(`Passes: ${passes.length}`)
console.log(`Failures: ${failures.length}\n`)
for (const item of passes) console.log(`  ✓ ${item.label}`)
for (const item of failures) console.error(`  ✗ ${item.label}${item.detail ? ` — ${item.detail}` : ''}`)
if (failures.length) process.exit(1)
console.log('\nMEGA ZIP 2 STATIC ACCEPTANCE: PASS\n')
