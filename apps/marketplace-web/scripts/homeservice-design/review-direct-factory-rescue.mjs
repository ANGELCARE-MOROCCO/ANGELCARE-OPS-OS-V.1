import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
let passed = 0
let failed = 0
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const exists = (file) => fs.existsSync(path.join(root, file))
const check = (name, value, detail = '') => {
  console.log(`${value ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
  value ? passed++ : failed++
}

const required = [
  'types/homeservice-factory.ts',
  'lib/homeservice-factory/server/catalogue.ts',
  'lib/homeservice-factory/server/composer.ts',
  'lib/homeservice-factory/server/importer.ts',
  'lib/homeservice-factory/server/repository.ts',
  'components/carelink/service-design/factory/HomeServiceFactoryWorkspace.tsx',
  'components/carelink/service-design/factory/DoctrineCommandWorkspace.tsx',
  'components/carelink/service-design/factory/DoctrineImportStudio.tsx',
  'app/api/carelink-ops/service-design/factory/generate/route.ts',
  'app/api/carelink-ops/service-design/factory/import/route.ts',
  'app/api/carelink-ops/service-design/factory/publish/route.ts',
  'app/carelink-ops/service-design/factory/page.tsx',
  'supabase/migrations/20260802_homeservice_direct_factory_rescue.sql',
]
for (const file of required) check(`required ${file}`, exists(file))

const composer = read('lib/homeservice-factory/server/composer.ts')
const importer = read('lib/homeservice-factory/server/importer.ts')
const catalogue = read('lib/homeservice-factory/server/catalogue.ts')
const workspace = read('components/carelink/service-design/factory/HomeServiceFactoryWorkspace.tsx')
const doctrine = read('components/carelink/service-design/factory/DoctrineCommandWorkspace.tsx')
const shell = read('components/carelink/service-design/HomeServiceDesignShell.tsx')
const constants = read('lib/homeservice-design/constants.ts')
const sql = read('supabase/migrations/20260802_homeservice_direct_factory_rescue.sql')
const publish = read('lib/homeservice-factory/server/repository.ts')

check('root workspace is factory-first', read('app/carelink-ops/service-design/page.tsx').includes('HomeServiceFactoryWorkspace'))
check('three dominant creation actions exist', ['Créer une mission', 'Créer un programme', 'Composer un package'].every((text) => workspace.includes(text)))
check('local catalogue is composition authority', catalogue.includes("hsd_service_categories") && catalogue.includes("hsd_activity_library") && catalogue.includes("hsd_price_entries"))
check('draft imported records remain immediately usable', catalogue.includes("'draft', 'active', 'approved', 'review', 'published'"))
check('AI receives exact local activity IDs', composer.includes('eligibleActivities: activities.map') && composer.includes('activity.id'))
check('invented activities are rejected', composer.includes("code: 'INVENTED_ACTIVITY'"))
check('AI route remains OpenRouter Free', composer.includes("providerRoute: 'openrouter/free'") && composer.includes('composeFreePlan'))
check('no Tavily in ordinary factory runtime', !composer.toLowerCase().includes('tavily') && !catalogue.toLowerCase().includes('tavily'))
check('provider failure is explicit', composer.includes('Aucun faux résultat'))
check('doctrine absence is warning not blocker', composer.includes('Doctrine absente') && composer.includes('la composition reste possible'))
check('capacity variance is warning not blocker', composer.includes('Avertissement, pas blocage de brouillon'))
check('missing price becomes quote-required', composer.includes('quote_required') && composer.includes('Sur devis'))
check('time plan is deterministic', composer.includes('buildDay') && composer.includes('startTime: time(blockStart)') && composer.includes('endTime: time(blockEnd)'))
check('scenario count is bounded to ten', composer.includes('FACTORY_MAX_SCENARIOS') && sql.includes('between 1 and 10'))
check('direct import supports exact resource domains', ['doctrine_rules','capacity_rules','activities','features','topups','upsells','competencies','materials','risks','checklists','report_fields','pricing'].every((value) => importer.includes(value)))
check('activities import attaches selected category', importer.includes('categoryCodes = Array.from(new Set') && importer.includes('category.code'))
check('competencies import attaches selected category', importer.includes('hsd_service_competency_rules'))
check('materials import attaches selected category', importer.includes('hsd_service_material_links'))
check('valid import rows apply without staging', importer.includes('partially_applied') && !importer.includes('approval_requested'))
check('doctrine page exposes searchable registry', doctrine.includes('Registre de doctrine') && doctrine.includes('Importer une ressource'))
check('direct publication creates separate B2C/B2B sellables', publish.includes('hsd_factory_sellables') && publish.includes("'b2b'") && publish.includes("'b2c'"))
check('published snapshot preserves exact local IDs', publish.includes('activities: scenario.selected_activity_ids') && publish.includes('options: scenario.selected_option_ids'))
check('vitrine consumes direct sellables', read('lib/homeservice-commercial/server/repository.ts').includes('hsd_factory_sellables'))
check('advanced governance is demoted but preserved', exists('app/carelink-ops/service-design/advanced/page.tsx') && shell.toLowerCase().includes('opérations avancées'))
check('six sovereign master universes remain', (constants.match(/key:/g) || []).length >= 6)
check('CARELINK routes remain present', ['app/carelink-ops/page.tsx','app/carelink-ops/missions/page.tsx','app/carelink-ops/dispatch/page.tsx'].every(exists))
check('factory does not write CARELINK mission tables', ![composer, importer, publish].some((source) => /from\(['"]missions['"]\)|from\(['"]sub_missions['"]\)/.test(source)))
check('SQL is additive', !/drop\s+table/i.test(sql))
check('SQL is transactional and locked', /^begin;/m.test(sql) && sql.includes('pg_advisory_xact_lock(84746006)') && /commit;/m.test(sql))
check('SQL creates only rescue governance tables', ['hsd_factory_requests','hsd_factory_scenarios','hsd_factory_sellables','hsd_direct_import_batches'].every((name) => sql.includes(`public.${name}`)))
check('SQL enables RLS on every rescue table', ['hsd_factory_requests','hsd_factory_scenarios','hsd_factory_sellables','hsd_direct_import_batches'].every((name) => sql.includes(`alter table public.${name} enable row level security`)))
check('SQL preserves UMZ1–UMZ5 baseline guard', sql.includes('hsd_production_readiness_controls') && sql.includes('hsd_handoff_requests'))

console.log(`\n${passed}/${passed + failed} HomeService Direct Factory Rescue architecture checks passed.`)
if (failed) process.exit(1)
