const fs = require('fs')
const path = require('path')
const cp = require('child_process')

function loadTypeScript() {
  try { return require('typescript') } catch {}
  const globalRoot = cp.execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim()
  return require(path.join(globalRoot, 'typescript'))
}
const ts = loadTypeScript()
const root = process.cwd()
const files = [
  'lib/ai-provider-control/types.ts',
  'lib/ai-provider-control/governor.ts',
  'lib/ai-provider-control/gemini-runtime.ts',
  'lib/ai-provider-control/repository.ts',
  'lib/ai-provider-control/auth.ts',
  'components/ai-provider-control/AiProviderControlWorkspace.tsx',
  'components/ai-provider-control/RevenueSovereigntyWorkspace.tsx',
  'app/api/ai-provider-control/action/route.ts',
  'app/api/revenue-command-os/ai/governance/route.ts',
  'app/api/revenue-command-os/ai/usage/route.ts',
  'app/(protected)/revenue-command-os/gemini-resources/_components/AiSovereigntyGovernancePanel.tsx',
  'app/(protected)/revenue-command-os/gemini-resources/_components/GeminiResourcesWorkspace.tsx',
  'lib/revenue-command-os/ai/config.ts',
  'lib/revenue-command-os/ai/errors.ts',
  'lib/revenue-command-os/ai/gemini-provider.ts',
  'lib/revenue-command-os/ai/repository.ts',
  'lib/revenue-command-os/cockpit/executive-brief.ts',
  'lib/revenue-command-os/strategy-brain/ai-orchestration.ts',
  'lib/revenue-command-os/validation-council/gemini-agent.ts',
  'lib/revenue-command-os/validation-council/repository.ts',
]
const failures = []
for (const relative of files) {
  const absolute = path.join(root, relative)
  if (!fs.existsSync(absolute)) { failures.push(`${relative}: missing`); continue }
  const source = fs.readFileSync(absolute, 'utf8')
  const result = ts.transpileModule(source, {
    fileName: absolute,
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
      strict: true,
      isolatedModules: true,
    },
  })
  for (const diagnostic of result.diagnostics || []) {
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
    const position = diagnostic.file && diagnostic.start != null
      ? diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start)
      : null
    failures.push(`${relative}${position ? `:${position.line + 1}:${position.character + 1}` : ''}: ${message}`)
  }
}
console.log(JSON.stringify({
  contract: 'AC-AI-SOVEREIGNTY-REVENUE-INTEGRATION-2026.07',
  verifier: 'PHASE5_TS_TSX_ISOLATED_SYNTAX',
  files: files.length,
  diagnostics: failures.length,
  failures,
}, null, 2))
if (failures.length) process.exit(1)
