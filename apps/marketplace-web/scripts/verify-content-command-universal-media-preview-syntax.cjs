#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const app = path.resolve(process.argv[2] || process.cwd())
const candidates = [
  path.join(app, 'node_modules/typescript/lib/typescript.js'),
  path.join(process.cwd(), 'node_modules/typescript/lib/typescript.js'),
  '/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js',
  '/usr/local/lib/node_modules/typescript/lib/typescript.js',
]
const compilerPath = candidates.find(fs.existsSync)
if (!compilerPath) {
  console.error('FAIL — TypeScript compiler module was not found.')
  process.exit(1)
}
const ts = require(compilerPath)
const files = [
  'components/market-os/content-command/media-preview/ContentMediaPreview.tsx',
  'lib/market-os/content-command-headquarters/media-preview-service.ts',
  'app/api/market-os/content-command-headquarters/media-preview/route.ts',
  'components/market-os/content-command/experience-bulk4/Bulk4AssetLibraryWorkspace.tsx',
  'components/market-os/content-command/experience-bulk4/Bulk4ActiveAssetsWorkspace.tsx',
  'components/market-os/content-command/experience-bulk4/Bulk4VersionControlWorkspace.tsx',
  'components/market-os/content-command/experience-bulk4/Bulk4DigitalStudioWorkspace.tsx',
  'components/market-os/content-command/experience-bulk4/Bulk4PrintStudioWorkspace.tsx',
  'components/market-os/content-command/experience-bulk4/Bulk4DocumentationStudioWorkspace.tsx',
  'components/market-os/content-command/headquarters/SourceVaultWorkspace.tsx',
  'components/market-os/content-command/headquarters/EvidenceWorkspace.tsx',
  'components/market-os/content-command/headquarters/ValidationWorkspace.tsx',
  'components/market-os/content-command/headquarters/DistributionWorkspace.tsx',
  'components/market-os/content-command/content-publishing-page.tsx',
  'components/market-os/content-command/headquarters/dossier/DossierSections.tsx',
  'components/market-os/content-command/experience-bulk1/Bulk1DossierWorkspace.tsx',
  'components/market-os/content-command/experience-bulk5/Bulk5EvidenceLabWorkspace.tsx',
  'components/market-os/content-command/experience-bulk5/Bulk5ReviewCommandWorkspace.tsx',
  'components/market-os/content-command/experience-bulk5/Bulk5ValidationChamber.tsx',
  'components/market-os/content-command/knowledge/knowledge-model.ts',
]
const extensions = ['.ts','.tsx','.js','.jsx','.mjs','.cjs','.json','.css','.scss']
const diagnostics = []
function resolveRelative(importer, specifier) {
  if (!specifier.startsWith('.')) return true
  const base = path.resolve(path.dirname(importer), specifier)
  const possible = [base, ...extensions.map((ext) => base + ext), ...extensions.map((ext) => path.join(base, 'index' + ext))]
  return possible.some(fs.existsSync)
}
for (const rel of files) {
  const file = path.join(app, rel)
  if (!fs.existsSync(file)) { diagnostics.push(`${rel}: missing`); continue }
  const source = fs.readFileSync(file, 'utf8')
  const result = ts.transpileModule(source, { fileName: file, compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX }, reportDiagnostics: true })
  for (const item of result.diagnostics || []) diagnostics.push(`${rel}: ${ts.flattenDiagnosticMessageText(item.messageText, '\n')}`)
  const imports = [...source.matchAll(/(?:from\s+|import\s*\(\s*|require\s*\(\s*)["']([^"']+)["']/g)].map((match) => match[1])
  for (const specifier of imports) if (!resolveRelative(file, specifier)) diagnostics.push(`${rel}: unresolved relative import ${specifier}`)
}
if (diagnostics.length) {
  diagnostics.forEach((line) => console.error(`FAIL — ${line}`))
  process.exit(1)
}
console.log(`PASS — ${files.length} Universal Media Preview TS/TSX files pass syntax and relative-import verification with TypeScript ${ts.version}.`)
