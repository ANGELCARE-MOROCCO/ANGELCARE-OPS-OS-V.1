const fs = require('node:fs')
const path = require('node:path')
const child = require('node:child_process')
const Module = require('node:module')

function loadTypeScript() {
  try { return require('typescript') } catch {}
  try {
    const root = child.execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim()
    return require(path.join(root, 'typescript'))
  } catch (error) {
    console.error('FAIL — TypeScript is not available locally or globally.')
    console.error('Install project dependencies before running the focused TypeScript gate.')
    process.exit(2)
  }
}

const ts = loadTypeScript()
const manifest = fs.existsSync('BULK6_PATCH_FILE_LIST.txt') ? 'BULK6_PATCH_FILE_LIST.txt' : 'MZ7_PATCH_FILE_LIST.txt'
if (!fs.existsSync(manifest)) throw new Error(`Patch manifest missing: ${manifest}`)
const files = fs.readFileSync(manifest, 'utf8').split(/\r?\n/).filter(Boolean)
const sourceFiles = files.filter((file) => /\.(ts|tsx)$/.test(file) && !/\.d\.ts$/.test(file))
const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.css', '.module.css', '/index.ts', '/index.tsx', '/index.js']
let diagnostics = 0

function resolveImport(fromFile, specifier) {
  if (specifier.startsWith('@/')) return { target: path.join(process.cwd(), specifier.slice(2)), strict: false }
  if (specifier.startsWith('.')) return { target: path.resolve(path.dirname(fromFile), specifier), strict: true }
  return null
}

for (const file of sourceFiles) {
  if (!fs.existsSync(file)) throw new Error(`Source file missing: ${file}`)
  const source = fs.readFileSync(file, 'utf8')
  const result = ts.transpileModule(source, {
    fileName: file,
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.Preserve,
      isolatedModules: true,
    },
  })
  for (const diagnostic of result.diagnostics || []) {
    if (diagnostic.category !== ts.DiagnosticCategory.Error) continue
    diagnostics += 1
    console.error(`${file}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`)
  }
  const importPattern = /(?:from\s+|import\s*\()(["'`])([^"'`]+)\1/g
  for (const match of source.matchAll(importPattern)) {
    const resolved = resolveImport(file, match[2])
    if (!resolved) continue
    if (!extensions.some((suffix) => fs.existsSync(resolved.target + suffix)) && resolved.strict) {
      throw new Error(`Unresolved relative import in ${file}: ${match[2]}`)
    }
  }
}

if (diagnostics) throw new Error(`${diagnostics} TypeScript syntax diagnostics found`)

const modelFile = 'components/market-os/content-command/experience-bulk6/bulk6-release-model.ts'
const modelSource = fs.readFileSync(modelFile, 'utf8')
const compiled = ts.transpileModule(modelSource, {
  fileName: modelFile,
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText
const testModule = new Module(modelFile, module)
testModule.filename = modelFile
testModule.paths = Module._nodeModulePaths(process.cwd())
testModule._compile(compiled, modelFile)
const model = testModule.exports
const dossier = { id: 'dossier-1', source_state: 'secured' }
const manifestRecord = {
  type: 'release_manifest', version: 1, copy: 'Copy approuvée', cta: 'Réserver', audience: 'Parents', geography: 'Rabat', language: 'fr',
  trackingReference: 'UTM-001', executionMode: 'manual', proofExpectation: 'URL et capture', releaseNote: 'Release contrôlée',
  canonicalSourceId: 'source-1', canonicalSourceVersion: 4, canonicalSourceHash: 'abc', declaredAt: new Date().toISOString(),
}
const packageRecord = {
  id: 'package-1', dossier_id: 'dossier-1', channel: 'Website', scheduled_at: '2026-07-30T10:00:00.000Z', status: 'draft',
  package_readiness: 0, required_renditions: [{ id: 'web', name: 'Web', required: true, status: 'ready', assetReference: 'asset-1', versionIdentity: 'V4' }],
  evidence: [manifestRecord], published_at: null, external_reference: null, created_at: '', updated_at: '',
}
if (model.packageReadiness(packageRecord, dossier) !== 100) throw new Error('Deterministic readiness model did not reach 100')
if (model.releaseBlockers(packageRecord, dossier).length !== 0) throw new Error('Ready package still has deterministic blockers')
if (model.packageDominantAction(packageRecord, dossier) !== 'Déclarer le package prêt') throw new Error('Dominant action derivation failed')
if (model.deterministicCollisions([packageRecord, { ...packageRecord, id: 'package-2' }]).length !== 1) throw new Error('Deterministic collision detection failed')

console.log(`PASS — ${sourceFiles.length} Bulk 6 TypeScript/TSX files pass isolated syntax and relative-import resolution`)
console.log('PASS — deterministic readiness, blocker, action and collision model tests pass')
