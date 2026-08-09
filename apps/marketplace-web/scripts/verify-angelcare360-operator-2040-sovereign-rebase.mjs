#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
let passed = 0
let failed = 0
const failures = []
function check(condition, label) {
  if (condition) { passed += 1; console.log(`PASS  ${label}`) }
  else { failed += 1; failures.push(label); console.error(`FAIL  ${label}`) }
}
function read(relative) {
  const file = path.join(root, relative)
  check(fs.existsSync(file), `exists: ${relative}`)
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
}

const sixRoutes = ['direction','growth','tenants-product','revenue','service','platform']
for (const route of sixRoutes) read(`app/(protected)/angelcare-360-operator/${route}/page.tsx`)
const navigation = read('data/angelcare360/operator-sovereign-navigation.ts')
for (const key of ['direction','growth','tenants','revenue','service','platform']) check(navigation.includes(`key: '${key}'`), `six-tower definition: ${key}`)
check((navigation.match(/key: '(direction|growth|tenants|revenue|service|platform)'/g) || []).length === 6, 'exactly six sovereign master definitions')
check(navigation.includes('ANGELCARE360_OPERATOR_NAVIGATION'), 'legacy navigation exports the six-master contract')

const sidebar = read('components/angelcare360/operator/Angelcare360OperatorSidebar.tsx')
check(sidebar.includes('resolveSovereignTower') && sidebar.includes('sections.flatMap'), 'sidebar renders the six sovereign master items')
check(!sidebar.includes('section.items.map'), 'sidebar no longer renders deep entity trees')
const rail = read('components/angelcare360/operator/sovereign/SovereignWorkspaceRail.tsx')
check(rail.includes('tower.navigation.map'), 'persistent in-page horizontal navigation exists')
const shell = read('components/angelcare360/operator/Angelcare360OperatorShell.tsx')
check(shell.includes('<SovereignWorkspaceRail'), 'shell integrates horizontal tower rail')

const portal = read('components/angelcare360/operator/sovereign/SovereignPortal.tsx')
for (const signal of ['createPortal(portal, document.body)', "document.body.style.overflow = 'hidden'", "event.key === 'Escape'", "role=\"dialog\"", 'confirmClose', 'portalFooter']) check(portal.includes(signal), `viewport portal capability: ${signal}`)
const drawer = read('components/angelcare360/operator/Angelcare360OperatorDrawer.tsx')
check(drawer.includes('<SovereignPortal'), 'all legacy drawers use the viewport portal')
check(!drawer.includes('drawerBackdrop'), 'legacy inline drawer implementation removed')

const actionDeck = read('components/angelcare360/operator/sovereign/SovereignActionDeck.tsx')
const operations = [
  "operation:'create'", "operation:'update'", "operation:'archive'", "operation:'status'", "operation:'cancel'",
  "operation:'issue'", "operation:'record'", "operation:'confirm'", "operation:'reject'", "operation:'complete'",
  "operation:'resolve'", "operation:'assign'", "operation:'retire'", "operation:'link'",
]
for (const op of operations) check(actionDeck.includes(op), `CRUD/lifecycle command present: ${op}`)
for (const domain of ['clients','tenants','plans','packages','subscriptions','billing','contracts','renewals','onboarding','support','service','features']) check(actionDeck.includes(`/api/angelcare360/operator/${domain}`), `real Operator API wired: ${domain}`)
check(actionDeck.includes('lockedReason'), 'unsupported capabilities are truthful locked states')

const types = read('components/angelcare360/operator/sovereign/SovereignTypes.ts')
for (const kind of ['client','tenant','plan','package','subscription','billing-account','invoice','payment','dunning','contract','renewal','ticket','service-request','incident','onboarding','task','note','feature','limit','audit']) check(types.includes(`'${kind}'`), `operational graph entity: ${kind}`)
const data = read('lib/angelcare360/operator/sovereign/data.ts')
for (const source of ['listOperatorClients','listOperatorTenants','listOperatorPlans','listOperatorPackages','listOperatorSubscriptions','listOperatorBillingAccounts','listOperatorInvoices','listOperatorPayments','listOperatorDunningActions','listOperatorContracts','listOperatorRenewals','listOperatorSupportTickets','listOperatorServiceRequests','listOperatorIncidents','listOperatorOnboardingTasks','listOperatorTasks','listOperatorNotes','listOperatorFeatureFlags','listOperatorUsageLimits','listOperatorAuditLogs']) check(data.includes(source), `live source loaded independently: ${source}`)
check(data.includes("state: 'unavailable'"), 'failed sources are marked unavailable')
check(data.includes("sourceState = unavailable === 0 ? 'complete'"), 'workspace distinguishes complete/partial/unavailable')

const entityPortal = read('components/angelcare360/operator/sovereign/SovereignEntityPortal.tsx')
check(entityPortal.includes('normalizeEntityPayload'), 'entity mutations normalize typed payloads')
check(entityPortal.includes('Identifiant technique masqué'), 'raw identifiers are intentionally hidden')
check(entityPortal.includes('dirty='), 'unsaved change protection is connected')

const dataTable = read('components/angelcare360/operator/Angelcare360OperatorDataTable.tsx')
check(!/^['\"]use client['\"]/m.test(dataTable), 'server DataTable does not become a Client Component')
check(dataTable.includes('Angelcare360OperatorDataTableClient'), 'interactive table receives server-prepared rows')
const dataTableClient = read('components/angelcare360/operator/Angelcare360OperatorDataTableClient.tsx')
check(/^['\"]use client['\"]/m.test(dataTableClient), 'interactive table client boundary is explicit')

const sourceFiles = [
  ...walk(path.join(root,'components/angelcare360/operator/sovereign')),
  path.join(root,'data/angelcare360/operator-sovereign-navigation.ts'),
  path.join(root,'lib/angelcare360/operator/sovereign/data.ts'),
].filter((file) => /\.(ts|tsx)$/.test(file))
const uuidPattern = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/ig
let rawUuidCount = 0
for (const file of sourceFiles) rawUuidCount += (fs.readFileSync(file,'utf8').match(uuidPattern) || []).length
check(rawUuidCount === 0, 'no raw UUID literal in sovereign UI sources')

console.log(`\n${passed} checks passed; ${failed} failed.`)
if (failed) { console.error(failures.join('\n')); process.exit(1) }
function walk(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap((entry) => entry.isDirectory() ? walk(path.join(dir,entry.name)) : [path.join(dir,entry.name)])
}
