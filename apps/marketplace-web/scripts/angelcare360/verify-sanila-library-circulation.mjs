#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const app = path.resolve(process.argv[2] || process.cwd())
let passed = 0
let failed = 0
const check = (name, condition) => {
  if (condition) { console.log(`PASS — ${name}`); passed += 1 }
  else { console.log(`FAIL — ${name}`); failed += 1 }
}
const read = rel => { const file = path.join(app, rel); return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '' }
const exists = rel => fs.existsSync(path.join(app, rel))
const routeBase = 'app/(protected)/angelcare-360-command-center/bibliotheque'
const routes = {
  root: `${routeBase}/page.tsx`,
  layout: `${routeBase}/layout.tsx`,
  util: `${routeBase}/_utils.ts`,
  loading: `${routeBase}/loading.tsx`,
  error: `${routeBase}/error.tsx`,
  notFound: `${routeBase}/not-found.tsx`,
  books: `${routeBase}/livres/page.tsx`,
  book: `${routeBase}/livres/[id]/page.tsx`,
  copies: `${routeBase}/exemplaires/page.tsx`,
  copy: `${routeBase}/exemplaires/[id]/page.tsx`,
  availability: `${routeBase}/disponibilite/page.tsx`,
  loans: `${routeBase}/prets/page.tsx`,
  loan: `${routeBase}/prets/[id]/page.tsx`,
  returns: `${routeBase}/retours/page.tsx`,
  overdue: `${routeBase}/retards/page.tsx`,
  members: `${routeBase}/membres/page.tsx`,
  member: `${routeBase}/membres/[id]/page.tsx`,
  audit: `${routeBase}/audit/page.tsx`,
}
for (const [key, rel] of Object.entries(routes)) check(`route exists · ${key}`, exists(rel))

const core = [
  'types/angelcare360/library-circulation.ts',
  'types/angelcare360/library-circulation-css-modules.d.ts',
  'lib/angelcare360/server/library-circulation-command.ts',
  'app/api/angelcare360/library-command/route.ts',
  'components/angelcare360/library-command/LibraryCommand.module.css',
  'components/angelcare360/library-command/LibraryCommandShell.tsx',
  'components/angelcare360/library-command/LibraryActions.tsx',
  'components/angelcare360/library-command/LibraryViews.tsx',
  'tsconfig.sanila-library-circulation.json',
  'scripts/angelcare360/verify-sanila-library-circulation.mjs',
]
for (const rel of core) check(`core exists · ${rel}`, exists(rel))

const server = read(core[2])
const api = read(core[3])
const css = read(core[4])
const shell = read(core[5])
const actions = read(core[6])
const views = read(core[7])
const types = read(core[0])
const tsconfig = read(core[8])
const allRouteText = Object.values(routes).map(read).join('\n')
const allDomainText = [server, api, shell, actions, views, types, allRouteText].join('\n')

// Actual route wiring
const routeWiring = [
  ['root cockpit', routes.root, 'KnowledgeAtrium'],
  ['catalogue', routes.books, 'CatalogueEditorial'],
  ['title dossier', routes.book, 'WorkPortrait'],
  ['copy registry', routes.copies, 'CopyFleet'],
  ['copy dossier', routes.copy, 'CopyDossier'],
  ['availability', routes.availability, 'AvailabilityAtlas'],
  ['circulation', routes.loans, 'CirculationDesk'],
  ['loan chamber', routes.loan, 'CirculationChamber'],
  ['returns', routes.returns, 'ReturnDesk'],
  ['overdue', routes.overdue, 'OverdueRecovery'],
  ['member command', routes.members, 'MemberCommand'],
  ['member dossier', routes.member, 'MemberDossier'],
  ['forensics', routes.audit, 'CollectionForensics'],
]
for (const [label, rel, symbol] of routeWiring) check(`live wiring · ${label}`, read(rel).includes(symbol))

// UX depth and distinct operational experiences
for (const symbol of ['KnowledgeAtrium','CatalogueEditorial','WorkPortrait','CopyFleet','CopyDossier','AvailabilityAtlas','CirculationDesk','CirculationChamber','ReturnDesk','OverdueRecovery','MemberCommand','MemberDossier','CollectionForensics']) {
  check(`experience exported · ${symbol}`, views.includes(`export function ${symbol}`))
}
for (const symbol of ['BookStudio','CopyStudio','LoanStudio','ReturnStudio','LossCancelStudio','BarcodeLookup','LibraryDrawer']) {
  check(`deep studio exists · ${symbol}`, actions.includes(`function ${symbol}`) || actions.includes(`export function ${symbol}`))
}
check('signature watchtower present', views.includes('À traiter maintenant') || views.includes('Watchtower'))
check('today circulation pulse present', views.includes('Circulation aujourd’hui') || views.includes('todayEvents'))
check('member eligibility truth present', views.includes('Éligibilité réellement prouvée'))
check('overdue recovery doctrine present', views.includes('Vérité de relance'))
check('title/copy distinction explicit', types.includes('LibraryBook') && types.includes('LibraryCopy') && views.includes('exemplaire physique'))
check('dossier in-page navigation present', views.includes('DossierNav'))
check('mobile-specific entity cards present', views.includes('mobileEntityCard') && css.includes('.mobileEntityCard'))

// Canonical backend authority
for (const table of ['angelcare360_library_books','angelcare360_library_copies','angelcare360_library_loans','angelcare360_students','angelcare360_staff','angelcare360_classes','angelcare360_audit_logs']) {
  check(`canonical read authority · ${table}`, server.includes(`from('${table}')`))
}
for (const rpc of ['angelcare360_library_integrity_status_v1','angelcare360_library_create_loan_v1','angelcare360_library_return_loan_v1','angelcare360_library_mark_lost_v1','angelcare360_library_cancel_loan_v1']) {
  check(`canonical RPC authority · ${rpc}`, server.includes(`rpc('${rpc}'`))
}
check('view permission preserved', server.includes("context('bibliotheque.view'"))
check('create permission preserved', server.includes("context('bibliotheque.create'"))
check('update permission preserved', server.includes("context('bibliotheque.update'"))
check('canonical library audit category', server.includes("category: 'library'"))
check('atomic circulation readiness gate', server.includes('requireCirculationReady'))
check('browser never writes stock/circulation directly', !actions.includes("from('angelcare360_library_loans')") && !views.includes("from('angelcare360_library_loans')"))
check('archive guard protects active circulation', server.includes('possède encore un prêt actif'))
check('loaned state cannot be manufactured manually', server.includes('ne peut être produit que par la circulation'))

// Capability truth — explicitly no invented reservations/renewals/provider/fines authority
check('reservation workflow explicitly unsupported', types.includes('reservationWorkflow: false') && server.includes('reservationWorkflow: false'))
check('reservation status is observed truth only', types.includes("reservationTruth: 'status_only'") && server.includes("reservationTruth: 'status_only'"))
check('renewal workflow explicitly unsupported', types.includes('renewalWorkflow: false') && server.includes('renewalWorkflow: false'))
check('financial fine authority explicitly unsupported', types.includes('financialFineAuthority: false') && server.includes('financialFineAuthority: false'))
check('reminder delivery authority explicitly unsupported', types.includes('reminderDeliveryAuthority: false') && server.includes('reminderDeliveryAuthority: false'))
check('shelf location authority labelled recorded text only', types.includes("shelfLocationAuthority: 'recorded_text_only'"))
check('ISBN metadata provider explicitly unsupported', types.includes('isbnMetadataProvider: false'))
check('no reservation mutation action invented', !/reservation\.(create|update|cancel|fulfill)/.test(allDomainText))
check('no renewal mutation action invented', !/loan\.renew|renewLibraryLoan|renewal\.create/.test(allDomainText))
check('external reminder delivery is explicitly negated and delegated', views.includes('n’affiche jamais « SMS envoyé »') && views.includes('autorité Messagerie'))
check('no AI borrower scoring', !/bad borrower|bon emprunteur|mauvais emprunteur|risk score|score de risque|score comportemental IA/i.test(allDomainText))
check('no fake external ISBN lookup', !/Google Books|OpenLibrary|ISBN API|metadata provider active/i.test(allDomainText))
check('RFID and real-time shelf tracking are explicitly disclaimed', views.includes('ne revendique aucune localisation physique temps réel, RFID ou IoT'))
check('fine is not promoted to Finance invoice', views.includes('jamais présentée comme facture Finance'))

// Actions and barcode safety
check('barcode lookup uses canonical copies table', server.includes(".eq('barcode', needle)") && server.includes(".eq('copy_code', needle)"))
check('barcode manual fallback present', /saisie manuelle|recherche manuelle/i.test(actions))
check('camera tracks stopped', actions.includes('getTracks().forEach(track => track.stop())'))
check('no camera video persistence', !/MediaRecorder|toBlob\(|upload.*video/i.test(actions))
check('no rapid polling', !/setInterval\s*\(/.test(actions + views))
check('no forced full-page reload', !/window\.location\.reload/.test(actions + views))
check('router refresh after confirmed mutations', actions.includes('router.refresh()'))

// API truth
for (const action of ['book.create','book.update','copy.create','copy.update','loan.create','loan.return','loan.lost','loan.cancel']) check(`API action · ${action}`, api.includes(`case '${action}'`))
check('API barcode mode', api.includes("mode === 'barcode'"))
check('API snapshot mode', api.includes('getLibraryCommandSnapshot'))
check('API no-store', api.includes("'Cache-Control': 'no-store'"))
check('API has no reservation action', !api.includes('reservation.'))
check('API has no renewal action', !api.includes('renew'))

// Types/read model
check('borrowers include student and staff', types.includes("'student' | 'staff'"))
check('member operational counts typed', types.includes('activeLoanCount') && types.includes('overdueLoanCount') && types.includes('totalLoanCount'))
check('intervention queue typed', types.includes('LibraryInterventionItem'))
check('today circulation typed', types.includes('LibraryCirculationEvent'))
check('capability truth typed', types.includes('LibraryCapabilities'))
check('availability metrics typed', types.includes('titlesUnavailable') && types.includes('dueToday') && types.includes('returnedToday'))

// CSS integrity
const refs = new Set([...`${shell}\n${actions}\n${views}\n${read(routes.loading)}\n${read(routes.error)}\n${read(routes.notFound)}`.matchAll(/styles\.([A-Za-z0-9_]+)/g)].map(m => m[1]))
const defs = new Set([...css.matchAll(/\.([A-Za-z_][A-Za-z0-9_-]*)\s*(?=[,{:\[])/g)].map(m => m[1]))
const missingCss = [...refs].filter(name => !defs.has(name))
console.log(`CSS refs=${refs.size} defs=${defs.size} missing=${missingCss.length}`)
if (missingCss.length) console.log(`CSS missing: ${missingCss.join(', ')}`)
check('all CSS module references resolve', missingCss.length === 0)
check('focus-visible styling present', css.includes(':focus-visible'))
check('reduced motion locally scoped', css.includes('@media(prefers-reduced-motion:reduce)') && css.includes('.universe *'))
check('desktop/tablet/mobile breakpoints present', css.includes('max-width:1280px') && css.includes('max-width:980px') && css.includes('max-width:760px') && css.includes('max-width:520px'))
check('mobile touch controls >=44px', css.includes('min-height:44px'))
check('module remains light institutional theme', css.includes('--paper:#fffdf8') && !css.includes('color-scheme:dark'))

// States & architecture
check('purpose-built loading state', read(routes.loading).includes('loading') || read(routes.loading).includes('Chargement'))
check('purpose-built error state is client component', read(routes.error).startsWith("'use client'"))
check('error explains no mutation occurred', /aucun|aucune|inchang|reste/i.test(read(routes.error)))
check('purpose-built not-found state', /introuvable|Retour/i.test(read(routes.notFound)))
check('module shell imports no global replacement shell', !/AppShell|ZoneEFrame|Sidebar|MainSidebar/.test(shell))
check('no global config reference in package UI', !/next\.config|vercel\.json|middleware\.ts/.test(allDomainText))

// Targeted TS config
check('target tsconfig disables inherited include', /"include"\s*:\s*\[\s*\]/.test(tsconfig))
check('target tsconfig has explicit files', /"files"\s*:\s*\[/.test(tsconfig))
check('target tsconfig includes CSS declaration', tsconfig.includes('library-circulation-css-modules.d.ts'))
check('target tsconfig includes members route', tsconfig.includes('bibliotheque/membres/page.tsx') && tsconfig.includes('bibliotheque/membres/[id]/page.tsx'))
check('target tsconfig disables incremental cache', tsconfig.includes('"incremental": false'))
check('target tsconfig does not invoke production build', !tsconfig.includes('next build'))

// Old beta surfaces not mounted by new route family
for (const oldName of ['Angelcare360LibraryHub','Angelcare360LibraryNavigation','Angelcare360LibraryPageShell','Angelcare360LibraryMutationForm','Angelcare360LibrarySectionScreen','Angelcare360LibraryRiskPanel','Angelcare360LibraryAuditDrawer']) {
  check(`legacy beta component absent · ${oldName}`, !allRouteText.includes(oldName))
}

console.log('\n========================================================================')
console.log(`RESULT: ${passed}/${passed + failed} checks passed`)
if (failed) {
  console.log(`SANILA Library & Circulation Command FAILED ${failed} check(s).`)
  process.exit(1)
}
console.log('SANILA Library & Circulation Command is statically accepted.')
console.log('NO SQL EXECUTED · NO BUILD · NO STAGE · NO COMMIT · NO PUSH · NO DEPLOYMENT')
console.log('========================================================================')
