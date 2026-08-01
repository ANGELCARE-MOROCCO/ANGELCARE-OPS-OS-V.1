import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const app = process.argv[2] || process.cwd()
const requireFromApp = createRequire(path.join(app, 'package.json'))
const ts = requireFromApp('typescript')

let checks = 0
const failures = []

function pass(label) {
  checks += 1
  console.log(`PASS  ${label}`)
}

function fail(label, detail = '') {
  failures.push(detail ? `${label}: ${detail}` : label)
  console.error(`FAIL  ${label}${detail ? ` — ${detail}` : ''}`)
}

function assert(condition, label, detail = '') {
  if (condition) pass(label)
  else fail(label, detail)
}

function read(rel) {
  const file = path.join(app, rel)
  if (!fs.existsSync(file)) {
    fail(`required file ${rel}`, 'missing')
    return ''
  }
  pass(`required file ${rel}`)
  return fs.readFileSync(file, 'utf8')
}

const files = {
  component: 'components/angelcare360/operator/executive-command/ExecutiveCommandCabinet.tsx',
  css: 'components/angelcare360/operator/executive-command/ExecutiveCommandCabinet.module.css',
  types: 'types/angelcare360/operator/executive-command.ts',
  cssTypes: 'types/angelcare360/operator/executive-command-css.d.ts',
  lib: 'lib/angelcare360/operator/executive-command.ts',
  api: 'app/api/angelcare360/operator/executive-command/route.ts',
  page: 'app/(protected)/angelcare-360-operator/executive/page.tsx',
  sql: 'supabase/migrations/20260801_angelcare360_operator_executive_command_cabinet.sql',
  tsconfig: 'tsconfig.angelcare360-executive-command.json',
}

const source = Object.fromEntries(Object.entries(files).map(([key, rel]) => [key, read(rel)]))

for (const key of ['component', 'types', 'lib', 'api', 'page']) {
  const rel = files[key]
  const kind = rel.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  const parsed = ts.createSourceFile(rel, source[key], ts.ScriptTarget.Latest, true, kind)
  const diagnostics = parsed.parseDiagnostics || []
  assert(diagnostics.length === 0, `TypeScript syntax ${rel}`, diagnostics.map((item) => ts.flattenDiagnosticMessageText(item.messageText, '\n')).join('; '))
}

const sceneMarkers = [
  "key: 'command'",
  "key: 'decisions'",
  "key: 'agenda'",
  "key: 'performance'",
  "key: 'growth'",
  "key: 'risk'",
  "key: 'transformation'",
  "key: 'board'",
]
for (const marker of sceneMarkers) assert(source.component.includes(marker), `executive scene ${marker}`)

const sceneTitles = [
  'Executive Command Center',
  'Authority pipeline',
  'Strategic Agenda Navigator',
  'Performance & Outcomes Nerve Center',
  'Enterprise Growth & Value Steering',
  'Risk, Scenarios & Crisis Room',
  'Transformation & Execution Studio',
  'Board, Committees & Executive Papers',
]
for (const marker of sceneTitles) assert(source.component.includes(marker), `scene identity ${marker}`)

const entityTypes = ['priority', 'decision', 'agenda', 'objective', 'initiative', 'risk', 'board_session', 'paper', 'mandate']
for (const entity of entityTypes) {
  assert(source.types.includes(`'${entity}'`), `entity type ${entity}`)
  assert(source.api.includes(`${entity}: {`), `API entity config ${entity}`)
}

for (const operation of ['entity.create', 'entity.update', 'entity.transition', 'entity.archive', 'decision.mandate']) {
  assert(source.api.includes(`'${operation}'`), `API operation ${operation}`)
}

for (const permission of ['operator.audit.view', 'operator.settings.update']) {
  assert(`${source.lib}\n${source.api}`.includes(permission), `permission ${permission}`)
}

for (const marker of ['createPortal(', 'portalBackdrop', 'inspectorBackdrop', '2147483000', '2147483100']) {
  assert(`${source.component}\n${source.css}`.includes(marker), `overlay architecture ${marker}`)
}

for (const marker of ['href="javascript:', 'TODO_ACTION', 'onClick={() => {}}', 'alert(', 'prompt(', 'confirm(']) {
  assert(!source.component.includes(marker), `dead-control marker absent: ${marker}`)
}

const cssReferences = new Set([...source.component.matchAll(/styles\.([A-Za-z0-9_]+)/g)].map((match) => match[1]))
for (const extra of ['tone_good', 'tone_info', 'tone_warning', 'tone_critical', 'tone_neutral']) cssReferences.add(extra)
for (let index = 1; index <= 6; index += 1) cssReferences.add(`pulseNode${index}`)
for (let index = 0; index <= 3; index += 1) cssReferences.add(`initiativeTile${index}`)
const cssDefinitions = new Set([...source.css.matchAll(/\.([A-Za-z_][A-Za-z0-9_-]*)/g)].map((match) => match[1]))
for (const className of [...cssReferences].sort()) assert(cssDefinitions.has(className), `CSS module resolves: ${className}`)

const impure = []
for (const match of source.css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{/g)) {
  const prelude = match[1].trim()
  if (!prelude || prelude.startsWith('@') || prelude === 'from' || prelude === 'to' || /^\d+%$/.test(prelude)) continue
  for (const selector of prelude.split(',')) {
    const normalized = selector.trim()
    if (!normalized) continue
    if (!/[.#][A-Za-z_]/.test(normalized) && !normalized.includes(':global(')) impure.push(normalized)
  }
}
assert(impure.length === 0, 'CSS Module selector purity', impure.join(', '))

const tables = [
  'angelcare360_operator_executive_priorities',
  'angelcare360_operator_executive_decisions',
  'angelcare360_operator_executive_agenda_streams',
  'angelcare360_operator_executive_objectives',
  'angelcare360_operator_executive_initiatives',
  'angelcare360_operator_executive_risks',
  'angelcare360_operator_executive_board_sessions',
  'angelcare360_operator_executive_papers',
  'angelcare360_operator_executive_mandates',
  'angelcare360_operator_executive_events',
]
for (const table of tables) {
  assert(source.sql.includes(`create table if not exists public.${table}`), `SQL table: ${table}`)
  assert(source.sql.includes(`alter table public.${table} enable row level security`), `RLS: ${table}`)
  assert(source.sql.includes(`revoke all on table public.${table} from public, anon, authenticated`), `direct browser access revoked: ${table}`)
  assert(source.sql.includes(`grant all on table public.${table} to service_role`), `service role grant: ${table}`)
}

assert(/^\s*begin\s*;/i.test(source.sql), 'SQL outer BEGIN')
assert(/commit\s*;\s*$/i.test(source.sql), 'SQL outer COMMIT')
for (const destructive of ['drop table', 'truncate table', 'drop column', 'delete from public.angelcare360_operator_']) {
  assert(!source.sql.toLowerCase().includes(destructive), `SQL destructive marker absent: ${destructive}`)
}

for (const route of ['/angelcare-360-operator/growth', '/angelcare-360-operator/tenants-product', '/angelcare-360-operator/billing', '/angelcare-360-operator/audit', '/angelcare-360-operator']) {
  assert(`${source.component}\n${source.lib}`.includes(route), `authoritative drill-down ${route}`)
}

for (const marker of ['AngelCareLogo', 'DIRECTION GÉNÉRALE', 'Executive Command Cabinet', 'Return to Sovereign Pulse']) {
  assert(source.component.includes(marker), `brand and workspace marker ${marker}`)
}

assert(source.page.includes('ExecutiveCommandCabinet'), 'page route context')
assert(source.tsconfig.includes('executive-command-css.d.ts'), 'targeted tsconfig includes CSS declaration')
assert(source.cssTypes.includes("declare module '*.module.css'"), 'dedicated CSS Module declaration')

if (failures.length) {
  console.error(`\n${failures.length} Executive Command verification failure(s).`)
  failures.forEach((item) => console.error(` - ${item}`))
  process.exit(1)
}

console.log(`\n${checks} checks passed. Direction Générale Executive Command Cabinet is statically accepted.`)
