#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
let ts
try { ts = require('typescript') } catch {
  console.error('FAIL: TypeScript package is required for the Area 0 verifier.')
  process.exit(1)
}

const app = path.resolve(process.argv[2] || process.cwd())
const checks = []
let failed = false
const pass = (label) => { checks.push(['PASS', label]); console.log(`PASS  ${label}`) }
const fail = (label) => { checks.push(['FAIL', label]); failed = true; console.error(`FAIL  ${label}`) }
const exists = (rel) => fs.existsSync(path.join(app, rel))
const read = (rel) => fs.readFileSync(path.join(app, rel), 'utf8')

const files = [
  'types/angelcare360/customer-overlay.ts',
  'components/angelcare360/customer-experience/CustomerOverlayProvider.tsx',
  'components/angelcare360/customer-experience/CustomerOverlaySurface.tsx',
  'components/angelcare360/customer-experience/CustomerOverlaySurface.module.css',
  'components/angelcare360/customer-experience/CustomerOverlayPortal.tsx',
  'components/angelcare360/customer-experience/CustomerExperienceProvider.tsx',
  'components/angelcare360/customer-experience/CustomerExperience.module.css',
  'components/angelcare360/customer-experience/CustomerCommandPalette.tsx',
  'components/angelcare360/customer-experience/CustomerCommandPalette.module.css',
  'components/angelcare360/layout/Angelcare360Shell.tsx',
  'components/angelcare360/layout/Angelcare360CustomerShell.module.css',
  'components/angelcare360/governance/Angelcare360GovernanceCommand.tsx',
  'components/angelcare360/governance/Angelcare360GovernanceCommand.module.css',
  'components/angelcare360/direction/Angelcare360DirectionCommand.tsx',
  'components/angelcare360/direction/Angelcare360DirectionCommand.module.css',
  'components/angelcare360/customer-finance-authority/FinanceAuthorityActionDrawer.tsx',
  'components/angelcare360/customer-finance-authority/FinanceAuthorityWorkspace.module.css',
  'components/angelcare360/customer-academic-authority/AcademicAuthorityActionDrawer.tsx',
  'components/angelcare360/customer-academic-authority/AcademicAuthorityActionDrawer.module.css',
  'components/angelcare360/payroll-sovereign/PayrollSovereignWorkspace.tsx',
  'components/angelcare360/payroll-sovereign/PayrollSovereignWorkspace.module.css',
  'components/angelcare360/payment/Angelcare360PaymentGateOverlay.tsx',
  'components/angelcare360/customer-foundation/FoundationDecisionComposer.tsx',
  'components/angelcare360/customer-foundation/FoundationDecisionComposer.module.css',
]

for (const rel of files) exists(rel) ? pass(`declared file exists · ${rel}`) : fail(`missing declared file · ${rel}`)

const codeFiles = files.filter((rel) => /\.tsx?$/.test(rel))
for (const rel of codeFiles) {
  if (!exists(rel)) continue
  const source = read(rel)
  const parsed = ts.createSourceFile(path.join(app, rel), source, ts.ScriptTarget.Latest, true, rel.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  if (parsed.parseDiagnostics.length) {
    fail(`TypeScript syntax · ${rel}`)
    for (const diagnostic of parsed.parseDiagnostics) console.error(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))
  } else pass(`TypeScript syntax · ${rel}`)
}

function marker(rel, value, label) {
  if (!exists(rel)) return
  read(rel).includes(value) ? pass(label) : fail(label)
}
function absent(rel, pattern, label) {
  if (!exists(rel)) return
  !pattern.test(read(rel)) ? pass(label) : fail(label)
}

const provider = 'components/angelcare360/customer-experience/CustomerOverlayProvider.tsx'
marker(provider, 'angelcare360-customer-overlay-root', 'single sovereign customer overlay root declared')
marker(provider, '--ac-protected-overhead-height', 'dynamic protected-overhead boundary token declared')
marker(provider, 'ResizeObserver', 'overhead ResizeObserver authority present')
marker(provider, 'MutationObserver', 'dynamic shell mutation observation present')
marker(provider, "shell.setAttribute('inert', '')", 'customer background inert behavior present')
marker(provider, "document.body.style.overflow = 'hidden'", 'reference-counted body scroll lock authority present')
marker(provider, "document.addEventListener('keydown', onKeyDown, true)", 'single capture-phase Escape authority present')
marker(provider, 'parentId', 'nested overlay parentage recorded')
marker(provider, 'topId', 'top-of-stack resolver present')
marker(provider, 'orientationchange', 'viewport orientation recalculation present')

const surface = 'components/angelcare360/customer-experience/CustomerOverlaySurface.tsx'
marker(surface, 'data-customer-overlay-surface="true"', 'overlay surfaces expose canonical runtime marker')
marker(surface, 'trapFocus', 'focus trap present')
marker(surface, 'confirmDiscard', 'unsaved-change protection present')
marker(surface, 'role="alertdialog"', 'premium discard confirmation is accessible')
marker(surface, 'data-overlay-autofocus', 'controlled autofocus contract present')
marker(surface, 'aria-hidden={top ? undefined : true}', 'non-top overlay accessibility isolation present')

const portal = 'components/angelcare360/customer-experience/CustomerOverlayPortal.tsx'
marker(portal, 'createPortal', 'body portal mounting present')
marker(portal, 'useCustomerOverlayKernel', 'portal consumes the single overlay kernel')

const shell = 'components/angelcare360/layout/Angelcare360Shell.tsx'
marker(shell, 'data-angelcare360-customer-shell="true"', 'customer shell boundary marker installed')

const mandatoryConsumers = [
  ['components/angelcare360/governance/Angelcare360GovernanceCommand.tsx', 5, 'Governance'],
  ['components/angelcare360/direction/Angelcare360DirectionCommand.tsx', 4, 'Direction'],
  ['components/angelcare360/customer-finance-authority/FinanceAuthorityActionDrawer.tsx', 1, 'Finance'],
  ['components/angelcare360/customer-academic-authority/AcademicAuthorityActionDrawer.tsx', 1, 'Academic'],
  ['components/angelcare360/payroll-sovereign/PayrollSovereignWorkspace.tsx', 1, 'Payroll'],
  ['components/angelcare360/payment/Angelcare360PaymentGateOverlay.tsx', 1, 'Payment gate'],
  ['components/angelcare360/customer-foundation/FoundationDecisionComposer.tsx', 1, 'Customer foundation'],
  ['components/angelcare360/customer-experience/CustomerCommandPalette.tsx', 1, 'Command palette'],
]
for (const [rel, minimum, label] of mandatoryConsumers) {
  if (!exists(rel)) continue
  const count = (read(rel).match(/<CustomerOverlaySurface\b/g) || []).length
  count >= minimum ? pass(`${label} migrated to sovereign surfaces (${count})`) : fail(`${label} sovereign surface migration incomplete (${count}/${minimum})`)
}

const allowedDirectPortal = new Set([
  'components/angelcare360/customer-experience/CustomerOverlayPortal.tsx',
  'components/angelcare360/customer-experience/CustomerOverlaySurface.tsx',
  'components/angelcare360/customer-experience/CustomerExperienceProvider.tsx',
  'components/angelcare360/governance/Angelcare360GovernanceCommand.tsx',
  'components/angelcare360/direction/Angelcare360DirectionCommand.tsx',
  'components/angelcare360/payroll-sovereign/PayrollSovereignWorkspace.tsx',
])
for (const rel of codeFiles) {
  if (!exists(rel) || allowedDirectPortal.has(rel)) continue
  absent(rel, /CustomerOverlayPortal/, `no raw portal bypass · ${rel}`)
}

const overlayCss = [
  'components/angelcare360/customer-experience/CustomerOverlaySurface.module.css',
  'components/angelcare360/customer-experience/CustomerCommandPalette.module.css',
  'components/angelcare360/governance/Angelcare360GovernanceCommand.module.css',
  'components/angelcare360/direction/Angelcare360DirectionCommand.module.css',
  'components/angelcare360/customer-finance-authority/FinanceAuthorityWorkspace.module.css',
  'components/angelcare360/customer-academic-authority/AcademicAuthorityActionDrawer.module.css',
  'components/angelcare360/payroll-sovereign/PayrollSovereignWorkspace.module.css',
  'components/angelcare360/customer-foundation/FoundationDecisionComposer.module.css',
]
for (const rel of overlayCss) {
  if (!exists(rel)) continue
  absent(rel, /position\s*:\s*fixed/i, `no workspace-local fixed overlay · ${rel}`)
  absent(rel, /z-index\s*:\s*(?:1[0-9]{2,}|[2-9][0-9]{2,}|214748)/i, `no arbitrary high overlay z-index · ${rel}`)
}

const providerSource = exists(provider) ? read(provider) : ''
if ((providerSource.match(/document\.addEventListener\('keydown'/g) || []).length === 1) pass('exactly one stack-level Escape listener')
else fail('Escape listener count is not exactly one')
if ((providerSource.match(/document\.body\.style\.overflow\s*=\s*'hidden'/g) || []).length === 1) pass('exactly one body-lock authority')
else fail('body-lock authority count is not exactly one')

const surfaceCss = 'components/angelcare360/customer-experience/CustomerOverlaySurface.module.css'
marker(surfaceCss, '[data-kind="quick-peek"]', 'quick-peek layer token implemented')
marker(surfaceCss, '[data-kind="dossier"]', 'dossier layer token implemented')
marker(surfaceCss, '[data-kind="focus-command"]', 'focus-command layer token implemented')
marker(surfaceCss, '[data-kind="nested-command"]', 'nested-command layer token implemented')
marker(surfaceCss, '[data-kind="evidence"]', 'evidence layer token implemented')
marker(surfaceCss, '[data-kind="confirmation"]', 'confirmation layer token implemented')
marker(surfaceCss, '[data-kind="palette"]', 'command-palette layer token implemented')
marker(surfaceCss, 'prefers-reduced-motion', 'reduced-motion overlay mode implemented')

// Direct @/ import resolution for every declared TS/TSX file.
function resolvesAlias(specifier) {
  const base = path.join(app, specifier.slice(2))
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.jsx`, `${base}.css`, `${base}.module.css`, path.join(base, 'index.ts'), path.join(base, 'index.tsx')]
  return candidates.some((candidate) => fs.existsSync(candidate))
}
for (const rel of codeFiles) {
  if (!exists(rel)) continue
  const source = read(rel)
  const imports = [...source.matchAll(/from\s+['"](@\/[^'"]+)['"]/g)].map((match) => match[1])
  const missing = imports.filter((specifier) => !resolvesAlias(specifier))
  missing.length ? fail(`unresolved direct imports · ${rel} · ${missing.join(', ')}`) : pass(`direct imports resolve · ${rel}`)
}

// CSS module reference gate for direct styles.foo references.
const pairs = [
  ['components/angelcare360/customer-experience/CustomerOverlaySurface.tsx','components/angelcare360/customer-experience/CustomerOverlaySurface.module.css'],
  ['components/angelcare360/customer-experience/CustomerCommandPalette.tsx','components/angelcare360/customer-experience/CustomerCommandPalette.module.css'],
  ['components/angelcare360/governance/Angelcare360GovernanceCommand.tsx','components/angelcare360/governance/Angelcare360GovernanceCommand.module.css'],
  ['components/angelcare360/direction/Angelcare360DirectionCommand.tsx','components/angelcare360/direction/Angelcare360DirectionCommand.module.css'],
  ['components/angelcare360/customer-finance-authority/FinanceAuthorityActionDrawer.tsx','components/angelcare360/customer-finance-authority/FinanceAuthorityWorkspace.module.css'],
  ['components/angelcare360/customer-academic-authority/AcademicAuthorityActionDrawer.tsx','components/angelcare360/customer-academic-authority/AcademicAuthorityActionDrawer.module.css'],
  ['components/angelcare360/payroll-sovereign/PayrollSovereignWorkspace.tsx','components/angelcare360/payroll-sovereign/PayrollSovereignWorkspace.module.css'],
  ['components/angelcare360/customer-foundation/FoundationDecisionComposer.tsx','components/angelcare360/customer-foundation/FoundationDecisionComposer.module.css'],
]
for (const [tsx, css] of pairs) {
  if (!exists(tsx) || !exists(css)) continue
  const refs = new Set([...read(tsx).matchAll(/styles\.([A-Za-z_][A-Za-z0-9_]*)/g)].map((match) => match[1]))
  const definitions = new Set([...read(css).matchAll(/\.([A-Za-z_][A-Za-z0-9_-]*)/g)].map((match) => match[1]))
  const missing = [...refs].filter((name) => !definitions.has(name))
  missing.length ? fail(`CSS references resolve · ${tsx} · missing ${missing.join(', ')}`) : pass(`CSS references resolve · ${tsx}`)
}

// No SQL is part of Area 0.
const sql = []
function walk(directory) {
  if (!fs.existsSync(directory)) return
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (entry.name.endsWith('.sql') && full.includes('area0')) sql.push(full)
  }
}
walk(path.join(app, 'scripts'))
sql.length === 0 ? pass('Area 0 introduces no SQL migration') : fail('Area 0 unexpectedly introduces SQL')

console.log('\n======================================================================')
console.log(' ANGELCARE 360 — AREA 0 TARGETED VERIFICATION')
console.log('======================================================================')
console.log(`Checks: ${checks.length}`)
console.log(`Passed: ${checks.filter(([state]) => state === 'PASS').length}`)
console.log(`Failed: ${checks.filter(([state]) => state === 'FAIL').length}`)
console.log('Production build executed: NO')
console.log('Repository-wide TypeScript invoked: NO')
console.log('SQL executed: NO')

if (failed) process.exit(1)
console.log('\nAREA 0 SANILA CUSTOMER SOVEREIGN OVERLAY LAYER ACCEPTED')
