import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { createRequire } from 'node:module'

const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd()
const app = path.join(root, 'apps/ops-web')
const required = [
  'app/(protected)/ai-provider-control/page.tsx',
  'app/api/ai-provider-control/snapshot/route.ts',
  'app/api/ai-provider-control/action/route.ts',
  'components/ai-provider-control/AiProviderControlWorkspace.tsx',
  'components/ai-provider-control/ai-provider-control.module.css',
  'lib/ai-provider-control/auth.ts',
  'lib/ai-provider-control/types.ts',
  'lib/ai-provider-control/repository.ts',
  'lib/ai-provider-control/governor.ts',
  'lib/revenue-command-os/ai/gemini-provider.ts',
  'lib/market-os/marketing-ai/provider.ts',
  'lib/market-os/marketing-ai/config.ts',
  'supabase/migrations/20260726_0500_ai_provider_sovereign_control_plane_phase4.sql',
  'supabase/ai-provider-control/preflight/20260726_ai_provider_control_phase4_preflight.sql',
  'supabase/ai-provider-control/verification/20260726_ai_provider_control_phase4_verification.sql',
]
let failed = false
for (const relative of required) {
  const file = path.join(app, relative)
  if (!fs.existsSync(file)) { console.error(`FAIL missing ${relative}`); failed = true }
  else console.log(`PASS ${relative}`)
}

const css = fs.readFileSync(path.join(app, 'components/ai-provider-control/ai-provider-control.module.css'), 'utf8')
for (const [label, regex] of [
  ['bare :root', /(^|})\s*:root\s*\{/m],
  ['bare universal reduced-motion selector', /@media[^{}]*prefers-reduced-motion[^{}]*\{\s*\*\s*\{/m],
]) {
  if (regex.test(css)) { console.error(`FAIL CSS ${label}`); failed = true } else console.log(`PASS CSS ${label} absent`)
}

const migration = fs.readFileSync(path.join(app, 'supabase/migrations/20260726_0500_ai_provider_sovereign_control_plane_phase4.sql'), 'utf8')
const tables = [...migration.matchAll(/create table if not exists public\.(ai_provider_[a-z_]+)/g)].map(match => match[1])
const uniqueTables = new Set(tables)
if (uniqueTables.size < 17) { console.error(`FAIL expected >=17 provider tables, found ${uniqueTables.size}`); failed = true }
else console.log(`PASS ${uniqueTables.size} provider tables`)
for (const fn of ['ai_provider_store_credential','ai_provider_resolve_secret','ai_provider_resolve_runtime_provider','ai_provider_acquire_runtime_budget','ai_provider_reconcile_runtime_budget','ai_provider_fail_runtime_budget','ai_provider_simulate_runtime_route','ai_provider_restore_configuration']) {
  if (!migration.includes(`function public.${fn}`)) { console.error(`FAIL missing function ${fn}`); failed = true }
  else console.log(`PASS function ${fn}`)
}
if (!migration.includes('vault.create_secret')) { console.error('FAIL Vault storage not found'); failed = true } else console.log('PASS Vault secret storage')
if (!migration.includes('revoke all on function public.ai_provider_resolve_secret')) { console.error('FAIL secret resolver privilege hardening missing'); failed = true } else console.log('PASS secret resolver locked')
for (const [label, token] of [
  ['global atomic lock', "hashtextextended('ai_provider:global'"],
  ['capacity-pool atomic lock', "hashtextextended('ai_provider:pool:'"],
  ['project provider ceilings', 'AI_PROVIDER_CEILING_EXHAUSTED:RPD'],
  ['configuration rollback', 'ai_provider_restore_configuration'],
  ['model allowlist enforcement', 'AI_PROVIDER_MODEL_NOT_ALLOWED'],
]) {
  if (!migration.includes(token)) { console.error(`FAIL ${label}`); failed = true } else console.log(`PASS ${label}`)
}

const providerFiles = [
  path.join(app, 'lib/revenue-command-os/ai/gemini-provider.ts'),
  path.join(app, 'lib/market-os/marketing-ai/provider.ts'),
]
for (const file of providerFiles) {
  const src = fs.readFileSync(file, 'utf8')
  if (!src.includes('acquireGovernedProvider')) { console.error(`FAIL gateway not integrated: ${file}`); failed = true }
  else console.log(`PASS gateway integrated ${path.basename(file)}`)
}

const sourceFiles = required.filter(file => /\.(ts|tsx)$/.test(file))
console.log(`INFO ${sourceFiles.length} TypeScript/TSX files reserved for the dedicated tsc gate.`)
try {
  const require = createRequire(import.meta.url)
  const ts = require(path.join(app, 'node_modules/typescript'))
  let syntaxErrors = 0
  for (const relative of sourceFiles) {
    const fileName = path.join(app, relative)
    const result = ts.transpileModule(fs.readFileSync(fileName, 'utf8'), {
      fileName,
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.Preserve, isolatedModules: true },
      reportDiagnostics: true,
    })
    for (const diagnostic of result.diagnostics || []) {
      if (diagnostic.category === ts.DiagnosticCategory.Error) {
        syntaxErrors += 1
        console.error(`FAIL syntax ${relative}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`)
      }
    }
  }
  if (syntaxErrors) failed = true
  else console.log(`PASS isolated syntax ${sourceFiles.length} files`)
} catch {
  console.log('INFO local TypeScript package unavailable; VERIFY_STATIC.sh will run the dedicated tsc gate in the repository.')
}

const digest = crypto.createHash('sha256').update(migration).digest('hex')
console.log(`INFO migration sha256 ${digest}`)
if (failed) process.exit(1)
console.log('AI Provider Sovereign Control Plane Phase 4 focused verification passed.')
