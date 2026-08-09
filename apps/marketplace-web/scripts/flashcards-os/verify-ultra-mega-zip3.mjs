#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const checks = []
const failures = []
const check = (name, ok, detail = '') => {
  checks.push({ name, ok, detail })
  if (!ok) failures.push({ name, detail })
}
const exists = rel => fs.existsSync(path.join(root, rel))
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8')
const walk = rel => {
  const start = path.join(root, rel)
  const out = []
  if (!fs.existsSync(start)) return out
  const visit = directory => fs.readdirSync(directory, { withFileTypes: true }).forEach(entry => {
    const absolute = path.join(directory, entry.name)
    if (entry.isDirectory()) visit(absolute)
    else out.push(absolute)
  })
  visit(start)
  return out
}
const run = (command, args) => spawnSync(command, args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
const detail = result => {
  const text = `${result?.stdout ?? ''}\n${result?.stderr ?? ''}`.trim()
  if (text) return text.slice(-700)
  if (result?.error) return result.error.message
  return `exit ${result?.status ?? 'unknown'}`
}
const runNode = rel => run(process.execPath, [path.join(root, rel)])
const routePages = walk('app/(protected)/flashcards-os').filter(file => file.endsWith('/page.tsx'))
const apiRoutes = walk('app/api/flashcards-os/production').filter(file => file.endsWith('/route.ts'))
const components = walk('components/flashcards-os/production').filter(file => file.endsWith('.tsx'))
const productionSource = [
  ...walk('lib/flashcards-os/production'),
  ...components,
  ...apiRoutes,
].filter(file => /\.(ts|tsx)$/.test(file)).map(file => fs.readFileSync(file, 'utf8')).join('\n')
const migrationDir = path.join(root, 'supabase/migrations')
const umz3Migrations = fs.readdirSync(migrationDir).filter(name => /flashcards_os_ultra_mega_zip3.*\.sql$/.test(name))
const sql = read('supabase/migrations/20260801_flashcards_os_ultra_mega_zip3_command_vault_release.sql')

check('UMZ1 product foundation remains present', exists('supabase/migrations/20260731_flashcards_os_ultra_mega_zip1_foundation.sql'))
check('UMZ2 intelligence foundation remains present', exists('supabase/migrations/20260731_flashcards_os_ultra_mega_zip2_intelligence.sql'))
check('UMZ2 Product Design domain remains present', exists('lib/flashcards-os/intelligence/server/product-design.ts') || (exists('supabase/migrations/20260731_flashcards_os_ultra_mega_zip2_intelligence.sql') && /product_designs/.test(read('supabase/migrations/20260731_flashcards_os_ultra_mega_zip2_intelligence.sql'))))
check('Delivery master universe is activated', /key:\s*'delivery'[\s\S]*?active:\s*true/.test(read('lib/flashcards-os/navigation.ts')))
check('six master universes remain preserved', (read('lib/flashcards-os/navigation.ts').match(/key:\s*'/g) || []).length >= 6)
check('sixteen distinctive protected UMZ3 pages exist', routePages.filter(file => /production-commands|external-production|\/delivery\//.test(file)).length === 16)
check('twenty-three governed production API routes exist', apiRoutes.length === 23)
check('thirteen purpose-built production UI components exist', components.length === 13)
check('production server domain is isolated', exists('lib/flashcards-os/production/server/commands.ts') && exists('lib/flashcards-os/production/server/vault-service.ts'))
check('one consolidated UMZ3 SQL migration exists', umz3Migrations.length === 1, umz3Migrations.join(', '))
check('thirty-eight normalized UMZ3 tables are declared', (sql.match(/create table if not exists flashcards_os\./g) || []).length === 38)
check('thirty-eight controlled UMZ3 service views are declared', (sql.match(/create or replace view public\.fc_os_/g) || []).length === 38)
check('collection dossier Production Commands is operational', /key:\s*'commands'[\s\S]*?status:\s*'ready'/.test(read('lib/flashcards-os/server/repository.ts')))
check('collection dossier Sources & Deliverables is operational', /key:\s*'vault'[\s\S]*?status:\s*'ready'/.test(read('lib/flashcards-os/server/repository.ts')))
check('collection dossier Quality & Approvals is operational', /key:\s*'quality'[\s\S]*?status:\s*'ready'/.test(read('lib/flashcards-os/server/repository.ts')))
check('OpenRouter compiler is server-only', read('lib/flashcards-os/production/adapters/openrouter-command.ts').includes("import 'server-only'"))
check('OpenRouter produces exactly eleven governed command sections', /minItems:11,maxItems:11/.test(read('lib/flashcards-os/production/adapters/openrouter-command.ts')))
check('compiler authority is instructions-only', /Compile instructions only/.test(read('lib/flashcards-os/production/adapters/openrouter-command.ts')))
check('Tavily is absent from UMZ3 production code', !/tavily/i.test(productionSource))
check('creative image generation integration is absent', !/text2image|image_generation|dall-e|stability\.ai|replicate\.com/i.test(productionSource))
check('creative video generation integration is absent', !/sora|runwayml|video_generation|renderMp4/i.test(productionSource))
check('creative PDF rendering integration is absent', !/pdf-lib|puppeteer|playwright|chromium/i.test(productionSource))
check('only approved Product Designs may compile commands', /approved Product Design|must be approved before command compilation/i.test(productionSource))
check('deterministic command validation exists', /deterministicCommandValidation/.test(productionSource))
check('OpenRouter criticism remains advisory', /advisoryFindings/.test(productionSource))
check('human command approval is enforced', /approveCommand/.test(productionSource) && /approve_commands/.test(productionSource))
check('complete command copying is implemented', /navigator\.clipboard\.writeText/.test(productionSource))
check('section copying is implemented', /copySection|Copy section|Copier la section/i.test(productionSource))
check('text and Markdown command exports are implemented', /text\/plain/.test(productionSource) && /markdown\?'md':'txt'/.test(productionSource))
check('command copy and export events are auditable', /command_copy_events/.test(sql) && /command_exports/.test(sql))
check('external production jobs are traceable', /external_production_jobs/.test(sql) && /external_production_events/.test(sql))
check('external correction cycles preserve history', /external_correction_cycles/.test(sql))
check('whole-file base64 upload is absent', !/readAsDataURL|btoa\(|Buffer\.from\([^)]*,\s*['"]base64['"]/.test(productionSource))
check('browser upload is chunked', /file\.slice\(index\*chunkSize/.test(productionSource))
check('upload sessions are resumable and cancellable', /upload_sessions/.test(sql) && /paused/.test(sql) && /cancelled/.test(sql))
check('part and final SHA-256 verification exists', /x-part-sha256/.test(productionSource) && /checksumExpected/.test(productionSource))
check('server-to-node requests use HMAC signing', /createHmac/.test(read('lib/flashcards-os/production/server/storage-client.ts')))
check('timestamp and nonce replay controls exist', /x-angelcare-timestamp/.test(productionSource) && /x-angelcare-nonce/.test(productionSource))
check('Windows Node implementation is versioned in repository', exists('bridge/windows-flashcards-vault/server.js'))
check('Windows Node avoids external runtime dependencies', JSON.parse(read('bridge/windows-flashcards-vault/package.json')).dependencies == null)
check('Windows physical path is absent from client components', !/C:\\AngelCare/.test(components.map(file => fs.readFileSync(file, 'utf8')).join('\n')))
check('heavy files remain outside database bytea/blob columns', !/\bbytea\b|large object|lo_import/i.test(sql))
check('source packages and final deliverables are distinct', /create table if not exists flashcards_os\.source_packages/.test(sql) && /create table if not exists flashcards_os\.deliverables/.test(sql))
check('file replacement uses versions and supersession', /storage_object_versions/.test(sql) && /superseded_by_id/.test(sql))
check('quality review disciplines are structured', /quality_review_disciplines/.test(sql))
check('release-blocking findings are represented', /release_blocker/.test(sql) && /critical/.test(sql))
check('blocking findings prevent release', /Release contains blocking reasons/.test(productionSource))
check('correction-loop operations are present', /correction_cycles/.test(sql) && /correction requested|corrections/i.test(productionSource))
check('released product composition is immutable', /guard_released_asset_mutation/.test(sql))
check('supersession preserves historical releases', /supersedes_release_id/.test(sql))
check('storage-node heartbeat and capacity telemetry exist', /last_heartbeat_at/.test(sql) && /free_bytes/.test(sql))
check('failed transfers and quarantine are observable', /failed_transfers/.test(sql) && /quarantine_events/.test(sql))
check('all production APIs enforce Flashcards OS RBAC', apiRoutes.every(file => fs.readFileSync(file, 'utf8').includes('assertFlashcardsApiAccess')))
check('new tables receive RLS', /enable row level security/.test(sql))
check('critical mutations retain audit and outbox coverage', /audit_events/.test(productionSource) && /outbox_events/.test(productionSource))
check('Product Command Forge has unique layout identity', /PRODUCTION COMMAND FORGE/.test(read('components/flashcards-os/production/ProductionCommandForge.tsx')))
check('Command Comparison Theatre has unique layout identity', /COMMAND COMPARISON THEATRE/.test(read('components/flashcards-os/production/CommandComparisonTheatre.tsx')))
check('Clean Command Copy Surface has unique layout identity', /APPROVED CLEAN COMMAND/.test(read('components/flashcards-os/production/CommandCopySurface.tsx')))
check('External Production Dispatch has unique layout identity', /EXTERNAL PRODUCTION DISPATCH BOARD/.test(read('components/flashcards-os/production/ExternalProductionDispatchBoard.tsx')))
check('Product Vault has unique layout identity', /SOVEREIGN PRODUCT VAULT/.test(read('components/flashcards-os/production/ProductVaultRoom.tsx')))
check('Large Upload Station has unique layout identity', /LARGE UPLOAD COMMAND STATION/.test(read('components/flashcards-os/production/LargeUploadStation.tsx')))
check('Quality Review Chamber has unique layout identity', /QUALITY REVIEW CHAMBER/.test(read('components/flashcards-os/production/QualityReviewChamber.tsx')))
check('Release Control Room has unique layout identity', /IMMUTABLE PRODUCT RELEASE CONTROL/.test(read('components/flashcards-os/production/ReleaseControlRoom.tsx')))
check('Windows Operations Console has unique layout identity', /WINDOWS VAULT OPERATIONS CONSOLE/.test(read('components/flashcards-os/production/StorageOperationsConsole.tsx')))
check('UMZ6 customer fulfilment boundary remains explicit', /remain.*UMZ6|réservés à UMZ6/i.test(read('components/flashcards-os/production/ProductionDeliveryBridge.tsx')))

const sqlReview = runNode('scripts/flashcards-os/review-sql-umz3.mjs')
check('SQL architecture review passes', sqlReview.status === 0, detail(sqlReview))
const boundaryReview = runNode('scripts/flashcards-os/verify-production-boundaries.mjs')
check('production-boundary review passes', boundaryReview.status === 0, detail(boundaryReview))
const syntax = runNode('scripts/flashcards-os/typescript-syntax-gate.mjs')
check('TypeScript syntax and local import gate passes', syntax.status === 0, detail(syntax))
const windowsSyntax = run(process.execPath, ['--check', path.join(root, 'bridge/windows-flashcards-vault/server.js')])
check('Windows Node server syntax passes', windowsSyntax.status === 0, detail(windowsSyntax))

let tsc = null
const localTsc = path.join(root, 'node_modules/.bin/tsc')
if (fs.existsSync(localTsc)) tsc = run(localTsc, ['-p', 'tsconfig.flashcards-os-umz3.static.json', '--pretty', 'false'])
else tsc = run('tsc', ['-p', 'tsconfig.flashcards-os-umz3.static.json', '--pretty', 'false'])
check('isolated strict static TypeScript check passes', tsc.status === 0, tsc.status === 0 ? '0 errors' : detail(tsc))

for (const item of checks) console.log(`${item.ok ? 'PASS' : 'FAIL'}  ${item.name}${item.detail && !item.ok ? ` — ${item.detail}` : ''}`)
console.log(`\n${checks.length - failures.length}/${checks.length} Ultra Mega ZIP 3 acceptance checks passed.`)
if (failures.length) {
  console.error('\nFailures:')
  for (const item of failures) console.error(`- ${item.name}${item.detail ? `: ${item.detail}` : ''}`)
  process.exit(1)
}
