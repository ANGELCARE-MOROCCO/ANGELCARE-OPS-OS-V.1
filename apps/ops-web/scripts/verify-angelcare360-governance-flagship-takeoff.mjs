import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
let ts
try { ts = require('typescript') } catch { ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js') }

const root = process.cwd()
const required = [
  'app/(protected)/angelcare-360-command-center/administration/page.tsx',
  'app/api/angelcare360/governance/command/route.ts',
  'app/api/angelcare360/governance/entities/[id]/route.ts',
  'components/angelcare360/governance/Angelcare360GovernanceCommand.tsx',
  'components/angelcare360/governance/Angelcare360GovernanceCommand.module.css',
  'components/angelcare360/administration/Angelcare360AdministrationEntityScreen.tsx',
  'data/angelcare360/governance-command.ts',
  'lib/angelcare360/server/governance-command.ts',
  'types/angelcare360/governance-command.ts',
  'supabase/migrations/20260804_angelcare360_governance_institutional_authority_flagship.sql',
]

let checks = 0
function pass(condition, message) {
  checks += 1
  if (!condition) throw new Error(`FAIL: ${message}`)
}

for (const relative of required) pass(fs.existsSync(path.join(root, relative)), `missing ${relative}`)

const componentPath = path.join(root, required[3])
const component = fs.readFileSync(componentPath, 'utf8')
const data = fs.readFileSync(path.join(root, required[6]), 'utf8')
const server = fs.readFileSync(path.join(root, required[7]), 'utf8')
const types = fs.readFileSync(path.join(root, required[8]), 'utf8')
const css = fs.readFileSync(path.join(root, required[4]), 'utf8')
const sql = fs.readFileSync(path.join(root, required[9]), 'utf8')
const page = fs.readFileSync(path.join(root, required[0]), 'utf8')
const deepLinkConsumer = fs.readFileSync(path.join(root, required[5]), 'utf8')

const planes = ['institutions','academic-structure','classes-capacity','subjects','assignments','roles-permissions','settings','audit']
for (const plane of planes) pass(data.includes(`key: '${plane}'`) || types.includes(`'${plane}'`), `plane ${plane} missing`)
pass((data.match(/\['governance\.[^']+'/g) || []).length === 42, 'expected exactly 42 canonical operations')
pass((sql.match(/^create table if not exists public\.angelcare360_governance_/gmi) || []).length === 18, 'expected 18 governance authority tables')
pass((sql.match(/^\s*begin\s*;/gmi) || []).length === 1, 'expected one BEGIN')
pass((sql.match(/^\s*commit\s*;/gmi) || []).length === 1, 'expected one COMMIT')
pass(!/\b(drop\s+table|truncate\s+table|delete\s+from)\b/i.test(sql), 'destructive SQL found')
pass((sql.match(/enable row level security/gi) || []).length === 18, 'all authority tables must enable RLS')
pass((sql.match(/revoke all on table public\.angelcare360_governance_/gi) || []).length === 18, 'all authority tables must revoke browser writes')
pass((sql.match(/^\('governance\./gm) || []).length === 42, 'SQL operation seed mismatch')

for (const marker of [
  'Institutional Governance Sovereign OS',
  'Gouvernance & autorité institutionnelle',
  'Commandes institutionnelles',
  'Activation bloquée',
  'Décision requise',
  'Conflit structurel',
  'Configuration à publier',
  'Governance Command Studio',
  'Institutional Action Chamber',
  'Governance Briefing Authority',
]) pass(component.includes(marker), `visual/interaction marker missing: ${marker}`)

for (const marker of [
  "governance.institution.activate",
  "governance.rollover.execute",
  "governance.capacity.change",
  "governance.population.move",
  "governance.assignment.replace",
  "governance.role.publish",
  "governance.configuration.publish",
  "executeGovernanceMatterAction",
  "generateGovernanceBriefing",
]) pass(server.includes(marker) || component.includes(marker), `runtime marker missing: ${marker}`)

pass(page.includes('getGovernanceCommandSnapshot'), 'main Governance route does not use authoritative snapshot')
pass(page.includes('Angelcare360GovernanceCommand'), 'main Governance route does not render flagship workspace')
pass(deepLinkConsumer.includes("searchParams.get('entity')"), 'exact-record deep link consumer missing')
pass(deepLinkConsumer.includes("setDrawerMode('edit')"), 'exact-record deep link does not open the record drawer')
pass(!component.includes('alert('), 'browser alert found')
pass(!component.includes('setInterval('), 'continuous polling/motion found')
pass(!component.includes('OverheadPanel'), 'Operator shell leakage found')
pass(!component.includes('UUID'), 'raw UUID language found in the customer UI')

const tsFiles = required.filter((file) => /\.tsx?$/.test(file))
let parsed = 0
for (const relative of tsFiles) {
  const file = path.join(root, relative)
  const source = fs.readFileSync(file, 'utf8')
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, relative.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  pass(tree.parseDiagnostics.length === 0, `${relative} has syntax diagnostics`)
  parsed += 1
}

const componentTree = ts.createSourceFile(componentPath, component, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
let nestedButtons = 0
function walk(node, buttonDepth = 0) {
  let nextDepth = buttonDepth
  if (ts.isJsxElement(node)) {
    const tag = node.openingElement.tagName.getText(componentTree)
    if (tag === 'button') {
      if (buttonDepth > 0) nestedButtons += 1
      nextDepth += 1
    }
  }
  ts.forEachChild(node, (child) => walk(child, nextDepth))
}
walk(componentTree)
pass(nestedButtons === 0, `${nestedButtons} nested button(s) found`)

const cssRefs = [...new Set([...component.matchAll(/styles\.([A-Za-z0-9_]+)/g)].map((match) => match[1]))]
const missingCss = cssRefs.filter((name) => !new RegExp(`\\.${name}(?:\\b|[\\s\\[:.#>+~])`).test(css))
pass(missingCss.length === 0, `missing CSS classes: ${missingCss.join(', ')}`)
pass(!/(^|})\s*\[[^\]]+\][^{]*\{/m.test(css), 'naked attribute selector found in CSS Module')
pass(!/(^|})\s*(?:html|body|:root|\*)\s*\{/m.test(css), 'global selector found in CSS Module')

const declaredTables = new Set([...sql.matchAll(/create table if not exists public\.([a-zA-Z0-9_]+)/gi)].map((match) => match[1]))
const serverGovernanceTables = new Set([...server.matchAll(/angelcare360_governance_[a-zA-Z0-9_]+/g)].map((match) => match[0]))
const unresolvedTables = [...serverGovernanceTables].filter((table) => !declaredTables.has(table))
pass(unresolvedTables.length === 0, `unresolved authority tables: ${unresolvedTables.join(', ')}`)

const typeOps = new Set([...types.matchAll(/'((?:governance)\.[^']+)'/g)].map((match) => match[1]))
const dataOps = new Set([...data.matchAll(/\['((?:governance)\.[^']+)'/g)].map((match) => match[1]))
const sqlOps = new Set([...sql.matchAll(/\('((?:governance)\.[^']+)'/g)].map((match) => match[1]))
pass(typeOps.size === 42, `type operation count is ${typeOps.size}, expected 42`)
pass(dataOps.size === 42, `data operation count is ${dataOps.size}, expected 42`)
pass(sqlOps.size === 42, `SQL operation count is ${sqlOps.size}, expected 42`)
pass([...typeOps].every((key) => dataOps.has(key) && sqlOps.has(key)), 'operation registry alignment failed')

console.log('======================================================================')
console.log(' ANGELCARE 360 GOVERNANCE FLAGSHIP VERIFICATION PASSED')
console.log('======================================================================')
console.log(`Checks passed:                       ${checks}`)
console.log(`TS/TSX files parsed:                 ${parsed}`)
console.log(`URL-backed primary planes:          ${planes.length}`)
console.log(`Canonical Governance operations:    ${typeOps.size}`)
console.log(`Protected additive tables:          ${declaredTables.size}`)
console.log('Nested interactive controls:        0')
console.log('CSS Module reference failures:      0')
console.log('Operator shell leakage:             0')
console.log('Destructive SQL statements:         0')
