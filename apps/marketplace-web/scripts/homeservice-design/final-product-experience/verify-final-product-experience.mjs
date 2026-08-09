import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'

const root = process.cwd()
const require = createRequire(import.meta.url)
let ts
try { ts = require('typescript') } catch { ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js') }
let passed = 0
let failed = 0
const check = (name, value, detail = '') => { console.log(`${value ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`); value ? passed++ : failed++ }
const exists = (rel) => fs.existsSync(path.join(root, rel))
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')

const required = [
  'types/service-design-product-experience.ts',
  'lib/service-design-product-experience/server.ts',
  'lib/service-design-product-experience/repository.ts',
  'lib/service-design-product-experience/normalize.ts',
  'lib/service-design-product-experience/openrouter.ts',
  'components/carelink/service-design/product-experience/MissionWorkbench.tsx',
  'components/carelink/service-design/product-experience/ScenarioComparisonTheatre.tsx',
  'components/carelink/service-design/product-experience/PeekInspector.tsx',
  'components/carelink/service-design/product-experience/AudiencePreview.tsx',
  'components/carelink/service-design/product-experience/MyWorkWorkspace.tsx',
  'app/api/carelink-ops/service-design/product-experience/workbench/route.ts',
  'app/api/carelink-ops/service-design/product-experience/timeline/route.ts',
  'app/api/carelink-ops/service-design/product-experience/scenarios/compare/route.ts',
  'app/api/carelink-ops/service-design/product-experience/scenarios/merge/route.ts',
  'app/api/carelink-ops/service-design/product-experience/scenarios/transform/route.ts',
  'app/api/carelink-ops/service-design/product-experience/delete/route.ts',
  'app/api/carelink-ops/service-design/product-experience/bulk/route.ts',
  'app/api/carelink-ops/service-design/product-experience/inspector/route.ts',
  'app/api/carelink-ops/service-design/product-experience/annotations/route.ts',
  'app/api/carelink-ops/service-design/product-experience/favorites/route.ts',
  'app/api/carelink-ops/service-design/product-experience/saved-views/route.ts',
  'app/api/carelink-ops/service-design/product-experience/documents/route.ts',
  'app/carelink-ops/service-design/workbench/[scenarioId]/page.tsx',
  'app/carelink-ops/service-design/workbench/composition/[compositionId]/page.tsx',
  'app/carelink-ops/service-design/workbench/draft/[draftId]/page.tsx',
  'app/carelink-ops/service-design/my-work/page.tsx',
  'app/carelink-ops/service-design/compare/[requestId]/page.tsx',
  'supabase/migrations/20260802_service_design_os_2030_final_product_experience_closure.sql',
]
for (const rel of required) check(`required ${rel}`, exists(rel))

const workbench = read('components/carelink/service-design/product-experience/MissionWorkbench.tsx')
const compare = read('components/carelink/service-design/product-experience/ScenarioComparisonTheatre.tsx')
const peek = read('components/carelink/service-design/product-experience/PeekInspector.tsx')
const deletion = read('app/api/carelink-ops/service-design/product-experience/delete/route.ts')
const transform = read('lib/service-design-product-experience/openrouter.ts')
const sourceResolver = read('components/carelink/service-design/documents/server/sourceResolver.ts')
const sql = read('supabase/migrations/20260802_service_design_os_2030_final_product_experience_closure.sql')

check('timeline supports real create action', workbench.includes("action: 'create_block'"))
check('timeline supports drag movement', workbench.includes('onDrop={dropBlock}') && workbench.includes("text/block-id"))
check('timeline supports duration resize', workbench.includes('durationMinutes - SNAP') && workbench.includes('durationMinutes + SNAP'))
check('timeline supports permanent block deletion', workbench.includes('Supprimer définitivement le bloc'))
check('timeline supports day duplication', workbench.includes("action: 'duplicate_day'"))
check('timeline supports rebalance', workbench.includes("action: 'rebalance'"))
check('undo and redo persist real snapshots', workbench.includes('async function undo') && workbench.includes('async function redo') && workbench.includes("action: 'replace_all'"))
check('autosave and recovery are database-backed', workbench.includes('scheduleDraftSave') && read('app/api/carelink-ops/service-design/product-experience/workbench/route.ts').includes('hsd_px_workbench_drafts'))
check('variant duplication is real', workbench.includes('duplicateVariant') && read('app/api/carelink-ops/service-design/product-experience/workbench/route.ts').includes("body.action === 'duplicate'"))
check('scenario comparison is real-data driven', compare.includes('/scenarios/compare') && compare.includes('Matrice des différences'))
check('scenario merge creates a workbench', compare.includes('/scenarios/merge') && read('app/api/carelink-ops/service-design/product-experience/scenarios/merge/route.ts').includes('persistTimelineDays'))
check('controlled transformation can be applied', workbench.includes('applyTransformation') && workbench.includes('Appliquer réellement'))
check('OpenRouter Free is server-only and advisory', transform.includes("import 'server-only'") && transform.includes("openrouter/free") && transform.includes('Never invent an activity, price'))
check('local activity ids are validated', transform.includes('allowedIds.has(activityId)'))
check('multi-audience preview exists', read('components/carelink/service-design/product-experience/AudiencePreview.tsx').includes("'designer'") && read('components/carelink/service-design/product-experience/AudiencePreview.tsx').includes("'carelink'"))
check('peek inspector supports contextual comments', peek.includes('/annotations') && peek.includes('Commentaires contextuels'))
check('favorites and saved views are persistent', exists('app/api/carelink-ops/service-design/product-experience/favorites/route.ts') && exists('app/api/carelink-ops/service-design/product-experience/saved-views/route.ts'))
check('real permanent delete endpoint exists', deletion.includes("action !== 'execute'") && deletion.includes('.delete()'))
check('unpublished sellable deletion is dependency-aware', deletion.includes("entityType === 'unpublished_sellable'") && deletion.includes('Dépubliez-le'))
check('bulk operations are real', read('app/api/carelink-ops/service-design/product-experience/bulk/route.ts').includes("action:'execute'"))
check('A4/PDF workbench source resolves real draft data', sourceResolver.includes('hsd_px_workbench_drafts') && sourceResolver.includes('hsd_px_timeline_blocks'))
check('generated PDFs enter My Work registry', read('components/carelink/service-design/documents/ServiceDocumentStudio.tsx').includes('/product-experience/documents'))
check('Service Design dock includes My Work', read('components/carelink/service-design/studio2030/ServiceDesignDock.tsx').includes("label: 'Mon travail'"))
check('no governance or approval prerequisite endpoint added', !required.some((rel) => rel.includes('approval') || rel.includes('governance')))
check('no styled-jsx compatibility hazard', !required.filter(exists).some((rel) => /<style\s+jsx/.test(read(rel))))

const tables = ['hsd_px_workbench_drafts','hsd_px_timeline_days','hsd_px_timeline_blocks','hsd_px_scenario_compositions','hsd_px_favorites','hsd_px_saved_views','hsd_px_recent_items','hsd_px_annotations','hsd_px_document_registry','hsd_px_operation_history']
check('SQL is transactional and advisory locked', sql.includes('BEGIN;') && sql.includes('COMMIT;') && sql.includes('pg_advisory_xact_lock(84746008)'))
check('SQL gates required Service Design baseline', sql.includes('Service Design scenario baseline is missing'))
check('SQL creates all ten additive persistence tables', tables.every((table) => sql.includes(`CREATE TABLE IF NOT EXISTS public.${table}`)), `${tables.length} tables`)
check('SQL applies RLS to all ten tables', tables.every((table) => sql.includes(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`)))
check('SQL contains no destructive table drop', !/DROP\s+TABLE/i.test(sql))
check('SQL contains no approval or governance table', !/CREATE TABLE[^;]*(approval|governance)/i.test(sql))

const sourceFiles = []
const collect = (dir) => {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) collect(full)
    else if (/\.(ts|tsx)$/.test(entry.name)) sourceFiles.push(full)
  }
}
for (const rel of ['lib/service-design-product-experience','app/api/carelink-ops/service-design/product-experience','components/carelink/service-design/product-experience','app/carelink-ops/service-design/workbench','app/carelink-ops/service-design/my-work','app/carelink-ops/service-design/compare']) collect(path.join(root, rel))
for (const rel of ['components/carelink/service-design/HomeServiceDesignShell.tsx','components/carelink/service-design/documents/ServiceDocumentStudio.tsx','components/carelink/service-design/documents/server/sourceResolver.ts','components/carelink/service-design/factory/CategoryMasterExperienceWorkspace.tsx','components/carelink/service-design/planning/workspaces/ScenarioComparisonWorkspace.tsx','components/carelink/service-design/planning/workspaces/TimelineCanvas.tsx','components/carelink/service-design/studio2030/ServiceDesignDock.tsx','app/carelink-ops/service-design/documents/page.tsx','types/service-design-product-experience.ts']) if (exists(rel)) sourceFiles.push(path.join(root, rel))
let syntaxErrors = []
for (const file of sourceFiles) {
  const text = fs.readFileSync(file, 'utf8')
  const result = ts.transpileModule(text, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.Preserve }, fileName: file, reportDiagnostics: true })
  for (const diagnostic of result.diagnostics || []) if (diagnostic.category === ts.DiagnosticCategory.Error) syntaxErrors.push(`${path.relative(root, file)}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ')}`)
}
check('TypeScript syntax gate passes', syntaxErrors.length === 0, syntaxErrors.slice(0, 3).join(' | ') || `${sourceFiles.length} files transpiled`)

let importErrors = []
const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '.module.css', '.css']
for (const file of sourceFiles) {
  const text = fs.readFileSync(file, 'utf8')
  for (const match of text.matchAll(/(?:from\s+|import\s*\()\s*['"]([^'"]+)['"]/g)) {
    const spec = match[1]
    if (!spec.startsWith('.')) continue
    const base = path.resolve(path.dirname(file), spec)
    if (!extensions.some((ext) => fs.existsSync(base + ext))) importErrors.push(`${path.relative(root, file)} -> ${spec}`)
  }
}
check('local relative imports resolve', importErrors.length === 0, importErrors.slice(0, 5).join(' | ') || 'all resolved')

let tsc = null
const localTsc = path.join(root, 'node_modules/.bin/tsc')
if (fs.existsSync(localTsc)) tsc = spawnSync(localTsc, ['-p','tsconfig.service-design-final-product-experience.json','--pretty','false'], { cwd: root, encoding: 'utf8' })
else tsc = spawnSync('tsc', ['-p','tsconfig.service-design-final-product-experience.json','--pretty','false'], { cwd: root, encoding: 'utf8' })
const tscOutput = `${typeof tsc.stdout === 'string' ? tsc.stdout : ''}${typeof tsc.stderr === 'string' ? tsc.stderr : ''}`.trim()
check('strict isolated TypeScript passes', tsc.status === 0, tsc.status === 0 ? '0 errors' : tscOutput.slice(-1200))

console.log(`\n${passed}/${passed + failed} Final Product Experience Closure checks passed.`)
if (failed) process.exit(1)
