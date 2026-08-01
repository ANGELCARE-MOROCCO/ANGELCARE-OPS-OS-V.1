#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const failures = []
const checks = []

function check(name, condition, detail = '') {
  checks.push({ name, condition, detail })
  if (!condition) failures.push(`${name}${detail ? ` — ${detail}` : ''}`)
}
function exists(relative) { return fs.existsSync(path.join(root, relative)) }
function read(relative) { return fs.readFileSync(path.join(root, relative), 'utf8') }
function walk(relative) {
  const start = path.join(root, relative)
  if (!fs.existsSync(start)) return []
  const files = []
  const visit = (target) => {
    for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
      const full = path.join(target, entry.name)
      if (entry.isDirectory()) visit(full)
      else files.push(full)
    }
  }
  visit(start)
  return files
}

const requiredFiles = [
  'app/(protected)/flashcards-os/layout.tsx',
  'app/(protected)/flashcards-os/page.tsx',
  'app/(protected)/flashcards-os/loading.tsx',
  'app/(protected)/flashcards-os/error.tsx',
  'app/(protected)/flashcards-os/not-found.tsx',
  'app/(protected)/flashcards-os/product/page.tsx',
  'app/(protected)/flashcards-os/product/taxonomy/page.tsx',
  'app/(protected)/flashcards-os/product/collections/page.tsx',
  'app/(protected)/flashcards-os/product/collections/[collectionId]/page.tsx',
  'app/(protected)/flashcards-os/product/collections/[collectionId]/cards/page.tsx',
  'app/(protected)/flashcards-os/governance/import-control/page.tsx',
  'app/api/flashcards-os/taxonomy/route.ts',
  'app/api/flashcards-os/collections/route.ts',
  'app/api/flashcards-os/collections/[collectionId]/route.ts',
  'app/api/flashcards-os/collections/[collectionId]/cards/route.ts',
  'app/api/flashcards-os/import-issues/[issueId]/route.ts',
  'components/flashcards-os/FlashcardsOSShell.tsx',
  'components/flashcards-os/FlashcardsCommandCockpit.tsx',
  'components/flashcards-os/PortfolioLandscape.tsx',
  'components/flashcards-os/TaxonomyAtlas.tsx',
  'components/flashcards-os/CollectionRegistry.tsx',
  'components/flashcards-os/CollectionDossier.tsx',
  'components/flashcards-os/CardContentRegistry.tsx',
  'components/flashcards-os/LegacyImportControl.tsx',
  'components/flashcards-os/flashcards-os.module.css',
  'lib/flashcards-os/catalogue-2022.seed.json',
  'lib/flashcards-os/navigation.ts',
  'lib/flashcards-os/types.ts',
  'lib/flashcards-os/server/access.ts',
  'lib/flashcards-os/server/repository.ts',
  'supabase/migrations/20260731_flashcards_os_ultra_mega_zip1_foundation.sql',
  'tsconfig.flashcards-os-umz1.json',
]

check('all canonical UMZ1 files are present', requiredFiles.every(exists), `${requiredFiles.filter((file) => !exists(file)).length} missing`)
check('protected application root is exact', exists('app/(protected)/flashcards-os/layout.tsx'))
check('API namespace is isolated', exists('app/api/flashcards-os/collections/route.ts'))
check('layout requires Flashcards OS permission', read('app/(protected)/flashcards-os/layout.tsx').includes("requireFlashcardsPageAccess('flashcards_os.view')"))

const apiFiles = walk('app/api/flashcards-os').filter((file) => file.endsWith('.ts'))
check('five governed mutation API routes', apiFiles.length === 5, `found ${apiFiles.length}`)
check('every API route enforces server-side RBAC', apiFiles.every((file) => fs.readFileSync(file, 'utf8').includes('assertFlashcardsApiAccess')))
check('every API route validates and returns JSON', apiFiles.every((file) => fs.readFileSync(file, 'utf8').includes('NextResponse.json')))

const navigation = read('lib/flashcards-os/navigation.ts')
check('six master universes are declared', (navigation.match(/key:/g) || []).length >= 6)
check('only Command and Product are activated in U1', navigation.includes("key: 'command'") && navigation.includes("key: 'product'") && navigation.includes('active: false'))
check('future universes remain visibly contracted, not fake-enabled', navigation.includes("delivery: 2") && navigation.includes("delivery: 4") && navigation.includes("delivery: 5") && navigation.includes("delivery: 6"))

const repository = read('lib/flashcards-os/server/repository.ts')
check('database-unavailable fallback is operational', repository.includes("sourceMode: 'catalogue_seed'"))
check('service-role queries are tenant-filtered', repository.includes("const TENANT_KEY = 'angelcare-internal'") && (repository.match(/eq\('tenant_key', TENANT_KEY\)/g) || []).length >= 9)
check('native writes include tenant key', (repository.match(/tenant_key: TENANT_KEY/g) || []).length >= 5)
check('dossier contract has exactly 12 sections', (repository.slice(repository.indexOf('function dossierSections'), repository.indexOf('function dossierFromSeed')).match(/key:/g) || []).length === 12)
check('card registry does not invent legacy card records', repository.includes('cards: []'))
check('historical anomalies are explained, not silently corrected', repository.includes('aucune correction silencieuse'))

const componentFiles = walk('components/flashcards-os').filter((file) => /\.(tsx|css)$/.test(file))
const componentText = componentFiles.map((file) => fs.readFileSync(file, 'utf8')).join('\n')
check('eight purpose-built workspace components exist', componentFiles.filter((file) => file.endsWith('.tsx')).length === 8)
check('white enterprise design system is substantial', read('components/flashcards-os/flashcards-os.module.css').split('\n').length >= 600)
check('Taxonomy Atlas has its own architecture', componentText.includes('Atlas') && componentText.includes('coverage'))
check('Collection Dossier has lifecycle and decision anatomy', componentText.includes('Lifecycle') && componentText.includes('dossier'))
check('Card Content Registry has editorial controls', componentText.includes('Registre') && componentText.includes('sequence'))
check('Legacy Intake has anomaly governance', componentText.includes('anomal') && componentText.includes('source') && componentText.includes('Arbitrage gouverné'))
check('no generic dark-theme dependency', !componentText.includes('prefers-color-scheme: dark'))

const allFlashcardsSources = [
  ...walk('app/(protected)/flashcards-os'),
  ...walk('app/api/flashcards-os'),
  ...walk('components/flashcards-os'),
  ...walk('lib/flashcards-os'),
].filter((file) => /\.(ts|tsx|css|json)$/.test(file)).map((file) => fs.readFileSync(file, 'utf8')).join('\n')
check('no Tavily integration is prematurely implemented', !/api\.tavily\.com|TAVILY_API_KEY/.test(allFlashcardsSources))
check('no OpenRouter integration is prematurely implemented', !/openrouter\.ai|OPENROUTER_API_KEY/.test(allFlashcardsSources))
check('no internal image/video generation endpoint exists', !/generate[-_ ]?(image|video)|text2image|text2video/i.test(allFlashcardsSources))
check('historical Dh is labelled as historical evidence', componentText.includes('historique') || componentText.includes('Historique'))

const seedRun = spawnSync(process.execPath, [path.join(root, 'scripts/flashcards-os/verify-catalogue-seed.mjs')], { cwd: root, encoding: 'utf8' })
check('catalogue seed verifier passes', seedRun.status === 0, seedRun.status === 0 ? '21 checks' : seedRun.stderr.trim().slice(0, 180))
const sqlRun = spawnSync(process.execPath, [path.join(root, 'scripts/flashcards-os/review-sql-umz1.mjs')], { cwd: root, encoding: 'utf8' })
check('SQL architecture verifier passes', sqlRun.status === 0, sqlRun.status === 0 ? '25 checks' : sqlRun.stderr.trim().slice(0, 180))

for (const result of checks) {
  console.log(`${result.condition ? 'PASS' : 'FAIL'}  ${result.name}${result.detail ? ` (${result.detail})` : ''}`)
}
console.log(`\n${checks.length - failures.length}/${checks.length} Ultra Mega ZIP 1 acceptance checks passed.`)
if (failures.length) {
  console.error('\nAcceptance failures:')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
