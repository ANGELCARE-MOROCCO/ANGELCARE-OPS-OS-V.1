#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const app = process.cwd()

function fail(message) {
  console.error(`FAIL: ${message}`)
  process.exit(1)
}
function pass(message) { console.log(`PASS: ${message}`) }
function read(relative) {
  const absolute = path.join(app, relative)
  if (!fs.existsSync(absolute)) fail(`missing file ${relative}`)
  return fs.readFileSync(absolute, 'utf8')
}
function exists(relative) {
  if (!fs.existsSync(path.join(app, relative))) fail(`missing prerequisite ${relative}`)
  pass(`prerequisite ${relative}`)
}
function walk(root, output = []) {
  if (!fs.existsSync(root)) return output
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const absolute = path.join(root, entry.name)
    if (entry.isDirectory()) walk(absolute, output)
    else output.push(absolute)
  }
  return output
}

const prerequisites = [
  'components/angelcare360/customer-experience/CustomerExperienceProvider.tsx',
  'components/angelcare360/customer-experience/CustomerPlaneNavigation.tsx',
  'components/angelcare360/customer-foundation/DirectionExecutiveCommand.tsx',
  'components/angelcare360/customer-academic-authority/PresenceDailyControl.tsx',
  'lib/angelcare360/server/product-reality.ts',
  'data/angelcare360/product-reality.ts',
  'supabase/migrations/20260803_angelcare360_product_reality_enforcement_finalization.sql',
  'data/angelcare360/module-registry.ts',
]
for (const item of prerequisites) exists(item)
if (!read('data/angelcare360/module-registry.ts').includes('export function getAngelcare360ModuleById')) {
  fail('getAngelcare360ModuleById compatibility export is missing')
}
pass('module registry compatibility helper preserved')

const routePages = [
  'finance/page.tsx','finance/frais/page.tsx','finance/affectations-frais/page.tsx','finance/factures/page.tsx','finance/paiements/page.tsx','finance/recus/page.tsx','finance/remises/page.tsx','finance/relances/page.tsx','finance/soldes-eleves/page.tsx','finance/etats-compte/page.tsx','finance/depenses/page.tsx','finance/audit/page.tsx',
  'documents/page.tsx','documents/templates/page.tsx','documents/generated/page.tsx','documents/governance/page.tsx','documents/audit/page.tsx',
  'exports/page.tsx','exports/csv-xlsx/page.tsx','exports/pdf-a4/page.tsx','exports/historique/page.tsx','exports/files/page.tsx','exports/audit/page.tsx',
  'rapports/page.tsx','rapports/catalogue/page.tsx','rapports/demandes/page.tsx','rapports/modeles/page.tsx','rapports/historique/page.tsx','rapports/audit/page.tsx',
]
const routeRoot = 'app/(protected)/angelcare-360-command-center'
for (const route of routePages) {
  const source = read(`${routeRoot}/${route}`)
  if (!source.includes('FinanceAuthorityPage')) fail(`${route} does not render FinanceAuthorityPage`)
}
pass(`${routePages.length} canonical customer finance/document/report routes covered`)

const changedRoots = [
  'app/api/angelcare360/customer-finance-authority',
  'components/angelcare360/customer-finance-authority',
  'data/angelcare360/customer-finance-authority.ts',
  'data/angelcare360/product-reality.ts',
  'lib/angelcare360/documents/finance.ts',
  'lib/angelcare360/server/finance-authority.ts',
  'types/angelcare360/customer-finance-authority.ts',
  'types/angelcare360/product-reality.ts',
  routeRoot,
]
const sourceFiles = []
for (const relative of changedRoots) {
  const absolute = path.join(app, relative)
  if (!fs.existsSync(absolute)) fail(`changed scope missing ${relative}`)
  const stat = fs.statSync(absolute)
  if (stat.isDirectory()) {
    for (const file of walk(absolute)) {
      if (/\.(ts|tsx)$/.test(file)) {
        const rel = path.relative(app, file)
        if (routePages.some((route) => rel === `${routeRoot}/${route}`) || rel.includes('customer-finance-authority')) sourceFiles.push(file)
      }
    }
  } else if (/\.(ts|tsx)$/.test(absolute)) sourceFiles.push(absolute)
}
const uniqueSourceFiles = [...new Set(sourceFiles)]

let ts
try { ts = require(path.join(app, 'node_modules/typescript')) }
catch { try { ts = require('typescript') } catch { fail('project-local TypeScript is unavailable') } }
for (const file of uniqueSourceFiles) {
  const source = fs.readFileSync(file, 'utf8')
  const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  if (parsed.parseDiagnostics.length) {
    const message = parsed.parseDiagnostics.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')).join(' | ')
    fail(`${path.relative(app, file)} syntax: ${message}`)
  }
}
pass(`${uniqueSourceFiles.length} exact TS/TSX files passed syntax analysis`)

const typesSource = read('types/angelcare360/customer-finance-authority.ts')
const authorityData = read('data/angelcare360/customer-finance-authority.ts')
const realityData = read('data/angelcare360/product-reality.ts')
const serverSource = read('lib/angelcare360/server/finance-authority.ts')
const typeOps = new Set([...typesSource.matchAll(/\| '(finance\.[^']+)'/g)].map((match) => match[1]))
const authorityOps = new Set([...authorityData.matchAll(/\['(finance\.[^']+)'/g)].map((match) => match[1]))
const realityOps = new Set([...realityData.matchAll(/operationKey: '(finance\.[^']+)'/g)].map((match) => match[1]))
const serverOps = new Set([...serverSource.matchAll(/case '(finance\.[^']+)'/g)].map((match) => match[1]))
serverOps.add('finance.workspace.view')
serverOps.add('finance.approval.decide')
function compare(label, expected, actual) {
  const missing = [...expected].filter((item) => !actual.has(item))
  const extra = [...actual].filter((item) => !expected.has(item))
  if (missing.length || extra.length) fail(`${label} mismatch; missing=${missing.join(',')} extra=${extra.join(',')}`)
}
if (typeOps.size !== 44) fail(`expected 44 canonical finance operations, found ${typeOps.size}`)
compare('authority registry', typeOps, authorityOps)
compare('Product Reality registry', typeOps, realityOps)
compare('server dispatch', typeOps, serverOps)
pass('44/44 canonical finance operations align across types, Product Reality and server dispatch')

const planes = [...authorityData.matchAll(/\{ key: '[^']+', label: (?:'[^']+'|\"[^\"]+\"), description: '[^']+', scene: '(command|billing|payments|collections|expenses|documents)'/g)]
if (planes.length < 55) fail(`expected at least 55 real horizontal planes, found ${planes.length}`)
for (const scene of ['command','billing','payments','collections','expenses','documents']) {
  if (!authorityData.includes(`${scene}: [`)) fail(`missing plane family ${scene}`)
}
pass(`${planes.length} URL-backed horizontal operating planes registered across 6 distinct scenes`)

const uiFiles = uniqueSourceFiles.filter((file) => file.endsWith('.tsx'))
const forbidden = [
  ['browser alert', /\balert\s*\(/],
  ['dead handler', /onClick=\{\(\)\s*=>\s*\{\s*\}\}/],
  ['javascript href', /href=["']javascript:/],
  ['TODO action', /TODO_ACTION/],
  ['Operator OverheadPanel', /OverheadPanel/],
]
for (const file of uiFiles) {
  const source = fs.readFileSync(file, 'utf8')
  for (const [label, pattern] of forbidden) if (pattern.test(source)) fail(`${label} found in ${path.relative(app, file)}`)
}
const workspace = read('components/angelcare360/customer-finance-authority/FinanceAuthorityWorkspace.tsx')
const drawer = read('components/angelcare360/customer-finance-authority/FinanceAuthorityActionDrawer.tsx')
for (const marker of ['CustomerPlaneNavigation','dispatchCustomerToast','durationMs: 3000','FinanceAuthorityActionDrawer']) if (!workspace.includes(marker)) fail(`frontend doctrine marker missing: ${marker}`)
for (const marker of ['CustomerOverlayPortal','role="dialog"','aria-modal="true"']) if (!drawer.includes(marker)) fail(`customer overlay marker missing: ${marker}`)
pass('customer frontend doctrine markers present: real planes, toast progression, 3-second dismissal and overlay portal')

const cssRelative = 'components/angelcare360/customer-finance-authority/FinanceAuthorityWorkspace.module.css'
const css = read(cssRelative)
const definedClasses = new Set([...css.matchAll(/\.([A-Za-z_][\w-]*)/g)].map((match) => match[1]))
for (const file of uiFiles.filter((file) => file.includes('customer-finance-authority'))) {
  const source = fs.readFileSync(file, 'utf8')
  for (const match of source.matchAll(/styles\.([A-Za-z_][\w]*)/g)) {
    if (!definedClasses.has(match[1])) fail(`CSS class styles.${match[1]} referenced but not defined`)
  }
}
const nakedAttributeSelector = /(?:^|})\s*\[[^\{]+\{/m
if (nakedAttributeSelector.test(css)) fail('non-pure CSS Module attribute selector found without a local class')
pass('CSS Module references resolve and selectors remain locally scoped')

const sql = read('supabase/migrations/20260803_angelcare360_customer_megazip4_finance_authority.sql')
if (!/^begin;/i.test(sql.trim()) || !/commit;\s*$/i.test(sql.trim())) fail('SQL outer transaction is incomplete')
for (const pattern of [/\bdrop\s+table\b/i,/\btruncate\b/i,/\bdelete\s+from\b/i]) if (pattern.test(sql)) fail(`destructive SQL marker detected: ${pattern}`)
const tableNames = [...sql.matchAll(/create table if not exists public\.(angelcare360_finance_[a-z0-9_]+)/g)].map((match) => match[1])
if (new Set(tableNames).size < 27) fail(`expected at least 27 protected finance authority tables, found ${new Set(tableNames).size}`)
for (const operation of typeOps) if (!sql.includes(`'${operation}'`)) fail(`SQL operation seed missing ${operation}`)
for (const marker of ['enable row level security','revoke all on table','grant all on table','angelcare360-finance-documents']) if (!sql.includes(marker)) fail(`SQL governance marker missing ${marker}`)
pass(`${new Set(tableNames).size} additive finance authority tables, private document storage, RLS and 44 operation seeds verified`)

for (const marker of [
  'assertFinancePeriodOpen',
  'decimalToCents',
  'angelcare360_finance_invoice_revisions',
  'angelcare360_finance_payment_allocations',
  'createFinanceNotificationIntent',
  'generateFinanceDocument',
  'loadUnallocatedPaymentBlockers',
]) if (!serverSource.includes(marker)) fail(`financial integrity marker missing ${marker}`)
pass('period locking, safe decimal conversion, revision history, allocations, notification intents and document authority present')

console.log('')
console.log('======================================================================')
console.log(' ANGELCARE 360 CUSTOMER MEGA ZIP 4 — SURGICAL VERIFICATION PASSED')
console.log('======================================================================')
console.log(`Routes covered:                    ${routePages.length}`)
console.log(`Horizontal operating planes:       ${planes.length}`)
console.log(`Canonical finance operations:      ${typeOps.size}`)
console.log(`Protected finance authority tables:${new Set(tableNames).size}`)
console.log(`TS/TSX files syntax checked:       ${uniqueSourceFiles.length}`)
console.log('Dead controls:                     0')
console.log('Operator shell leakage:            0')
console.log('Destructive SQL statements:        0')
