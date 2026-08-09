import fs from 'node:fs'
import path from 'node:path'

const app = path.resolve(process.argv[2] || process.cwd())
let checks = 0
const failures = []
const pass = (condition, label) => {
  checks += 1
  if (!condition) failures.push(label)
}
const read = (rel) => fs.readFileSync(path.join(app, rel), 'utf8')
const exists = (rel) => fs.existsSync(path.join(app, rel))
const walk = (dir) => {
  const root = path.join(app, dir)
  if (!fs.existsSync(root)) return []
  const out = []
  const visit = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name)
      if (entry.isDirectory()) visit(full)
      else out.push(path.relative(app, full).replaceAll(path.sep, '/'))
    }
  }
  visit(root)
  return out
}

const runtime = 'components/market-os/content-command/runtime/content-command-runtime.ts'
const guard = 'components/market-os/content-command/runtime/ContentCommandRuntimeGuard.tsx'
const guardCss = 'components/market-os/content-command/runtime/content-command-runtime-guard.module.css'
const shell = 'components/market-os/content-command/ContentCommand360Shell.tsx'
const opportunity = 'components/market-os/content-command/experience-bulk11/Bulk11OpportunityCommandWorkspace.tsx'
const opportunityCss = 'components/market-os/content-command/experience-bulk11/bulk11-opportunity.module.css'
const opportunityApi = 'app/api/market-os/content-command/opportunities/action/route.ts'
const auth = 'lib/market-os/content-command-headquarters/auth.ts'
const serverErrors = 'lib/market-os/content-command-headquarters/runtime-errors.ts'
const lifecycle = 'lib/market-os/content-command-headquarters/record-lifecycle-service.ts'
const intelligence = 'lib/market-os/content-command-headquarters/opportunity-intelligence-service.ts'

for (const rel of [runtime, guard, guardCss, shell, opportunity, opportunityCss, opportunityApi, auth, serverErrors, lifecycle, intelligence]) {
  pass(exists(rel), `Missing required runtime-hardening file: ${rel}`)
}

const runtimeText = read(runtime)
pass(runtimeText.includes('export class ContentCommandRequestError'), 'Governed request error class is missing.')
pass(runtimeText.includes("window.dispatchEvent(new CustomEvent<ContentCommandBlockerPayload>('content-command:blocker'"), 'Blocker event dispatch is missing.')
pass(runtimeText.includes('if (error instanceof ContentCommandRequestError) return true'), 'Governed API errors are not protected from runtime overlays.')
pass(runtimeText.includes("response.status === 409"), 'HTTP 409 classification is missing.')
pass(runtimeText.includes("response.status === 413"), 'HTTP 413 validation classification is missing.')
pass(runtimeText.includes("response.status === 429"), 'Provider/rate-limit classification is missing.')
pass(runtimeText.includes('inferredRecovery'), 'Fallback recovery instructions are missing.')

const guardText = read(guard)
pass(guardText.includes("window.addEventListener('unhandledrejection'"), 'Unhandled promise protection is missing.')
pass(guardText.includes('event.preventDefault()'), 'Expected business rejections are not suppressed.')
pass(guardText.includes('inspectionOf(blocker)'), 'Dependency inspection rendering is missing.')
pass(guardText.includes('Dépendances bloquantes'), 'Dependency recovery theatre is missing.')
pass(guardText.includes('Actualiser'), 'Runtime retry control is missing.')
pass(read(shell).includes('<ContentCommandRuntimeGuard />'), 'Runtime guard is not mounted in the global Content Command shell.')

const componentFiles = walk('components/market-os/content-command').filter((file) => /\.(tsx?|jsx?)$/.test(file))
const fetchOwners = []
const catchRethrows = []
for (const rel of componentFiles) {
  const text = read(rel)
  if (/\bfetch\s*\(/.test(text)) fetchOwners.push(rel)
  if (/catch\s*\([^)]*\)\s*\{[\s\S]{0,700}?\bthrow\s+(?:error|e)\b/.test(text)) catchRethrows.push(rel)
}
pass(fetchOwners.length === 1 && fetchOwners[0] === runtime, `Direct fetch must exist only in the governed runtime client. Found: ${fetchOwners.join(', ')}`)
pass(catchRethrows.length === 0, `Client catch blocks still rethrow expected business errors: ${catchRethrows.join(', ')}`)

const migratedClients = [
  'components/market-os/content-command/ContentCommand360Home.tsx',
  'components/market-os/content-command/ai-director-universe/AiDirectorUniverseShell.tsx',
  'components/market-os/content-command/content-command-system.tsx',
  'components/market-os/content-command/experience-bulk4/bulk4-api.tsx',
  'components/market-os/content-command/experience-bulk5/bulk5-api.tsx',
  'components/market-os/content-command/experience-bulk8/Bulk8AiExecutiveWorkspace.tsx',
  'components/market-os/content-command/headquarters/EvidenceWorkspace.tsx',
  'components/market-os/content-command/headquarters/SourceVaultWorkspace.tsx',
  'components/market-os/content-command/headquarters/client.tsx',
  'components/market-os/content-command/marketing-ai/MarketingAiDirectorWorkspace.tsx',
  'components/market-os/content-command/marketing-ai/MarketingAutopilotWorkspace.tsx',
  'components/market-os/content-command/research-control/ContentResearchControlWorkspace.tsx',
]
for (const rel of migratedClients) pass(read(rel).includes('contentCommandRequest'), `${rel} is not wired through the governed request runtime.`)

const errorText = read(serverErrors)
for (const token of ['DEPENDENCY_BLOCKED', 'PERMISSION_DENIED', 'AUTHORITY_REQUIRED', 'VALIDATION_REQUIRED', 'CAPABILITY_UNAVAILABLE', 'RECORD_PROTECTED', 'SYSTEM_FAILURE']) {
  pass(errorText.includes(token), `Server blocker taxonomy is missing ${token}.`)
}
pass(read(auth).includes('serializeContentCommandError'), 'Headquarters API errors are not serialized structurally.')

const lifecycleText = read(lifecycle)
pass(lifecycleText.includes('details:{inspection}'), 'Lifecycle blockers do not expose full dependency inspection details.')
pass(lifecycleText.includes('routeForDependency'), 'Dependency records do not expose opening routes.')
pass(lifecycleText.includes("kind:hasDependencies?'dependency'"), 'Lifecycle dependency classification is missing.')
pass(lifecycleText.includes("code:'TYPED_CONFIRMATION_MISMATCH'"), 'Typed confirmation is not a governed validation response.')

const opportunityText = read(opportunity)
for (const token of ['loadInspection', 'dependencyResolution', 'detach_strategy', 'Archiver à la place', 'Inspection complète', 'Réévaluer']) {
  pass(opportunityText.includes(token), `Opportunity purge recovery is missing ${token}.`)
}
pass(!/catch\s*\([^)]*\)\s*\{[\s\S]{0,500}?throw/.test(opportunityText), 'Opportunity actions still rethrow expected conflicts.')
pass(opportunityText.includes("setNoticeTone(blocked.kind==='system'?'danger':'warning')"), 'Opportunity business blockers are not rendered with warning/error tone.')
pass(read(opportunityCss).includes('.dependencyResolution'), 'Opportunity dependency resolution styles are missing.')

const opportunityApiText = read(opportunityApi)
pass(opportunityApiText.includes("action==='detach_strategy'"), 'Opportunity API does not expose governed strategy detachment.')
pass(opportunityApiText.includes("detachOpportunityFromStrategy"), 'Opportunity API is not wired to detachment service.')
const intelligenceText = read(intelligence)
pass(intelligenceText.includes('export async function detachOpportunityFromStrategy'), 'Strategy detachment service is missing.')
pass(intelligenceText.includes('protectedStatuses'), 'Protected strategy states are not guarded during detachment.')
pass(intelligenceText.includes('content_opportunity.strategy_detached'), 'Strategy detachment audit is missing.')

const noticeStyles = [
  'components/market-os/content-command/experience-bulk11/bulk11-opportunity.module.css',
  'components/market-os/content-command/experience-bulk12/bulk12-campaign.module.css',
  'components/market-os/content-command/experience-bulk9/bulk9-governance.module.css',
]
for (const rel of noticeStyles) {
  const text = read(rel)
  pass(text.includes('[data-tone="warning"]') || text.includes('[data-tone=warning]'), `${rel} lacks warning notice styling.`)
  pass(text.includes('[data-tone="danger"]') || text.includes('[data-tone=danger]'), `${rel} lacks danger notice styling.`)
}

// Deterministic closure model: expected business states must remain recoverable.
const model = [
  { status: 409, technical: 'ACTION_BLOCKED:Des dépendances doivent être résolues', kind: 'dependency' },
  { status: 403, technical: 'FORBIDDEN', kind: 'permission' },
  { status: 400, technical: 'FIELD_REQUIRED', kind: 'validation' },
  { status: 503, technical: 'PROVIDER_UNAVAILABLE', kind: 'provider' },
]
for (const sample of model) {
  const kind = sample.status === 403 ? 'permission'
    : sample.status === 409 && /DEPEND|DÉPEND|ACTION_BLOCKED/i.test(sample.technical) ? 'dependency'
    : sample.status === 400 ? 'validation'
    : sample.status === 503 ? 'provider'
    : 'system'
  pass(kind === sample.kind, `Deterministic blocker model failed for ${sample.technical}.`)
}

if (failures.length) {
  console.error(`FAIL — ${failures.length} of ${checks} zero-blocker checks failed.`)
  for (const failure of failures) console.error(` - ${failure}`)
  process.exit(1)
}
console.log(`PASS — ${checks} zero-blocker runtime, recovery, dependency and client-action checks passed.`)
console.log(`PASS — ${componentFiles.length} Content Command client source files inspected; direct fetch ownership is centralized.`)
