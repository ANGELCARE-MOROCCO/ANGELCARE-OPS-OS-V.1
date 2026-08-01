#!/usr/bin/env node
const fs = require('node:fs')
const path = require('node:path')
const process = require('node:process')

let ts
for (const candidate of [
  path.join(process.cwd(), 'node_modules', 'typescript', 'lib', 'typescript.js'),
  '/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js',
  '/usr/local/lib/node_modules/typescript/lib/typescript.js',
]) {
  try { ts = require(candidate); break } catch {}
}
if (!ts) {
  console.error('FAIL — TypeScript compiler module was not found.')
  process.exit(2)
}

const appRoot = path.resolve(process.argv[2] || process.cwd())
const manifest = path.join(appRoot, 'CONTENT_COMMAND_CANONICAL_CONSOLIDATION_FILE_LIST.txt')
if (!fs.existsSync(manifest)) {
  console.error(`FAIL — verification manifest not found: ${manifest}`)
  process.exit(2)
}
const files = fs.readFileSync(manifest, 'utf8').split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  .filter((rel) => /\.(?:ts|tsx|js|jsx|mjs|cjs)$/.test(rel))
let failures = 0
for (const rel of files) {
  const target = path.join(appRoot, rel)
  if (!fs.existsSync(target)) { console.error(`FAIL — missing source: ${rel}`); failures += 1; continue }
  const source = fs.readFileSync(target, 'utf8')
  const result = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.Preserve,
      allowJs: true,
    },
    fileName: target,
    reportDiagnostics: true,
  })
  const diagnostics = (result.diagnostics || []).filter((item) => item.category === ts.DiagnosticCategory.Error)
  if (diagnostics.length) {
    failures += 1
    console.error(`FAIL — ${rel}`)
    for (const diagnostic of diagnostics) console.error(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))
  }
}
if (failures) process.exit(1)
console.log(`PASS — ${files.length} canonical consolidation TS/TSX/JS source files pass isolated syntax transformation.`)
