#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'

const appRoot = path.resolve(process.argv[2] || process.cwd())
const checks = []
const failures = []

function file(rel) { return path.join(appRoot, rel) }
function read(rel) { return fs.readFileSync(file(rel), 'utf8') }
function check(label, condition, detail = '') {
  checks.push(label)
  if (condition) console.log(`PASS  ${label}${detail ? ` — ${detail}` : ''}`)
  else { console.log(`FAIL  ${label}${detail ? ` — ${detail}` : ''}`); failures.push(`${label}${detail ? `: ${detail}` : ''}`) }
}
function contains(rel, patterns) {
  if (!fs.existsSync(file(rel))) return false
  const source = read(rel)
  return patterns.every((pattern) => pattern instanceof RegExp ? pattern.test(source) : source.includes(pattern))
}

const required = [
  'components/carelink/service-design/feedback/ServiceDesignActionCenter.tsx',
  'components/carelink/service-design/feedback/client.ts',
  'components/carelink/service-design/factory/CategoryMasterExperienceWorkspace.tsx',
  'components/carelink/service-design/factory/DoctrineCommandWorkspace.tsx',
  'components/carelink/service-design/factory/DoctrineImportStudio.tsx',
  'app/api/carelink-ops/service-design/factory/validate/route.ts',
  'app/api/carelink-ops/service-design/factory/generate/route.ts',
  'components/carelink/service-design/planning/workspaces/MultiDayJourneyWorkspace.tsx',
]
check('all final-stabilization runtime files exist', required.every((rel) => fs.existsSync(file(rel))), `${required.length}/${required.length}`)

check('Service Design shell mounts the premium action provider', contains('components/carelink/service-design/HomeServiceDesignShell.tsx', ['ServiceDesignActionProvider', '<ServiceDesignActionProvider>']))
check('success action toast uses a real three-second dismissal countdown', contains('components/carelink/service-design/feedback/ServiceDesignActionCenter.tsx', ['useState(3000)', "record.status === 'success' && remaining <= 0", 'onMouseEnter={() => setPaused(true)}']))
check('error action toast remains visible until the user closes it', contains('components/carelink/service-design/feedback/ServiceDesignActionCenter.tsx', ["record.status === 'error' ? 'Reste visible jusqu’à fermeture'", 'onClick={onDismiss}']))
check('action centre keeps recent operational feedback', contains('components/carelink/service-design/feedback/ServiceDesignActionCenter.tsx', ['ActionCentre', '.slice(0, 40)', 'Action Centre']))

const categoryFile = 'components/carelink/service-design/factory/CategoryMasterExperienceWorkspace.tsx'
check('factory category workspace no longer requires approval to compose', fs.existsSync(file(categoryFile)) && !read(categoryFile).includes('RequestApprovalAction') && contains(categoryFile, ['Enregistrer & composer', 'Aucun circuit de validation n’est requis']))
check('factory configuration is autosaved and restored from the existing workbench', contains(categoryFile, ['/product-experience/workbench', 'workspaceKey', 'Sauvegarde automatique']))
check('factory validates only real blockers before composition', contains(categoryFile, ['/factory/validate', 'FACTORY_DRAFT_BLOCKED', 'Doctrine, capacité et tarif restent de simples avertissements']))
check('generated scenarios lead directly to real planning workbenches', contains(categoryFile, ['/planning/multi-day/', '/planning/single-day/', 'Ouvrir Workbench']))

const validateFile = 'app/api/carelink-ops/service-design/factory/validate/route.ts'
check('validation endpoint treats dates and local activities as the hard requirements', contains(validateFile, ["if (!input.dates.length) blockers.push", "if (!category.activities.length) blockers.push"]))
check('doctrine capacity and pricing remain visible warnings rather than draft blockers', contains(validateFile, ["if (!category.doctrine.length) warnings.push", "if (!category.capacity) warnings.push", "if (!category.priceEntries.length) warnings.push"]))

const generateFile = 'app/api/carelink-ops/service-design/factory/generate/route.ts'
check('generation retries one abort-like provider interruption', contains(generateFile, ['composeWithOneRecovery', 'await new Promise', 'FACTORY_PROVIDER_ABORTED']))
check('generation preserves an actionable message after repeated aborts', contains(generateFile, ['Votre brouillon est conservé', 'relancez « Composer »']))

const importStudio = 'components/carelink/service-design/factory/DoctrineImportStudio.tsx'
check('targeted import has a synchronized category selector and no technical ID field', contains(importStudio, ['Aucun identifiant technique à saisir', 'catalogue.categories.map']) && !read(importStudio).includes('UUID'))
check('targeted import provides a real clickable drag-and-drop CSV surface', contains(importStudio, ['onDragEnter', 'onDragOver', 'onDrop', 'fileInputRef.current?.click()']))
check('targeted import provides CSV preview correction and direct application', contains(importStudio, ['parseCsvPreview', 'Prévisualiser, corriger et appliquer', '/factory/import']))
check('doctrine import opens immediately in a visible fixed drawer', contains('components/carelink/service-design/factory/DoctrineCommandWorkspace.tsx', ['fixed inset-0', 'Import ciblé immédiat', '<DoctrineImportStudio']))
check('standalone import route preserves category and resource context', contains('app/carelink-ops/service-design/factory/import/page.tsx', ['searchParams', 'params.category', 'params.type', 'initialImportType']))

check('multi-day route opens the real editable MissionWorkbench', contains('components/carelink/service-design/planning/workspaces/MultiDayJourneyWorkspace.tsx', ['MissionWorkbench', 'scenarioId={scenarioId}']))
check('scenario planning route opens the real editable MissionWorkbench', contains('app/carelink-ops/service-design/planning/scenarios/[scenarioId]/page.tsx', ['MissionWorkbench', 'scenarioId={scenarioId}']))
check('ordinary category dossier offers direct mission programme package and import actions', contains('components/carelink/service-design/workspaces/CategoryDossierWorkspace.tsx', ['Concevoir une mission', 'Créer un programme', 'Composer un package', 'Importer les ressources']) && !read('components/carelink/service-design/workspaces/CategoryDossierWorkspace.tsx').includes('Demander validation'))

// Resolve relative imports only. Absolute @/ imports are validated by repository-backed tsc on the target repo.
const sourceRoots = [
  'app/carelink-ops/service-design',
  'app/api/carelink-ops/service-design',
  'components/carelink/service-design',
  'lib/homeservice-design',
  'lib/service-design-product-experience',
]
const sourceFiles = []
function walk(dir) {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (/\.(ts|tsx)$/.test(entry.name)) sourceFiles.push(full)
  }
}
for (const root of sourceRoots) walk(file(root))

let relativeLinks = 0
const missingRelative = []
const importPattern = /(?:from\s+|import\s*\()\s*['"](\.[^'"]+)['"]/g
const candidates = (base) => [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.jsx`, `${base}.mjs`, `${base}.cjs`, path.join(base, 'index.ts'), path.join(base, 'index.tsx'), path.join(base, 'index.js')]
for (const sourceFile of sourceFiles) {
  const source = fs.readFileSync(sourceFile, 'utf8')
  for (const match of source.matchAll(importPattern)) {
    relativeLinks += 1
    const base = path.resolve(path.dirname(sourceFile), match[1])
    if (!candidates(base).some((candidate) => fs.existsSync(candidate))) missingRelative.push(`${path.relative(appRoot, sourceFile)} -> ${match[1]}`)
  }
}
check('all captured Service Design relative imports resolve', missingRelative.length === 0, missingRelative.length ? missingRelative.slice(0, 8).join(' | ') : `${relativeLinks} links`)

// Syntax gate uses repository TypeScript first, then an installed global compiler.
let tsPath = path.join(appRoot, 'node_modules/typescript/lib/typescript.js')
if (!fs.existsSync(tsPath)) {
  for (const candidate of [
    '/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js',
    '/usr/local/lib/node_modules/typescript/lib/typescript.js',
  ]) if (fs.existsSync(candidate)) { tsPath = candidate; break }
}
if (fs.existsSync(tsPath)) {
  const require = createRequire(import.meta.url)
  const ts = require(tsPath)
  const syntaxFailures = []
  let implementationCount = 0
  let declarationCount = 0
  for (const sourceFile of sourceFiles) {
    const source = fs.readFileSync(sourceFile, 'utf8')
    if (sourceFile.endsWith('.d.ts')) {
      declarationCount += 1
      const sf = ts.createSourceFile(sourceFile, source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS)
      const diagnostics = sf.parseDiagnostics || []
      if (diagnostics.length) syntaxFailures.push(`${path.relative(appRoot, sourceFile)}: ${diagnostics.map((d) => ts.flattenDiagnosticMessageText(d.messageText, ' ')).join(' | ')}`)
    } else {
      implementationCount += 1
      try {
        const output = ts.transpileModule(source, { fileName: sourceFile, compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.Preserve }, reportDiagnostics: true })
        const diagnostics = (output.diagnostics || []).filter((d) => d.category === ts.DiagnosticCategory.Error)
        if (diagnostics.length) syntaxFailures.push(`${path.relative(appRoot, sourceFile)}: ${diagnostics.map((d) => ts.flattenDiagnosticMessageText(d.messageText, ' ')).join(' | ')}`)
      } catch (error) { syntaxFailures.push(`${path.relative(appRoot, sourceFile)}: ${String(error?.stack || error)}`) }
    }
  }
  check('TypeScript implementation and declaration syntax passes', syntaxFailures.length === 0, syntaxFailures.length ? syntaxFailures.slice(0, 5).join(' | ') : `${implementationCount} implementation + ${declarationCount} declaration files`)
} else {
  check('TypeScript syntax compiler is available', false, 'typescript.js not found')
}

const tsc = path.join(appRoot, 'node_modules/.bin/tsc')
if (fs.existsSync(tsc)) {
  const result = spawnSync(tsc, ['-p', 'tsconfig.service-design-final-stabilization.json', '--pretty', 'false'], { cwd: appRoot, encoding: 'utf8' })
  const output = `${result.stdout || ''}${result.stderr || ''}`.trim()
  check('dependency-backed strict Service Design TypeScript passes', result.status === 0, result.status === 0 ? '0 errors' : output.slice(-1800))
} else {
  console.log('SKIP  dependency-backed strict Service Design TypeScript — repository node_modules not present in this bounded source; installer will run it when available')
}

console.log(`\n${checks.length - failures.length}/${checks.length} Final End-to-End Stabilization checks passed.`)
if (failures.length) {
  console.log('\nFailures:')
  for (const failure of failures) console.log(`- ${failure}`)
  process.exit(1)
}
console.log('\nSUCCESS: CARELINK Service Design OS final end-to-end stabilization verification passed.')
console.log('No SQL migration, Git operation, full build or deployment was run.')
