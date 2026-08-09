import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const app = process.argv[2] || process.cwd()
const requireFromApp = createRequire(path.join(app, 'package.json'))
const candidates = [path.join(app, 'node_modules/typescript/lib/typescript.js'), path.resolve(path.dirname(process.execPath), '../lib/node_modules/typescript/lib/typescript.js')]
const typescriptPath = candidates.find((candidate) => fs.existsSync(candidate))
if (!typescriptPath) throw new Error('TypeScript is unavailable from the app or active Node installation.')
const ts = requireFromApp(typescriptPath)
let checks = 0
const pass = (label) => { checks += 1; console.log(`PASS  ${label}`) }
const fail = (label) => { throw new Error(`FAIL  ${label}`) }
const read = (relative) => fs.readFileSync(path.join(app, relative), 'utf8')
const requireFile = (relative) => fs.existsSync(path.join(app, relative)) ? pass(`file ${relative}`) : fail(`missing ${relative}`)
const includes = (source, marker, label) => source.includes(marker) ? pass(label) : fail(`${label}: ${marker}`)

const files = [
  'components/angelcare360/operator/growth/CorporateControlLayer.tsx',
  'components/angelcare360/operator/growth/CorporateControlLayer.module.css',
  'components/angelcare360/operator/growth/CustomerSovereignCommandRoom.tsx',
  'components/angelcare360/operator/growth/GrowthOperatingSystem.tsx',
  'components/angelcare360/operator/growth/GrowthPortal.tsx',
  'lib/angelcare360/operator/growth.ts',
  'types/angelcare360/operator/growth.ts',
  'supabase/migrations/20260731_angelcare360_operator_commercial_customer_corporate_control_layer.sql',
]
files.forEach(requireFile)

const layer = read(files[0])
const room = read(files[2])
const operating = read(files[3])
const portal = read(files[4])
const server = read(files[5])
const types = read(files[6])
const sql = read(files[7])

for (const marker of [
  'Strategic Account Planning','Relationship Coverage Intelligence','Enterprise Forecast Governance',
  'Commercial Authority Chamber','Commercial Change Order Studio','Customer Success & Outcome Plan',
  'Customer Health Score Studio','Contract-Based Support Entitlement','Account Escalation Command',
]) includes(portal, marker, `portal ${marker}`)

for (const marker of [
  'Account Strategy','Relationship Coverage','Forecast Governance','Authority Matrix','Change Orders',
  'Customer Outcomes','Health Score Studio','Contractual Service',
]) includes(layer, marker, `control ${marker}`)

for (const marker of [
  'GrowthAccountPlanRecord','GrowthRelationshipCoverageRecord','GrowthForecastRecord','GrowthApprovalRecord',
  'GrowthChangeOrderRecord','GrowthSuccessPlanRecord','GrowthHealthModelRecord','GrowthSupportEntitlementRecord','GrowthEscalationRecord',
]) includes(types, marker, `type ${marker}`)

for (const marker of [
  "account_plan: 'angelcare360_operator_growth_account_plans'",
  "relationship_coverage: 'angelcare360_operator_growth_relationship_coverage'",
  "forecast: 'angelcare360_operator_growth_forecasts'",
  "approval: 'angelcare360_operator_growth_approvals'",
  "change_order: 'angelcare360_operator_growth_change_orders'",
  "success_plan: 'angelcare360_operator_growth_success_plans'",
  "health_model: 'angelcare360_operator_growth_health_models'",
  "support_entitlement: 'angelcare360_operator_growth_support_entitlements'",
  "escalation: 'angelcare360_operator_growth_escalations'",
  'applyContractualSupportEntitlement',
]) includes(server, marker, `server ${marker}`)

includes(operating, '<CorporateControlLayer snapshot={snapshot}', 'corporate layer embedded in operating scenes')
includes(room, 'corporateEmphasis(section)', 'corporate layer embedded in customer dossier')
includes(room, 'CustomerSovereignCommandRoom', 'customer sovereign command room retained')

const tables = [
  'angelcare360_operator_growth_account_plans','angelcare360_operator_growth_relationship_coverage',
  'angelcare360_operator_growth_forecasts','angelcare360_operator_growth_approvals',
  'angelcare360_operator_growth_change_orders','angelcare360_operator_growth_success_plans',
  'angelcare360_operator_growth_health_models','angelcare360_operator_growth_support_entitlements',
  'angelcare360_operator_growth_escalations',
]
for (const table of tables) {
  includes(sql, `create table if not exists public.${table}`, `SQL table ${table}`)
  includes(sql, `alter table public.${table} enable row level security`, `RLS ${table}`)
  includes(sql, `revoke all on table public.${table} from anon, authenticated`, `revoke ${table}`)
  includes(sql, `grant all on table public.${table} to service_role`, `service role ${table}`)
}

const css = read(files[1])
const classMatches = [...layer.matchAll(/styles\.([A-Za-z0-9_]+)/g)].map((match) => match[1])
for (const className of [...new Set(classMatches)]) {
  const pattern = new RegExp(`\\.${className}(?:[^A-Za-z0-9_-]|$)`)
  pattern.test(css) ? pass(`CSS ${className}`) : fail(`CSS class missing ${className}`)
}

for (const relative of files.filter((file) => /\.(ts|tsx)$/.test(file))) {
  const source = read(relative)
  const result = ts.transpileModule(source, {
    fileName: relative,
    reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX },
  })
  const diagnostics = result.diagnostics || []
  if (diagnostics.length) fail(`TypeScript syntax ${relative}: ${diagnostics.map((item) => ts.flattenDiagnosticMessageText(item.messageText, '\n')).join(' | ')}`)
  pass(`TypeScript syntax ${relative}`)
}

if (/\b(DROP\s+TABLE|TRUNCATE\s+TABLE)\b/i.test(sql)) fail('destructive SQL marker')
pass('no destructive SQL table operation')
if ((operating.match(/GROWTH_MODES/g) || []).length < 1) fail('master navigation contract missing')
pass('existing single master navigation retained')

console.log(`\n${checks} checks passed. Commercial & Customer Corporate Control Layer is statically accepted.`)
