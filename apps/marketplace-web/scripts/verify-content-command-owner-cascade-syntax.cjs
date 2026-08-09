const fs = require('fs')
const path = require('path')
const os = require('os')
const Module = require('module')
const app = path.resolve(process.argv[2] || process.cwd())
const candidates = [
  path.join(app, 'node_modules/typescript/lib/typescript.js'),
  path.join(app, '../../node_modules/typescript/lib/typescript.js'),
  path.join(os.homedir(), '.cache/angelcare-typescript-runtime/node_modules/typescript/lib/typescript.js'),
  '/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js',
  '/usr/local/lib/node_modules/typescript/lib/typescript.js',
]
let ts
for (const candidate of candidates) {
  try { if (fs.existsSync(candidate)) { ts = require(candidate); break } } catch {}
}
if (!ts) {
  console.log('SKIP — TypeScript compiler module unavailable; run the focused TypeScript script after dependencies are installed.')
  process.exit(0)
}
const files = [
  'components/market-os/content-command/ContentCommand360Home.tsx',
  'components/market-os/content-command/experience-bulk11/Bulk11OpportunityCommandWorkspace.tsx',
  'components/market-os/content-command/experience-bulk11/bulk11-opportunity-model.ts',
  'components/market-os/content-command/headquarters/mz2-view-models.ts',
  'components/market-os/content-command/experience-bulk9/bulk9-governance-model.ts',
  'components/market-os/content-command/experience-bulk9/RecordGovernanceAuthority.tsx',
  'components/market-os/content-command/experience-bulk12/Bulk12CampaignOperatingWorkspace.tsx',
  'components/market-os/content-command/runtime/CascadeDisposalPanel.tsx',
  'app/api/market-os/content-command/campaigns/action/route.ts',
  'app/api/market-os/content-command/opportunities/action/route.ts',
  'app/api/market-os/content-command-headquarters/record-governance/route.ts',
  'lib/market-os/content-command-headquarters/record-lifecycle-service.ts',
  'lib/market-os/content-command-headquarters/campaign-orchestration-service.ts',
  'lib/market-os/content-command-headquarters/opportunity-intelligence-service.ts',
]
let failures = 0
for (const rel of files) {
  const file = path.join(app, rel)
  if (!fs.existsSync(file)) { console.error(`FAIL — missing ${rel}`); failures++; continue }
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX },
    reportDiagnostics: true,
    fileName: rel,
  })
  const errors = (output.diagnostics || []).filter(item => item.category === ts.DiagnosticCategory.Error)
  if (errors.length) {
    failures++
    console.error(`FAIL — ${rel}`)
    for (const error of errors) console.error(`  ${ts.flattenDiagnosticMessageText(error.messageText, ' ')}`)
  }
}
if (failures) process.exit(1)
console.log(`PASS — ${files.length} owner-cascade TS/TSX files pass isolated syntax transformation with TypeScript ${ts.version}.`)
