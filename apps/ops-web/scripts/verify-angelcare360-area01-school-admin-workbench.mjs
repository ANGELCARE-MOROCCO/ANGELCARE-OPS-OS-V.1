#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
let ts
try { ts = require('typescript') } catch {
  console.error('FAIL: TypeScript is required for the Area 0.1 verifier.')
  process.exit(1)
}

const app = path.resolve(process.argv[2] || process.cwd())
const checks = []
let failed = false
const pass = (label) => { checks.push(['PASS', label]); console.log(`PASS  ${label}`) }
const fail = (label) => { checks.push(['FAIL', label]); failed = true; console.error(`FAIL  ${label}`) }
const abs = (rel) => path.join(app, rel)
const exists = (rel) => fs.existsSync(abs(rel))
const read = (rel) => fs.readFileSync(abs(rel), 'utf8')

const changedFiles = [
  'types/angelcare360/school-admin-workbench.ts',
  'data/angelcare360/customer-language.ts',
  'components/angelcare360/customer-experience/SchoolAdminWorkbench.tsx',
  'components/angelcare360/customer-experience/SchoolAdminWorkbench.module.css',
  'components/angelcare360/customer-experience/CustomerOverlaySurface.tsx',
  'components/angelcare360/customer-experience/CustomerCommandPalette.tsx',
  'components/angelcare360/governance/Angelcare360GovernanceCommand.tsx',
  'components/angelcare360/governance/Angelcare360GovernanceCommand.module.css',
  'components/angelcare360/direction/Angelcare360DirectionCommand.tsx',
  'components/angelcare360/customer-finance-authority/FinanceAuthorityActionDrawer.tsx',
  'components/angelcare360/customer-academic-authority/AcademicAuthorityActionDrawer.tsx',
  'components/angelcare360/payroll-sovereign/PayrollSovereignWorkspace.tsx',
  'components/angelcare360/payment/Angelcare360PaymentGateOverlay.tsx',
  'components/angelcare360/customer-foundation/FoundationDecisionComposer.tsx',
  'scripts/verify-angelcare360-area01-school-admin-workbench.mjs',
]

for (const rel of changedFiles) exists(rel) ? pass(`declared file exists · ${rel}`) : fail(`missing declared file · ${rel}`)

const codeFiles = changedFiles.filter((rel) => /\.(?:ts|tsx)$/.test(rel))
for (const rel of codeFiles) {
  if (!exists(rel)) continue
  const parsed = ts.createSourceFile(abs(rel), read(rel), ts.ScriptTarget.Latest, true, rel.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
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

const language = 'data/angelcare360/customer-language.ts'
marker(language, "Nouveau", 'human school status registry present')
marker(language, "À compléter", 'incomplete-state wording present')
marker(language, "Validation de la direction nécessaire", 'permission-to-workflow wording present')
marker(language, "Ouvrir l’établissement dans le système", 'institution opening action is explicit')
marker(language, "Passage à l’année suivante", 'rollover is humanized')
marker(language, "Modifier la capacité de la classe", 'capacity action is explicit')
marker(language, "Demander le document manquant", 'evidence action is expressed as a school task')

const workbench = 'components/angelcare360/customer-experience/SchoolAdminWorkbench.tsx'
for (const [value, label] of [
  ['Pourquoi ce dossier apparaît ici ?', 'why-this-is-visible pattern'],
  ['Conséquence actuelle', 'current consequence pattern'],
  ['Prochaine étape recommandée', 'next-best-action pattern'],
  ['Ce qui va changer', 'impact preview pattern'],
  ['Responsable', 'responsibility strip'],
  ['Validation de la direction nécessaire', 'permission request pattern'],
  ['Cette action n’a pas pu être terminée', 'human error pattern'],
]) marker(workbench, value, label)

const surface = 'components/angelcare360/customer-experience/CustomerOverlaySurface.tsx'
marker(surface, 'Fermer sans enregistrer ?', 'human unsaved-change title')
marker(surface, 'Revenir au dossier', 'safe return action')
marker(surface, 'Fermer et perdre mes modifications', 'explicit discard consequence')
marker(surface, 'CustomerOverlayPortal', 'Area 0 sovereign portal preserved')
marker(surface, 'useCustomerOverlayKernel', 'Area 0 stack kernel preserved')

const palette = 'components/angelcare360/customer-experience/CustomerCommandPalette.tsx'
marker(palette, 'Trouver un enfant, une classe, une inscription, un paiement…', 'school-language command search')
marker(palette, 'Aucun résultat correspondant', 'human command empty state')
marker(palette, 'humanizeTechnicalLabel', 'technical keys are humanized')

const governance = 'components/angelcare360/governance/Angelcare360GovernanceCommand.tsx'
for (const [value, label] of [
  ['Ce qu’il faut savoir', 'Governance situation tab'],
  ['À faire', 'Governance action tab'],
  ['Dossier complet', 'Governance full dossier tab'],
  ['SchoolAdminNextAction', 'Governance next action guidance'],
  ['SchoolAdminAssignmentPanel', 'Governance responsibility context'],
  ['SchoolAdminSituationSummary', 'Governance situation explanation'],
  ['schoolStatusLabel', 'Governance statuses humanized'],
  ['governanceOperationLabel', 'Governance operations humanized'],
  ['Préparer le passage à l’année suivante', 'Governance rollover wording humanized'],
]) marker(governance, value, label)

const direction = 'components/angelcare360/direction/Angelcare360DirectionCommand.tsx'
for (const [value, label] of [
  ["'Ce qu’il faut savoir'", 'Direction situation tab'],
  ["'Conséquences'", 'Direction consequence tab'],
  ["'Dossiers concernés'", 'Direction linked dossiers tab'],
  ['SchoolAdminNextAction', 'Direction next action guidance'],
  ['SchoolAdminBreadcrumb', 'Direction orientation breadcrumb'],
  ['La page a été mise à jour.', 'Direction refresh result humanized'],
  ['Rechercher un dossier, une famille, une facture ou une décision…', 'Direction search humanized'],
]) marker(direction, value, label)

const finance = 'components/angelcare360/customer-finance-authority/FinanceAuthorityActionDrawer.tsx'
marker(finance, 'SchoolAdminSituationSummary', 'Finance guided situation')
marker(finance, 'SchoolAdminImpactPreview', 'Finance impact preview')
marker(finance, 'SchoolAdminErrorState', 'Finance human error state')
marker(finance, 'Pourquoi cette action est-elle nécessaire ?', 'Finance guided reason')

const academic = 'components/angelcare360/customer-academic-authority/AcademicAuthorityActionDrawer.tsx'
marker(academic, 'SchoolAdminSituationSummary', 'Academic guided situation')
marker(academic, 'SchoolAdminImpactPreview', 'Academic impact preview')
marker(academic, 'SchoolAdminErrorState', 'Academic human error state')

const payroll = 'components/angelcare360/payroll-sovereign/PayrollSovereignWorkspace.tsx'
marker(payroll, 'Dossiers prêts pour la paie', 'Payroll readiness expressed in user language')
marker(payroll, 'ÉLÉMENTS À VÉRIFIER', 'Payroll warnings humanized')
marker(payroll, 'SchoolAdminImpactPreview', 'Payroll action impact preview')
marker(payroll, 'payrollOperationLabel', 'Payroll operation names humanized')

const payment = 'components/angelcare360/payment/Angelcare360PaymentGateOverlay.tsx'
marker(payment, 'SchoolAdminSituationSummary', 'Payment gate explains the situation')
marker(payment, 'SchoolAdminImpactPreview', 'Payment gate explains consequences')
marker(payment, 'Dh', 'Customer currency wording preserved')

const foundation = 'components/angelcare360/customer-foundation/FoundationDecisionComposer.tsx'
marker(foundation, 'Ajouter une décision', 'Decision composer uses familiar wording')
marker(foundation, 'Elle apparaît maintenant dans les éléments à traiter par la direction.', 'Decision success explains result')
marker(foundation, 'SchoolAdminImpactPreview', 'Decision impact preview')

const visibleConsumers = [governance, direction, finance, academic, payroll, payment, foundation, palette, surface]
const forbiddenVisible = [
  /EXECUTIVE COMMAND STUDIO/,
  /COMMAND CHAMBER/,
  /Governance Command Studio/,
  /Institutional Action Chamber/,
  /Exécuter l’autorité/,
  /Confirmer et exécuter/,
  /Dossier autoritatif/,
  /Rollover authority/,
  /Aucun changeset/,
  /École-owned/,
  /Derived runtime/,
  /Rechercher un matter/,
]
for (const rel of visibleConsumers) for (const pattern of forbiddenVisible) absent(rel, pattern, `forbidden customer jargon absent · ${rel} · ${pattern}`)

// Preserve Area 0: every migrated consumer must still use CustomerOverlaySurface.
for (const rel of [governance, direction, finance, academic, payroll, payment, foundation, palette]) marker(rel, 'CustomerOverlaySurface', `Area 0 overlay consumer preserved · ${rel}`)

// Direct @/ import resolution.
function resolvesAlias(specifier) {
  const base = path.join(app, specifier.slice(2))
  return [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.jsx`, `${base}.css`, `${base}.module.css`, path.join(base, 'index.ts'), path.join(base, 'index.tsx')].some((candidate) => fs.existsSync(candidate))
}
for (const rel of codeFiles) {
  if (!exists(rel)) continue
  const imports = [...read(rel).matchAll(/from\s+['"](@\/[^'"]+)['"]/g)].map((match) => match[1])
  const missing = imports.filter((specifier) => !resolvesAlias(specifier))
  missing.length ? fail(`unresolved direct imports · ${rel} · ${missing.join(', ')}`) : pass(`direct imports resolve · ${rel}`)
}

// CSS module reference gate.
const cssPairs = [
  [workbench, 'components/angelcare360/customer-experience/SchoolAdminWorkbench.module.css'],
  [governance, 'components/angelcare360/governance/Angelcare360GovernanceCommand.module.css'],
  [finance, 'components/angelcare360/customer-finance-authority/FinanceAuthorityWorkspace.module.css'],
  [academic, 'components/angelcare360/customer-academic-authority/AcademicAuthorityActionDrawer.module.css'],
  [payroll, 'components/angelcare360/payroll-sovereign/PayrollSovereignWorkspace.module.css'],
  [foundation, 'components/angelcare360/customer-foundation/FoundationDecisionComposer.module.css'],
]
for (const [tsx, css] of cssPairs) {
  if (!exists(tsx) || !exists(css)) continue
  const refs = new Set([...read(tsx).matchAll(/styles\.([A-Za-z_][A-Za-z0-9_]*)/g)].map((match) => match[1]))
  const defs = new Set([...read(css).matchAll(/\.([A-Za-z_][A-Za-z0-9_-]*)/g)].map((match) => match[1]))
  const missing = [...refs].filter((name) => !defs.has(name))
  missing.length ? fail(`CSS references resolve · ${tsx} · missing ${missing.join(', ')}`) : pass(`CSS references resolve · ${tsx}`)
}

// Area 0.1 is frontend-only.
const sqlMarker = changedFiles.some((rel) => rel.endsWith('.sql'))
sqlMarker ? fail('Area 0.1 unexpectedly declares SQL') : pass('Area 0.1 declares no SQL migration')

console.log('\n======================================================================')
console.log(' ANGELCARE 360 — AREA 0.1 SCHOOL ADMIN WORKBENCH VERIFICATION')
console.log('======================================================================')
console.log(`Checks: ${checks.length}`)
console.log(`Passed: ${checks.filter(([state]) => state === 'PASS').length}`)
console.log(`Failed: ${checks.filter(([state]) => state === 'FAIL').length}`)
console.log('Production build executed: NO')
console.log('Repository-wide TypeScript invoked: NO')
console.log('SQL executed: NO')

if (failed) process.exit(1)
console.log('\nAREA 0.1 SANILA SCHOOL ADMIN WORKBENCH ACCEPTED')
