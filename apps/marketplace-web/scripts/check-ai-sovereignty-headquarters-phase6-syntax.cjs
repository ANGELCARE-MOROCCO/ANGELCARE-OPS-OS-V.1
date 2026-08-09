const fs = require('fs')
const path = require('path')

const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd()
const candidates = [
  path.join(root, 'node_modules/typescript'),
  '/opt/nvm/versions/node/v24.18.0/lib/node_modules/typescript',
  '/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript',
  '/usr/local/lib/node_modules/typescript',
]
let ts
for (const candidate of candidates) {
  try { ts = require(candidate); break } catch {}
}
if (!ts) {
  console.error('ERROR: TypeScript runtime was not found. Install dependencies or expose a global TypeScript installation.')
  process.exit(2)
}
const files = [
  'components/ai-provider-control/headquarters/headquarters-primitives.tsx',
  'components/ai-provider-control/headquarters/headquarters-types.ts',
  'components/ai-provider-control/headquarters/AiSovereigntyOperationsHeadquarters.tsx',
  'components/ai-provider-control/headquarters/AiSovereigntyOperatorAcademy.tsx',
  'lib/ai-provider-control/types.ts',
  'lib/ai-provider-control/repository.ts',
  'lib/ai-provider-control/gemini-runtime.ts',
  'app/api/ai-provider-control/action/route.ts',
  'app/(protected)/ai-provider-control/page.tsx',
  'app/(protected)/ai-provider-control/runtime-core/page.tsx',
  'app/(protected)/ai-provider-control/manual/page.tsx',
]
let errors = 0
for (const relative of files) {
  const filename = path.join(root, relative)
  if (!fs.existsSync(filename)) { console.error(`MISSING · ${relative}`); errors += 1; continue }
  const source = fs.readFileSync(filename, 'utf8')
  const result = ts.transpileModule(source, {
    fileName: filename,
    reportDiagnostics: true,
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      isolatedModules: true,
      verbatimModuleSyntax: true,
    },
  })
  const diagnostics = (result.diagnostics || []).filter((item) => item.category === ts.DiagnosticCategory.Error)
  if (diagnostics.length) {
    console.error(`\n${relative}`)
    for (const diagnostic of diagnostics) console.error(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))
    errors += diagnostics.length
  }
}
console.log(`Phase 6 isolated syntax · ${files.length} files · ${errors} error(s)`)
process.exit(errors ? 2 : 0)
