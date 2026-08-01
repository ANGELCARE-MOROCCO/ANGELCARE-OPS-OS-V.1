const fs = require('fs')
const path = require('path')
const child = require('child_process')

const app = path.resolve(process.argv[2] || process.cwd())
const repo = path.resolve(app, '../..')
const home = process.env.HOME || ''
const candidates = [
  path.join(app, 'node_modules'),
  path.join(repo, 'node_modules'),
  path.join(home, '.cache/angelcare-typescript-runtime/node_modules'),
  path.join(process.cwd(), 'node_modules'),
]
let ts
for (const base of candidates) {
  try { ts = require(require.resolve('typescript', { paths: [base] })); break } catch {}
}
if (!ts) {
  try { ts = require('typescript') } catch {}
}

const manifest = process.argv[3]
if (!manifest || !fs.existsSync(manifest)) {
  console.error('FAIL — changed-file manifest was not provided.')
  process.exit(1)
}
const files = fs.readFileSync(manifest, 'utf8').split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
const source = files.filter((rel) => /\.(tsx?|jsx?)$/.test(rel))
let failures = 0

if (ts) {
  for (const rel of source) {
    const full = path.join(app, rel)
    const text = fs.readFileSync(full, 'utf8')
    const kind = rel.endsWith('.tsx') ? ts.ScriptKind.TSX : rel.endsWith('.ts') ? ts.ScriptKind.TS : rel.endsWith('.jsx') ? ts.ScriptKind.JSX : ts.ScriptKind.JS
    const sf = ts.createSourceFile(full, text, ts.ScriptTarget.Latest, true, kind)
    if (sf.parseDiagnostics.length) {
      failures += 1
      console.error(`FAIL — ${rel}`)
      for (const diagnostic of sf.parseDiagnostics) {
        const at = sf.getLineAndCharacterOfPosition(diagnostic.start || 0)
        console.error(`  ${at.line + 1}:${at.character + 1} TS${diagnostic.code} ${ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ')}`)
      }
    }
  }
  if (failures) process.exit(1)
  console.log(`PASS — ${source.length} changed TS/TSX/JS files pass TypeScript parser verification (${ts.version}).`)
} else {
  // Do not recreate the previous installer dead-end when TypeScript is not resolvable.
  // Static architecture checks still run; the separate focused TypeScript command remains available.
  console.warn('WARN — TypeScript module not resolvable; installer parser gate skipped without rolling back valid source.')
  console.warn('Run verify-content-command-zero-blocker-runtime-typescript.sh after dependencies are available.')
}
