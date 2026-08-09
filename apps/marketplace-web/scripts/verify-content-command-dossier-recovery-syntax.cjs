const fs = require('fs')
const path = require('path')
const cp = require('child_process')
const app = path.resolve(process.argv[2] || process.cwd())
let ts
for (const candidate of [
  path.join(app, 'node_modules', 'typescript'),
  'typescript',
]) {
  try { ts = require(candidate); break } catch {}
}
if (!ts) {
  try {
    const globalRoot = cp.execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim()
    ts = require(path.join(globalRoot, 'typescript'))
  } catch {}
}
if (!ts) {
  console.error('FAIL — TypeScript compiler module is unavailable for isolated syntax verification.')
  process.exit(1)
}
const files = [
  'app/api/market-os/content-command-headquarters/actions/route.ts',
  'lib/market-os/content-command-headquarters/auth.ts',
  'lib/market-os/content-command-headquarters/dossier-recovery-service.ts',
  'components/market-os/content-command/content-briefs-page.tsx',
  'components/market-os/content-command/headquarters/mz2-view-models.ts',
  'components/market-os/content-command/experience-bulk1/bulk1-derivations.ts',
  'components/market-os/content-command/experience-bulk1/Bulk1DossierWorkspace.tsx',
  'components/market-os/content-command/experience-bulk1/DossierBriefRecoveryWorkspace.tsx',
  'components/market-os/content-command/experience-bulk1/DossierRecoveryDock.tsx',
]
let failures = 0
for (const rel of files) {
  const source = fs.readFileSync(path.join(app, rel), 'utf8')
  const result = ts.transpileModule(source, {
    fileName: rel,
    reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.Preserve },
  })
  const errors = (result.diagnostics || []).filter((item) => item.category === ts.DiagnosticCategory.Error)
  if (errors.length) {
    failures += errors.length
    for (const error of errors) console.error(`${rel}: ${ts.flattenDiagnosticMessageText(error.messageText, '\n')}`)
  }
}
if (failures) process.exit(1)
console.log(`PASS — ${files.length} TS/TSX files pass isolated TypeScript syntax transformation.`)
