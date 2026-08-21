import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'

const appRoot = process.cwd()
const repoRoot = path.resolve(appRoot, '../..')

function loadSyntaxEngine() {
  const requireFromApp = createRequire(path.join(appRoot, 'package.json'))
  const requireFromRepo = createRequire(path.join(repoRoot, 'package.json'))
  const candidates = [
    () => requireFromApp('typescript'),
    () => requireFromRepo('typescript'),
  ]

  // A developer checkout may keep TypeScript under another workspace app.
  // This is only a parser lookup; it never imports application source or
  // creates an import-closure typecheck.
  const opsPackage = path.join(repoRoot, 'apps/ops-web/package.json')
  if (fs.existsSync(opsPackage)) {
    const requireFromOps = createRequire(opsPackage)
    candidates.push(() => requireFromOps('typescript'))
  }

  for (const resolve of candidates) {
    try {
      const ts = resolve()
      if (ts?.transpileModule) {
        return { kind: 'typescript', ts }
      }
    } catch {}
  }

  // Marketplace's Next dependency is a production dependency and Next ships
  // a compiled Babel parser. Use it as a syntax-only fallback when local dev
  // dependencies were intentionally omitted from node_modules.
  try {
    const parser = requireFromApp('next/dist/compiled/babel/parser')
    if (parser?.parse) {
      return { kind: 'next-babel', parser }
    }
  } catch {}

  throw new Error(
    'No local TypeScript syntax engine is available. Expected either the '
    + 'typescript dev dependency or Next\'s bundled parser. No package was '
    + 'downloaded and no build was attempted.',
  )
}

const engine = loadSyntaxEngine()
console.log(`SYNTAX_ENGINE=${engine.kind}`)

const output = execFileSync(
  'git',
  ['diff', '--name-only', '--diff-filter=ACMRTUXB', '--', 'apps/marketplace-web'],
  { cwd: repoRoot, encoding: 'utf8' },
)
const untracked = execFileSync(
  'git',
  ['ls-files', '--others', '--exclude-standard', 'apps/marketplace-web'],
  { cwd: repoRoot, encoding: 'utf8' },
)
const files = [...new Set(
  `${output}\n${untracked}`
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((file) => /\.(ts|tsx)$/.test(file)),
)]

function checkWithTypeScript(source, local) {
  const ts = engine.ts
  const result = ts.transpileModule(source, {
    fileName: local,
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.ReactJSX,
    },
  })
  return (result.diagnostics || [])
    .filter((item) => item.category === ts.DiagnosticCategory.Error)
    .map((error) => ts.flattenDiagnosticMessageText(error.messageText, ' '))
}

function checkWithNextBabel(source, local) {
  try {
    engine.parser.parse(source, {
      sourceType: 'unambiguous',
      sourceFilename: local,
      errorRecovery: false,
      plugins: [
        'typescript',
        ...(local.endsWith('.tsx') ? ['jsx'] : []),
        'decorators-legacy',
        'importAttributes',
        'topLevelAwait',
      ],
    })
    return []
  } catch (error) {
    const location = error?.loc
      ? `line ${error.loc.line}, column ${error.loc.column}`
      : 'unknown location'
    return [`${location}: ${error?.message || String(error)}`]
  }
}

let failures = 0
for (const repoRelative of files) {
  const local = repoRelative.replace(/^apps\/marketplace-web\//, '')
  const absolute = path.join(appRoot, local)
  if (!fs.existsSync(absolute)) continue

  const source = fs.readFileSync(absolute, 'utf8')
  const errors = engine.kind === 'typescript'
    ? checkWithTypeScript(source, local)
    : checkWithNextBabel(source, local)

  if (!errors.length) {
    console.log(`✅ ${local}`)
    continue
  }

  failures += errors.length
  console.log(`❌ ${local}`)
  for (const error of errors) {
    console.log(`   ${error}`)
  }
}

console.log('')
console.log(`CHANGED_TS_FILES=${files.length}`)
console.log(`SYNTAX_ERRORS=${failures}`)
if (failures) process.exit(1)
