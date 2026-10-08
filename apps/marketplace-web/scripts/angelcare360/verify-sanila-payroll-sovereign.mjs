#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const app = path.resolve(process.argv[2] || process.cwd())
let pass = 0, fail = 0
const check = (name, ok) => { console.log(`${ok ? 'PASS' : 'FAIL'} — ${name}`); ok ? pass++ : fail++ }
const exists = rel => fs.existsSync(path.join(app, rel))
const read = rel => exists(rel) ? fs.readFileSync(path.join(app, rel), 'utf8') : ''
const base = 'app/(protected)/angelcare-360-command-center/paie'

const routeChecks = [
  ['root','page.tsx','Dashboard'], ['layout','layout.tsx',''], ['utils','_utils.ts','getPayrollSovereignSnapshot'],
  ['loading','loading.tsx',''], ['error','error.tsx',"'use client'"], ['not-found','not-found.tsx',''],
  ['periods','periodes/page.tsx','Periods'], ['period dossier','periodes/[id]/page.tsx','PeriodDetail'],
  ['payroll registry','dossiers/page.tsx','Records'], ['payroll dossier','dossiers/[id]/page.tsx','RecordDetail'],
  ['elements','elements/page.tsx','Inputs'], ['bonuses','primes/page.tsx','Inputs'], ['deductions','retenues/page.tsx','Inputs'],
  ['advances','avances/page.tsx','Advances'], ['adjustments','ajustements/page.tsx','Inputs'], ['reimbursements','remboursements/page.tsx','Inputs'],
  ['validation','validation/page.tsx','Validation'], ['payments','paiements/page.tsx','Payments'], ['reconciliation','reconciliation/page.tsx','Reconciliation'],
  ['executions','executions/page.tsx','Executions'], ['governance','gouvernance/page.tsx','Governance'], ['history','historique-personnel/page.tsx','History'],
  ['compliance','conformite/page.tsx','Compliance'], ['payslips','bulletins/page.tsx','Payslips'], ['audit','audit/page.tsx','Audit']
]
for (const [label, rel, symbol] of routeChecks) {
  const full = `${base}/${rel}`; check(`route exists · ${label}`, exists(full)); if (symbol) check(`live wiring · ${label}`, read(full).includes(symbol))
}

const core = [
  'types/angelcare360/payroll-sovereign-control.ts',
  'types/angelcare360/payroll-sovereign-css-modules.d.ts',
  'lib/angelcare360/server/payroll-sovereign-control.ts',
  'app/api/angelcare360/payroll-sovereign/route.ts',
  'components/angelcare360/payroll-sovereign-command/PayrollCommand.module.css',
  'components/angelcare360/payroll-sovereign-command/PayrollCommandShell.tsx',
  'components/angelcare360/payroll-sovereign-command/PayrollActions.tsx',
  'components/angelcare360/payroll-sovereign-command/PayrollRegistryClient.tsx',
  'components/angelcare360/payroll-sovereign-command/PayrollViews.tsx',
  'tsconfig.sanila-payroll-sovereign-control.json',
  'scripts/angelcare360/verify-sanila-payroll-sovereign.mjs'
]
for (const rel of core) check(`core exists · ${rel}`, exists(rel))

const server = read('lib/angelcare360/server/payroll-sovereign-control.ts')
const views = read('components/angelcare360/payroll-sovereign-command/PayrollViews.tsx')
const actions = read('components/angelcare360/payroll-sovereign-command/PayrollActions.tsx')
const registry = read('components/angelcare360/payroll-sovereign-command/PayrollRegistryClient.tsx')
const shell = read('components/angelcare360/payroll-sovereign-command/PayrollCommandShell.tsx')
const css = read('components/angelcare360/payroll-sovereign-command/PayrollCommand.module.css')
const types = read('types/angelcare360/payroll-sovereign-control.ts')
const api = read('app/api/angelcare360/payroll-sovereign/route.ts')
const tsc = read('tsconfig.sanila-payroll-sovereign-control.json')
const all = [server,views,actions,registry,shell,types,api].join('\n')

for (const label of ['Payroll Sovereign Control','À traiter maintenant','Population','Variables','Validation','Paiement']) check(`root doctrine · ${label}`, views.includes(label))
check('root readiness rail present', views.includes('ReadinessRail'))
for (const x of ['Dashboard','Periods','PeriodDetail','Records','RecordDetail','Inputs','Advances','Validation','Payments','Reconciliation','Executions','Governance','History','Compliance','Payslips','Audit']) check(`experience exported · ${x}`, views.includes(`export function ${x}`))
for (const x of ['IntegrityLock','InputControlStudio','InputDecision','RunGovernance','AdvanceStudio','AdvanceTransition','PaymentBatchStudio','PaymentItemTruth','ReconcileButton']) check(`deep control exported · ${x}`, actions.includes(`export function ${x}`))
check('payroll registry is purpose-built client surface', registry.includes('PayrollRegistryClient'))
check('payroll dossier in-page navigation', views.includes('href="#') || views.includes("['vue'") || views.includes('dossierNav'))
check('period in-page navigation', views.includes('readiness') && views.includes('variables') && views.includes('population'))
check('period-over-period factual comparison', views.includes('Variation') || views.includes('variation'))
check('difference explicitly not risk score', /pas (un )?score de risque|pas.*risk/i.test(views))
check('payment truth surface', /PAYMENT TRUTH|VÉRITÉ.*PAIEMENT|paiement.*preuve/i.test(views + actions))
check('financial anatomy surface', /ANATOM|gross|net payable|NET/i.test(views))
check('exception/watchtower surface', /Watchtower|À traiter maintenant/i.test(views))

const tables = [
  'angelcare360_payroll_periods','angelcare360_payroll_run_executions','angelcare360_payroll_employee_results','angelcare360_payroll_input_revisions',
  'angelcare360_payroll_advances_sovereign','angelcare360_payroll_payment_batches','angelcare360_payroll_payment_items','angelcare360_payroll_reconciliation_sessions',
  'angelcare360_payroll_calendar_versions','angelcare360_payroll_policy_versions','angelcare360_payroll_component_versions','angelcare360_payroll_controlled_exports',
  'angelcare360_payroll_offcycle_runs','angelcare360_payroll_final_settlement_runs','angelcare360_payroll_payslip_versions','angelcare360_staff','angelcare360_audit_logs'
]
for (const table of tables) check(`canonical read authority · ${table}`, server.includes(table))
const rpcs = [
  'angelcare360_payroll_integrity_status_v1','angelcare360_payroll_submit_input_v1','angelcare360_payroll_approve_input_v1','angelcare360_payroll_create_advance_v1',
  'angelcare360_payroll_transition_advance_v1','angelcare360_payroll_transition_run_v1','angelcare360_payroll_create_payment_batch_v1',
  'angelcare360_payroll_transition_payment_item_v1','angelcare360_payroll_reconcile_batch_v1'
]
for (const rpc of rpcs) check(`canonical RPC authority · ${rpc}`, server.includes(rpc))

check('server view permission preserved', server.includes("access('payroll.view'"))
check('server manage permission preserved', server.includes("access('payroll.manage'"))
check('canonical payroll audit category', server.includes("category:'payroll'") || server.includes("category: 'payroll'"))
check('legacy payroll records read-only context preserved', server.includes('angelcare360_payroll_records'))
check('no HR payroll dual write', !/from\(['\"]hr_payroll|insert\s+into\s+hr_payroll/i.test(server))
check('no dual-write marker', !/dualWrite|dual_write/.test(server))
check('all mutations route through RPC', !/\.from\([^\n]+\)\.insert\(|\.from\([^\n]+\)\.update\(|\.from\([^\n]+\)\.delete\(/.test(server))
check('input submit action exists', server.includes("action === 'input.submit'"))
check('input approval action exists', server.includes("action === 'input.approve'"))
check('advance create action exists', server.includes("action === 'advance.create'"))
check('advance transition action exists', server.includes("action === 'advance.transition'"))
check('run governance action exists', server.includes("action === 'run.transition'"))
check('payment batch action exists', server.includes("action === 'payment.batch.create'"))
check('payment item transition exists', server.includes("action === 'payment.item.transition'"))
check('reconciliation action exists', server.includes("action === 'payment.batch.reconcile'"))

check('calculation engine truth false', server.includes('calculationEngineProven:false') || server.includes('calculationEngineProven: false'))
check('automatic bank truth false', server.includes('automaticBankTransfer:false') || server.includes('automaticBankTransfer: false'))
check('CNSS automatic truth false', server.includes('cnssAutomatic:false') || server.includes('cnssAutomatic: false'))
check('tax automatic truth false', server.includes('taxAutomatic:false') || server.includes('taxAutomatic: false'))
check('payslip PDF truth false', server.includes('payslipPdfEngineProven:false') || server.includes('payslipPdfEngineProven: false'))
check('external declaration truth false', server.includes('externalDeclarationSubmission:false') || server.includes('externalDeclarationSubmission: false'))
check('payment transition requires reference before paid', /paid[\s\S]{0,500}providerReference|providerReference[\s\S]{0,500}paid/.test(server))
check('operator-recorded payment confirmation is explicit', server.includes('operator_recorded'))
check('no browser calculation command', !/Calculer la paie|calculate payroll/i.test(actions))
check('no automatic bank claim in actions', /Aucun virement automatique|ne déclenche aucun virement|aucun transfert bancaire/i.test(actions))
check('approved is not paid doctrine', /Approved ne signifie pas paid|approuv[ée].*ne.*pay[ée]/i.test(actions + views))
check('payment reference required in UI', /référence|reference/i.test(actions) && /paid/.test(actions))
check('no AI anomaly claim', !/AI anomaly|anomalie IA|intelligence artificielle.*anomal/i.test(all))
check('no fake legal compliance badge', !/100%.*conforme|certifi[ée].*conform/i.test(all))
check('no fake automatic CNSS filing', !/CNSS.*envoy[ée]|soumis.*CNSS automatiquement/i.test(all))
check('no fake automatic tax filing', !/IR.*envoy[ée]|déclaration fiscale automatique/i.test(all))
check('no fake bank success copy', !/banque.*confirm[ée].*automatique|virement bancaire exécuté automatiquement/i.test(all))

check('API no-store', api.includes('no-store'))
check('API force dynamic', api.includes('force-dynamic'))
check('API single mutation authority', api.includes('payrollSovereignMutation'))
check('API snapshot authority', api.includes('getPayrollSovereignSnapshot'))
check('API server-only access error handling', api.includes('Angelcare360AccessError'))

check('purpose-built error state is client component', read(`${base}/error.tsx`).includes("'use client'"))
check('error states explain no mutation', /aucune donnée.*modifi|reste inchang|restent inchang/i.test(read(`${base}/error.tsx`)))
check('purpose-built loading state', /Payroll|paie/i.test(read(`${base}/loading.tsx`)))
check('purpose-built not-found state', /paie|Payroll/i.test(read(`${base}/not-found.tsx`)))

// CSS refs resolution
const cssFiles = [views,actions,registry,shell,read(`${base}/loading.tsx`),read(`${base}/error.tsx`),read(`${base}/not-found.tsx`)]
const refs = new Set()
for (const text of cssFiles) for (const m of text.matchAll(/styles\.([A-Za-z0-9_]+)/g)) refs.add(m[1])
const defs = new Set([...css.matchAll(/\.([A-Za-z_][A-Za-z0-9_-]*)/g)].map(m=>m[1]))
const missing = [...refs].filter(x=>!defs.has(x))
console.log(`CSS refs=${refs.size} defs=${defs.size} missing=${missing.length}`)
if (missing.length) console.log('Missing CSS:', missing.join(', '))
check('all CSS module references resolve', missing.length === 0)
check('focus-visible styling present', css.includes(':focus-visible'))
check('reduced motion locally scoped', css.includes('prefers-reduced-motion'))
check('desktop/tablet breakpoint present', /@media\(max-width:(900|960|1000|1100|1250)px\)/.test(css.replace(/\s/g,'')))
check('mobile breakpoint present', /@media\(max-width:(460|520|560|620|640|720)px\)/.test(css.replace(/\s/g,'')))
check('mobile touch controls >=44px', /min-height:\s*44px/.test(css))
check('light institutional base', /#fff|#fbfcfe|#f8fafc/i.test(css))

check('target tsconfig disables inherited include', /"include"\s*:\s*\[\s*\]/.test(tsc))
check('target tsconfig has explicit files', /"files"\s*:\s*\[/.test(tsc))
check('target tsconfig includes CSS declaration', tsc.includes('payroll-sovereign-css-modules.d.ts'))
check('target tsconfig includes RegistryClient', tsc.includes('PayrollRegistryClient.tsx'))
check('target tsconfig includes next-env', tsc.includes('next-env.d.ts'))
check('target tsconfig disables incremental cache', /"incremental"\s*:\s*false/.test(tsc))
check('target tsconfig invokes no production build', !/next build|npm run build|pnpm build/.test(tsc))

for (const old of ['Angelcare360PayrollHub','Angelcare360PayrollPageShell','Angelcare360PayrollNavigation','Angelcare360PayrollMutationForm']) check(`legacy beta component absent · ${old}`, !all.includes(old))
check('no rapid polling', !all.includes('setInterval('))
check('no forced full-page reload', !all.includes('window.location.reload'))
check('router refresh after confirmed mutations', actions.includes('router.refresh()'))
check('server money uses minor units', /Minor|_minor|minor/i.test(types + server))
check('currency convention is Dh', shell.includes('Dh') || views.includes('Dh'))
check('staff directory typed', types.includes('PayrollStaffDirectoryEntry'))
check('readiness metrics typed', types.includes('staffPopulation') && types.includes('pendingPaymentMinor'))

console.log('========================================================================')
console.log(`RESULT: ${pass}/${pass + fail} checks passed`)
if (fail) process.exit(1)
console.log('SANILA Payroll Sovereign Control OS is statically accepted.')
console.log('NO SQL EXECUTED · NO BUILD · NO STAGE · NO COMMIT · NO PUSH · NO DEPLOYMENT')
console.log('========================================================================')
