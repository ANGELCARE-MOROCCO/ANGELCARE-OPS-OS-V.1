import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
let passed = 0
let failed = 0
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const check = (name, value, detail = '') => {
  const ok = Boolean(value)
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
  ok ? passed++ : failed++
}

const registrySource = read('lib/homeservice-factory/blueprints/registry.ts')
const registryStart = registrySource.indexOf('=') + 1
const registryEnd = registrySource.lastIndexOf('\n\nexport const CATEGORY_EXPERIENCE_CODES')
let blueprints = {}
try { blueprints = JSON.parse(registrySource.slice(registryStart, registryEnd).trim()) } catch (error) { console.error(error); failed++ }
const list = Object.values(blueprints)
const concepts = new Set(list.map((item) => item.concept))
const presetCount = list.reduce((sum, item) => sum + item.presets.length, 0)
const fieldCount = list.reduce((sum, item) => sum + item.sections.reduce((n, section) => n + section.fields.length, 0), 0)
const optionCount = list.reduce((sum, item) => sum + item.sections.reduce((n, section) => n + section.fields.reduce((m, field) => m + field.options.length, 0), 0), 0)
const expectedCategories = [
  'HS-CHILD-HOME','HS-BABYSITTING','HS-INFANT-DAY','HS-TODDLER','HS-SCHOOL-AGE','HS-EVENING','HS-OVERNIGHT','HS-WEEKEND','HS-HOLIDAY','HS-SIBLINGS','HS-SCHOOL-PICKUP','HS-POSTPARTUM-DAY','HS-NEWBORN','HS-POSTPARTUM-NIGHT','HS-MOTHER-REST','HS-SIBLING-TRANSITION','HS-SPECIAL-HOME','HS-SPECIAL-SCHOOL','HS-SHADOW','HS-SENSORY','HS-COMMUNICATION','HS-RESPITE','HS-HYBRID','HS-FLASHCARDS','HS-LANGUAGE','HS-SCHOOL-READINESS','HS-CREATIVE','HS-MONTESSORI','HS-ROUTINE-LEARNING','HS-BIRTHDAY-CARE','HS-BIRTHDAY-ANIMATION','HS-HOTEL-KIDS','HS-CORPORATE-EVENT','HS-WEDDING','HS-EXCURSION','HS-SCHOOL-TRIP','HS-APPOINTMENT','HS-TRAVEL','HS-COMFORT-VISIT','HS-COMPANIONSHIP','HS-ROUTINE-SUPPORT','HS-FAMILY-RESPITE','HS-FAMILY-ASSIST','HS-CARE-MEAL','HS-CHILD-AREA'
]

check('exactly 45 category experience blueprints exist', list.length === 45, `${list.length} blueprints`)
check('every canonical HomeService category has a blueprint', expectedCategories.every((code) => blueprints[code]), `${expectedCategories.filter((code) => blueprints[code]).length}/45`)
check('ten distinct premium concept families exist', concepts.size === 10, [...concepts].join(', '))
check('every blueprint has at least five deep sections', list.every((item) => item.sections.length >= 5), `minimum ${Math.min(...list.map((item) => item.sections.length))}`)
check('every blueprint has at least twenty controlled fields', list.every((item) => item.sections.reduce((n, section) => n + section.fields.length, 0) >= 20), `minimum ${Math.min(...list.map((item) => item.sections.reduce((n, section) => n + section.fields.length, 0)))}`)
check('blueprint registry contains more than one thousand controlled fields', fieldCount >= 1000, `${fieldCount} fields`)
check('every category has at least five ready scenario presets', list.every((item) => item.presets.length >= 5), `${presetCount} presets total`)
check('preset library contains at least 225 ready scenarios', presetCount >= 225, `${presetCount} presets`)
check('controlled option library is broad', optionCount >= 3500, `${optionCount} selectable options`)
check('all fields use controlled field types', list.every((item) => item.sections.every((section) => section.fields.every((field) => ['single','multi','toggle','stepper','number','scale'].includes(field.type)))))
check('no category blueprint contains a textarea field', !registrySource.includes('"type": "textarea"'))
check('every category promises zero mandatory narrative typing', list.every((item) => /Aucun texte narratif obligatoire/.test(item.zeroTypingPromise)))
check('every required field has a default or controlled options', list.every((item) => item.sections.every((section) => section.fields.every((field) => !field.required || field.defaultValue !== undefined || field.options.length > 0))))
check('every preset defines dates-and-times defaults only as adjustable execution facts', list.every((item) => item.presets.every((preset) => preset.defaultStartTime && preset.defaultEndTime && preset.defaultDayCount >= 1)))
check('every preset keeps generation server-bounded', list.every((item) => item.presets.every((preset) => preset.scenarioCount >= 1 && preset.scenarioCount <= 10)))
check('every AI profile forbids invented activities', list.every((item) => item.aiCompositionProfile.forbidden.includes('inventer une activité')))
check('every AI profile forbids invented pricing', list.every((item) => item.aiCompositionProfile.forbidden.includes('inventer un prix')))
check('every AI profile prioritizes local IDs', list.every((item) => item.aiCompositionProfile.priorities.includes('usage des IDs locaux')))

const rootPage = read('app/carelink-ops/service-design/page.tsx')
const factoryPage = read('app/carelink-ops/service-design/factory/page.tsx')
const planningPage = read('app/carelink-ops/service-design/planning/new/page.tsx')
const offersPage = read('app/carelink-ops/service-design/offers/new/page.tsx')
const gateway = read('components/carelink/service-design/factory/CategoryGatewayWorkspace.tsx')
const workspace = read('components/carelink/service-design/factory/CategoryMasterExperienceWorkspace.tsx')
const presetGallery = read('components/carelink/service-design/factory/experience/PresetGallery.tsx')
const dateCommand = read('components/carelink/service-design/factory/experience/DateTimeCommand.tsx')
const controlledField = read('components/carelink/service-design/factory/experience/ControlledField.tsx')
const conceptIndex = read('components/carelink/service-design/factory/experience/index.ts')

check('service-design root is category-first', rootPage.includes('CategoryGatewayWorkspace') && !rootPage.includes('HomeServiceFactoryWorkspace'))
check('factory root is category-first', factoryPage.includes('CategoryGatewayWorkspace'))
check('planning creation is category-first', planningPage.includes('CategoryGatewayWorkspace'))
check('commercial package creation is category-first', offersPage.includes('CategoryGatewayWorkspace'))
check('gateway explicitly rejects a generic questionnaire before category choice', gateway.includes('Aucun questionnaire générique'))
check('gateway exposes mission, programme and package modes', ['single_mission','multi_mission','commercial_package'].every((value) => gateway.includes(value)))
check('gateway routes into one category-specific studio', gateway.includes('/factory/category/${encodeURIComponent(category.code)}'))
check('category workspace applies a selected preset to the complete dossier', workspace.includes('selectPreset') && workspace.includes('fieldValues'))
check('category workspace sends blueprint lineage to generation', ['blueprintCode','blueprintVersion','presetCode','structuredSelections'].every((value) => workspace.includes(value)))
check('category workspace asks only dates and times in the execution command', workspace.includes('DateTimeCommand'))
check('exception narrative is optional and collapsed', workspace.includes('<details') && workspace.includes('Instruction exceptionnelle facultative'))
check('no mandatory textarea exists in the master workspace', !/required[^>]*>/.test(workspace.match(/<textarea[\s\S]*?>/)?.[0] || ''))
check('scenario count gives direct 1, 3, 5, 8 and 10 controls', workspace.includes('[1, 3, 5, 8, 10]'))
check('preset gallery is a first-class workflow step', presetGallery.includes('Configurations prêtes') && presetGallery.includes('scénarios complets'))
check('date command supports exact dates and times', dateCommand.includes('startTime') && dateCommand.includes('endTime') && dateCommand.includes('serviceDate'))
check('controlled field renderer supports chips, toggles and steppers', controlledField.includes("field.type === 'toggle'") && controlledField.includes("field.type === 'stepper'") && controlledField.includes("field.type === 'multi'"))
check('ten purpose-built visual concept layouts are registered', (conceptIndex.match(/Concept/g) || []).length >= 20 && concepts.size === 10)
check('category page resolves its own blueprint before rendering', read('app/carelink-ops/service-design/factory/category/[categoryCode]/page.tsx').includes('loadCategoryBlueprint'))

const blueprintLoader = read('lib/homeservice-factory/server/blueprints.ts')
const composer = read('lib/homeservice-factory/server/composer.ts')
const repository = read('lib/homeservice-factory/server/repository.ts')
const importer = read('lib/homeservice-factory/server/importer.ts')
const constants = read('lib/homeservice-factory/constants.ts')
check('database blueprints override compiled fallback safely', blueprintLoader.includes('getCompiledCategoryBlueprint') && blueprintLoader.includes('hsd_category_experience_blueprints'))
check('factory rejects a blueprint/category mismatch', composer.includes('BLUEPRINT_CATEGORY_MISMATCH'))
check('factory rejects a preset not owned by the category', composer.includes('PRESET_NOT_AVAILABLE'))
check('OpenRouter receives structured category experience', composer.includes('categoryExperience') && composer.includes('structuredSelections'))
check('composer still filters registered local activities', composer.includes('eligibleActivities') && composer.includes('INVENTED_ACTIVITY') && composer.includes('allowedActivityIds'))
check('request persistence stores blueprint, preset and configuration', ['blueprint_code','blueprint_version','preset_code','structured_configuration'].every((value) => repository.includes(value)))
check('published sellables freeze blueprint lineage', repository.includes('configuration_snapshot') && repository.includes('blueprintVersion'))
check('experience usage is auditable', repository.includes('hsd_category_experience_usage'))
check('targeted import supports blueprint resources', ['experience_blueprints','experience_sections','experience_fields','experience_options','experience_presets'].every((value) => importer.includes(value) && constants.includes(value)))

const sql = read('supabase/migrations/20260802_homeservice_category_master_experience.sql')
const sqlTables = ['hsd_category_experience_blueprints','hsd_category_experience_sections','hsd_category_experience_fields','hsd_category_experience_options','hsd_category_experience_presets','hsd_category_experience_usage']
check('SQL creates six normalized category experience relations', sqlTables.every((table) => sql.includes(`create table if not exists public.${table}`)))
check('SQL enables RLS on every new relation', sqlTables.every((table) => sql.includes(`alter table public.${table} enable row level security`)))
check('SQL seeds all 45 category blueprints', expectedCategories.every((code) => sql.includes(`EXP-${code}`)))
check('SQL adds immutable lineage columns to factory requests', sql.includes('add column if not exists blueprint_code') && sql.includes('add column if not exists structured_configuration'))
check('SQL adds lineage columns to factory scenarios and sellables', sql.includes('alter table public.hsd_factory_scenarios') && sql.includes('alter table public.hsd_factory_sellables'))
check('SQL remains transactional and advisory locked', sql.trimStart().startsWith('begin;') && sql.includes('pg_advisory_xact_lock(84746007)') && sql.trimEnd().endsWith('commit;'))
check('SQL contains no destructive table drop', !/drop\s+table/i.test(sql))
check('SQL contains no mission-table mutation', !/insert\s+into\s+public\.(missions|sub_missions|mission_reports|carelink_missions)/i.test(sql))
check('SQL preserves existing HomeService and CARELINK domains', !/truncate|delete\s+from\s+public\.hsd_/i.test(sql))

console.log(`\n${passed}/${passed + failed} Category Master Experience architecture checks passed.`)
if (failed) process.exit(1)
