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
let declarationCount = 0
function resolveLocal(specifier, owner) {
  let base
  if (specifier.startsWith('@/')) base = path.join(root, specifier.slice(2))
  else if (specifier.startsWith('.')) base = path.resolve(path.dirname(owner), specifier)
  else return true
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.d.ts`, `${base}.json`, `${base}.css`, path.join(base, 'index.ts'), path.join(base, 'index.tsx'), path.join(base, 'index.d.ts')]
  return candidates.some((candidate) => fs.existsSync(candidate))
}

function formatDiagnostic(file, sourceFile, diagnostic) {
  const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
  if (diagnostic.start == null) return `${path.relative(root, file)} ${message}`
  const point = sourceFile.getLineAndCharacterOfPosition(diagnostic.start)
  return `${path.relative(root, file)}:${point.line + 1}:${point.character + 1} ${message}`
}

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8')
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)

  // Declaration files define types and intentionally emit no JavaScript.
  // transpileModule can throw "Debug Failure. Output generation failed" when
  // asked to emit a .d.ts file, so declaration syntax is parsed directly.
  if (file.endsWith('.d.ts')) {
    declarationCount += 1
    for (const diagnostic of sourceFile.parseDiagnostics || []) {
      failures.push(formatDiagnostic(file, sourceFile, diagnostic))
    }
  } else {
    try {
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
        failures.push(formatDiagnostic(file, sourceFile, diagnostic))
      }
    } catch (error) {
      const detail = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
      failures.push(`${path.relative(root, file)} transpilation failed — ${detail}`)
    }
  }

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

console.log(`PASS  TypeScript syntax gate — ${files.length - declarationCount} implementation source files transpiled`)
console.log(`PASS  TypeScript declaration syntax gate — ${declarationCount} declaration files parsed without emission`)
console.log(`PASS  Local import resolution — ${localImports.length} module links resolved`)
