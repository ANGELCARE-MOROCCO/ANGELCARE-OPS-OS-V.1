import fs from 'node:fs'
import path from 'node:path'

const app = process.cwd()
let pass = 0
let fail = 0
const failures = []
function ok(condition, label) {
  if (condition) { pass += 1; console.log(`PASS ${String(pass).padStart(3,'0')}  ${label}`) }
  else { fail += 1; failures.push(label); console.log(`FAIL      ${label}`) }
}
function exists(relative) { return fs.existsSync(path.join(app, relative)) }
function read(relative) { return fs.readFileSync(path.join(app, relative), 'utf8') }
function has(relative, marker) { return exists(relative) && read(relative).includes(marker) }

console.log('======================================================================')
console.log(' ANGELCARE MARKETPLACE — CATEGORY-NATIVE MZ1 CONTRACTUAL VERIFIER')
console.log('======================================================================')

const core = [
  'angelcare-marketplace/category-native/types.ts',
  'angelcare-marketplace/category-native/registry.ts',
  'angelcare-marketplace/category-native/registry.manifest.json',
  'angelcare-marketplace/category-native/validation.ts',
  'angelcare-marketplace/category-native/repository.ts',
  'angelcare-marketplace/category-native/api-handlers.ts',
  'angelcare-marketplace/category-native/admin-pages.tsx',
  'angelcare-marketplace/category-native/category-native.module.css',
]
for (const file of core) ok(exists(file), `core ${file}`)

const components = ['CategoryNativeCommand','SchemaArchitectureStudio','ArchetypeStudio','CsvTemplateFactory','CsvImportStudio','HomepageDesigner2','CategoryNativeClient']
for (const component of components) ok(exists(`angelcare-marketplace/category-native/components/${component}.tsx`), `component ${component}`)

const pages = [
  'app/angelcare-marketplace/(protected)/admin/category-native/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/category-native/schemas/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/category-native/archetypes/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/category-native/archetypes/[schemaKey]/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/category-native/template-factory/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/category-native/imports/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/category-native/homepage-designer/page.tsx',
]
for (const file of pages) ok(exists(file), `page ${file}`)

const apiRoutes = [
  'app/api/angelcare-marketplace/admin/category-native/summary/route.ts',
  'app/api/angelcare-marketplace/admin/category-native/schemas/route.ts',
  'app/api/angelcare-marketplace/admin/category-native/schemas/[schemaKey]/route.ts',
  'app/api/angelcare-marketplace/admin/category-native/schemas/[schemaKey]/[action]/route.ts',
  'app/api/angelcare-marketplace/admin/category-native/schemas/[schemaKey]/fields/route.ts',
  'app/api/angelcare-marketplace/admin/category-native/schemas/[schemaKey]/fields/[fieldId]/route.ts',
  'app/api/angelcare-marketplace/admin/category-native/schemas/[schemaKey]/fields/reorder/route.ts',
  'app/api/angelcare-marketplace/admin/category-native/schemas/[schemaKey]/template/route.ts',
  'app/api/angelcare-marketplace/admin/category-native/imports/route.ts',
  'app/api/angelcare-marketplace/admin/category-native/imports/[jobId]/route.ts',
  'app/api/angelcare-marketplace/admin/category-native/imports/[jobId]/[action]/route.ts',
  'app/api/angelcare-marketplace/admin/category-native/homepage-blocks/route.ts',
]
for (const file of apiRoutes) ok(exists(file), `API ${file}`)
for (const file of apiRoutes.filter((entry) => entry.includes('['))) {
  const source = read(file)
  ok(source.includes('params:Promise<') && source.includes('context.params'), `Next route context ${file}`)
}

const registry = JSON.parse(read('angelcare-marketplace/category-native/registry.manifest.json'))
ok(Array.isArray(registry.schemas) && registry.schemas.length === 31, '31 category-native schemas registered')
ok(Array.isArray(registry.blocks) && registry.blocks.length >= 16, '16+ category-aware homepage blocks registered')
const fieldCount = registry.schemas.reduce((total, schema) => total + schema.fields.length, 0)
ok(fieldCount >= 800, `${fieldCount} governed fields registered`)
const templateDir = path.join(app,'angelcare-marketplace/documentation/category-native-mz1/csv-templates')
const csvFiles = exists('angelcare-marketplace/documentation/category-native-mz1/csv-templates') ? fs.readdirSync(templateDir).filter((file) => file.endsWith('.csv')) : []
ok(csvFiles.length === registry.schemas.length, 'one reference CSV template per schema')

const requiredSchemas = [
  'home-childcare-one-time','home-childcare-recurring','school-pickup-care','overnight-extended-care','emergency-last-minute-care',
  'hotel-travel-childcare','events-group-childcare','holiday-excursion-programme','montessori-home-service','learning-homework-support',
  'non-medical-support-service','flashcards-learning-product','montessori-development-kit','development-game','activity-subscription-box',
  'digital-learning-resource','preschool-admission','academy-course','academy-cohort','certification-pathway','parent-workshop',
  'institutional-training','school-managed-programme','school-staff-reinforcement','hospitality-kids-programme','corporate-childcare-benefit',
  'health-adjacent-programme','event-venue-programme','partner-os-plan','quality-check-assessment','custom-managed-solution',
]
const keys = new Set(registry.schemas.map((schema) => schema.schema_key))
for (const key of requiredSchemas) ok(keys.has(key), `archetype ${key}`)

for (const schema of registry.schemas) {
  ok(Boolean(schema.admin_studio_template && schema.public_experience_template && schema.conversion_template && schema.operations_handover_type), `continuity ${schema.schema_key}`)
  ok(Array.isArray(schema.fields) && schema.fields.some((field) => field.csv_enabled) && schema.fields.some((field) => field.admin_visible), `admin/CSV fields ${schema.schema_key}`)
}

const sqlFile = 'supabase/migrations/20260806050000_angelcare_marketplace_category_native_commerce_control_plane_mz1.sql'
const rollbackFile = 'angelcare-marketplace/database/rollback/20260806050000_angelcare_marketplace_category_native_mz1_SAFE_ROLLBACK.sql'
ok(exists(sqlFile), 'additive migration exists')
ok(exists(rollbackFile), 'data-preserving rollback exists')
const sql = read(sqlFile).toLowerCase()
for (const table of [
  'angelcare_marketplace_experience_schemas','angelcare_marketplace_experience_schema_fields','angelcare_marketplace_experience_variant_groups',
  'angelcare_marketplace_schema_csv_templates','angelcare_marketplace_category_native_import_jobs','angelcare_marketplace_category_native_import_rows',
  'angelcare_marketplace_homepage_block_definitions','angelcare_marketplace_experience_schema_versions',
]) ok(sql.includes(`create table if not exists public.${table}`), `SQL table ${table}`)
for (const column of ['experience_schema_key','experience_configuration','block_definition_key','experience_schema_keys','responsive_config','design_config','device_visibility']) ok(sql.includes(`add column if not exists ${column}`), `canonical extension ${column}`)
ok(!/\bdrop\s+table\b|\btruncate\b/.test(sql), 'migration contains no destructive DROP TABLE/TRUNCATE')
const rollback = read(rollbackFile).toLowerCase()
ok(!/\bdrop\s+table\b|\btruncate\b|\bdelete\s+from\b/.test(rollback), 'rollback preserves all records')
ok(rollback.includes("status='paused'") && rollback.includes("status='disabled'"), 'rollback disables interfaces without deleting data')

const permissions = ['marketplace.experience_schema.view','marketplace.experience_schema.manage','marketplace.archetype.view','marketplace.archetype.manage','marketplace.category_native_import.view','marketplace.category_native_import.manage']
for (const permission of permissions) {
  ok(has('angelcare-marketplace/domain/types.ts', permission), `permission union ${permission}`)
  ok(has('angelcare-marketplace/domain/constants.ts', permission), `permission fallback ${permission}`)
  ok(has('angelcare-marketplace/permissions/permission-catalog.ts', permission), `permission catalog ${permission}`)
  ok(sql.includes(permission), `permission SQL ${permission}`)
}

ok(has('angelcare-marketplace/commerce-studio/components/HomepageComposerStudio.tsx','HomepageDesigner2'), 'legacy homepage route upgraded to Designer 2.0')
ok(has('angelcare-marketplace/commerce-studio/components/CommerceStudioCommand.tsx','Category-Native Engine'), 'Commerce Studio links Category-Native Engine')
ok(has('angelcare-marketplace/category-native/components/HomepageDesigner2.tsx','COMPONENT LIBRARY'), 'Homepage Designer has visual component library')
ok(has('angelcare-marketplace/category-native/components/HomepageDesigner2.tsx','AR RTL'), 'Homepage Designer has structural RTL preview switch')
ok(has('angelcare-marketplace/category-native/components/SchemaArchitectureStudio.tsx','FIELD ARCHITECTURE'), 'Schema Studio exposes field architecture matrix')
ok(has('angelcare-marketplace/category-native/components/CsvImportStudio.tsx','Dry-run'), 'Import Studio exposes dry-run workflow')
ok(has('angelcare-marketplace/category-native/repository.ts','rollbackImportJob'), 'import rollback implementation exists')
ok(has('angelcare-marketplace/category-native/repository.ts','executeImportJob'), 'import execution implementation exists')
ok(has('angelcare-marketplace/category-native/repository.ts','refreshCommerceSurfaces'), 'publication refresh is wired')
ok(!has('angelcare-marketplace/category-native/category-native.module.css',':global('), 'CSS Module does not leak global selectors')
ok(!has('angelcare-marketplace/category-native/api-handlers.ts','@ts-ignore'), 'no TypeScript ignore directive')
ok(!has('angelcare-marketplace/category-native/repository.ts',' as any'), 'no explicit any cast in repository')

const docs = [
  'angelcare-marketplace/documentation/category-native-mz1/ARCHETYPE_REGISTER.md',
  'angelcare-marketplace/documentation/category-native-mz1/IMPLEMENTATION_REPORT.md',
  'angelcare-marketplace/documentation/category-native-mz1/OPERATOR_GUIDE.md',
  'angelcare-marketplace/documentation/category-native-mz1/API_ROUTE_REGISTER.md',
  'angelcare-marketplace/documentation/category-native-mz1/FINAL_ACCEPTANCE_REPORT.md',
]
for (const file of docs) ok(exists(file), `documentation ${path.basename(file)}`)

console.log('\n======================================================================')
console.log(`PASS ${pass}`)
console.log(`FAIL ${fail}`)
if (fail) {
  for (const item of failures) console.log(`  ✗ ${item}`)
  console.log('RESULT: CATEGORY-NATIVE MZ1 CONTRACTUAL ACCEPTANCE FAILED')
  process.exit(1)
}
console.log('RESULT: CATEGORY-NATIVE MZ1 CONTRACTUAL ACCEPTANCE PASSED')
