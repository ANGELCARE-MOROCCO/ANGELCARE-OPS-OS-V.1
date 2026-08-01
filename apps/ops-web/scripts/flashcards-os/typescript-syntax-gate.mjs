#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
let ts
try {
  ts = require('typescript')
} catch {
  ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js')
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const roots = [
  'app/(protected)/flashcards-os',
  'app/api/flashcards-os',
  'components/flashcards-os',
  'lib/flashcards-os',
]
const files = []
for (const relative of roots) {
  const start = path.join(root, relative)
  const visit = (target) => {
    for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
      const full = path.join(target, entry.name)
      if (entry.isDirectory()) visit(full)
      else if (/\.(ts|tsx)$/.test(entry.name)) files.push(full)
    }
  }
  visit(start)
}

const failures = []
const localImports = []
function resolveLocal(specifier, owner) {
  let base
  if (specifier.startsWith('@/')) base = path.join(root, specifier.slice(2))
  else if (specifier.startsWith('.')) base = path.resolve(path.dirname(owner), specifier)
  else return true
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.json`, `${base}.css`, path.join(base, 'index.ts'), path.join(base, 'index.tsx')]
  return candidates.some((candidate) => fs.existsSync(candidate))
}

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8')
  const result = ts.transpileModule(source, {
    fileName: file,
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      jsx: ts.JsxEmit.ReactJSX,
      strict: true,
      isolatedModules: true,
      resolveJsonModule: true,
    },
  })
  for (const diagnostic of result.diagnostics || []) {
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
    const location = diagnostic.start == null ? '' : (() => {
      const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true)
      const point = sf.getLineAndCharacterOfPosition(diagnostic.start)
      return `:${point.line + 1}:${point.character + 1}`
    })()
    failures.push(`${path.relative(root, file)}${location} ${message}`)
  }
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  for (const statement of sourceFile.statements) {
    if ((ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement)) && statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)) {
      const specifier = statement.moduleSpecifier.text
      if (specifier.startsWith('.') || specifier.startsWith('@/')) localImports.push({ file, specifier })
    }
  }
}

for (const item of localImports) {
  if (!resolveLocal(item.specifier, item.file)) failures.push(`${path.relative(root, item.file)} unresolved local import ${item.specifier}`)
}

if (failures.length) {
  console.error(`FAIL  TypeScript syntax/local-import gate — ${failures.length} issue(s)`) 
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log(`PASS  TypeScript syntax gate — ${files.length} source files transpiled`)
console.log(`PASS  Local import resolution — ${localImports.length} module links resolved`)
