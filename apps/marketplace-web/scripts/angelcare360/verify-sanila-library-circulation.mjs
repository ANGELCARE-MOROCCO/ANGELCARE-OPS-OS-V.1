#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const app = path.resolve(process.argv[2] || process.cwd())
let passed = 0
let failed = 0

function check(name, condition) {
  if (condition) {
    console.log(`PASS  ${name}`)
    passed += 1
  } else {
    console.log(`FAIL  ${name}`)
    failed += 1
  }
}
function read(rel) {
  const file = path.join(app, rel)
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
}
function exists(rel) { return fs.existsSync(path.join(app, rel)) }
function walk(dir) {
  const result = []
  if (!fs.existsSync(dir)) return result
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) result.push(...walk(full))
    else result.push(full)
  }
  return result
}

const routeBase = 'app/(protected)/angelcare-360-command-center/bibliotheque'
const requiredRoutes = [
  `${routeBase}/page.tsx`,
  `${routeBase}/layout.tsx`,
  `${routeBase}/_utils.ts`,
  `${routeBase}/loading.tsx`,
  `${routeBase}/error.tsx`,
  `${routeBase}/not-found.tsx`,
  `${routeBase}/livres/page.tsx`,
  `${routeBase}/livres/[id]/page.tsx`,
  `${routeBase}/exemplaires/page.tsx`,
  `${routeBase}/exemplaires/[id]/page.tsx`,
  `${routeBase}/disponibilite/page.tsx`,
  `${routeBase}/prets/page.tsx`,
  `${routeBase}/prets/[id]/page.tsx`,
  `${routeBase}/retours/page.tsx`,
  `${routeBase}/retards/page.tsx`,
  `${routeBase}/audit/page.tsx`,
]
for (const route of requiredRoutes) check(`route exists: ${route.replace(routeBase + '/', '')}`, exists(route))

const requiredCore = [
  'types/angelcare360/library-circulation.ts',
  'lib/angelcare360/server/library-circulation-command.ts',
  'app/api/angelcare360/library-command/route.ts',
  'components/angelcare360/library-command/LibraryCommand.module.css',
  'components/angelcare360/library-command/LibraryCommandShell.tsx',
  'components/angelcare360/library-command/LibraryActions.tsx',
  'components/angelcare360/library-command/LibraryViews.tsx',
  'tsconfig.sanila-library-circulation.json',
  'scripts/angelcare360/verify-sanila-library-circulation.mjs',
]
for (const item of requiredCore) check(`core exists: ${item}`, exists(item))

const sqlFiles = [
  'supabase/library-circulation/01_PREFLIGHT.sql',
  'supabase/library-circulation/02_MIGRATION.sql',
  'supabase/library-circulation/03_POSTCHECK.sql',
  'supabase/library-circulation/04_ROLLBACK.sql',
  'supabase/library-circulation/SQL_REQUIRED.txt',
  'supabase/library-circulation/OBJECT_MANIFEST.txt',
  'supabase/library-circulation/EXPECTED_SCHEMA_DELTA.txt',
]
for (const item of sqlFiles) check(`repo SQL artifact exists: ${path.basename(item)}`, exists(item))

const server = read('lib/angelcare360/server/library-circulation-command.ts')
const api = read('app/api/angelcare360/library-command/route.ts')
const actions = read('components/angelcare360/library-command/LibraryActions.tsx')
const views = read('components/angelcare360/library-command/LibraryViews.tsx')
const css = read('components/angelcare360/library-command/LibraryCommand.module.css')
const types = read('types/angelcare360/library-circulation.ts')
const migration = read('supabase/library-circulation/02_MIGRATION.sql')
const preflight = read('supabase/library-circulation/01_PREFLIGHT.sql')
const postcheck = read('supabase/library-circulation/03_POSTCHECK.sql')
const rollback = read('supabase/library-circulation/04_ROLLBACK.sql')
const tsconfig = read('tsconfig.sanila-library-circulation.json')

for (const term of [
  'Knowledge Atrium','Constellation de collection','Ruban de circulation','À traiter aujourd’hui',
  'CatalogueEditorial','Work Portrait','Copy Fleet','Availability Atlas','CirculationDesk',
  'Circulation Chamber','ReturnDesk','OverdueRecovery','Collection Forensics'
]) check(`signed experience present: ${term}`, views.includes(term))

for (const term of [
  'BookStudio','CopyStudio','LoanStudio','ReturnStudio','LossCancelStudio','BarcodeLookup'
]) check(`deep studio present: ${term}`, actions.includes(term) || views.includes(term))

check('book/copy distinction represented in types', types.includes('LibraryBook') && types.includes('LibraryCopy'))
check('borrower supports student', types.includes("'student'"))
check('borrower supports staff', types.includes("'staff'"))
check('fine amount remains factual field', types.includes('fineAmount'))
check('integrity state is explicit', types.includes('safeForCirculation'))

check('snapshot reads canonical books table', server.includes("from('angelcare360_library_books')"))
check('snapshot reads canonical copies table', server.includes("from('angelcare360_library_copies')"))
check('snapshot reads canonical loans table', server.includes("from('angelcare360_library_loans')"))
check('snapshot resolves students', server.includes("from('angelcare360_students')"))
check('snapshot resolves staff', server.includes("from('angelcare360_staff')"))
check('snapshot reads central audit authority', server.includes("from('angelcare360_audit_logs')"))
check('no legacy library server import', !server.includes("from './library'") && !server.includes("@/lib/angelcare360/server/library'"))
check('no duplicate library table generation in code', !server.includes('sanila_library_') && !server.includes('ac360_library_v2'))

check('barcode lookup is real database query', server.includes(".eq('barcode', needle)") && server.includes(".eq('copy_code', needle)"))
check('barcode scanner has manual fallback', actions.includes('saisie manuelle'))
check('scanner stops media tracks', actions.includes("getTracks().forEach(track => track.stop())"))
check('scanner uses no persistent interval', !actions.includes('setInterval('))
check('no short polling loop', !actions.includes('setInterval(') && !views.includes('setInterval('))
check('no forced browser reload', !actions.includes('window.location.reload'))
check('router refresh used after confirmed mutation', actions.includes('router.refresh()'))

check('loan mutation delegates to atomic RPC', server.includes("rpc('angelcare360_library_create_loan_v1'"))
check('return mutation delegates to atomic RPC', server.includes("rpc('angelcare360_library_return_loan_v1'"))
check('loss mutation delegates to atomic RPC', server.includes("rpc('angelcare360_library_mark_lost_v1'"))
check('cancel mutation delegates to atomic RPC', server.includes("rpc('angelcare360_library_cancel_loan_v1'"))
check('circulation locks when SQL missing', server.includes('requireCirculationReady') && server.includes('locked: true'))
check('integrity RPC consumed by runtime', server.includes("rpc('angelcare360_library_integrity_status_v1'"))

check('API exposes snapshot', api.includes('getLibraryCommandSnapshot'))
check('API exposes barcode lookup', api.includes("mode === 'barcode'"))
check('API exposes book create', api.includes("case 'book.create'"))
check('API exposes book update', api.includes("case 'book.update'"))
check('API exposes copy create', api.includes("case 'copy.create'"))
check('API exposes copy update', api.includes("case 'copy.update'"))
check('API exposes loan create', api.includes("case 'loan.create'"))
check('API exposes loan return', api.includes("case 'loan.return'"))
check('API exposes loss', api.includes("case 'loan.lost'"))
check('API exposes cancel', api.includes("case 'loan.cancel'"))
check('API is no-store', api.includes("'Cache-Control': 'no-store'"))

check('preflight requires canonical books', preflight.includes('angelcare360_library_books'))
check('preflight requires canonical copies', preflight.includes('angelcare360_library_copies'))
check('preflight requires canonical loans', preflight.includes('angelcare360_library_loans'))
check('preflight detects duplicate active loans', preflight.includes('duplicate_active'))
check('preflight detects copy-state mismatches', preflight.includes('state_mismatch'))
check('preflight detects loaned copies without loan', preflight.includes('orphan_loaned'))
check('preflight detects invalid borrower links', preflight.includes('invalid_borrowers'))
check('preflight detects duplicate barcodes', preflight.includes('duplicate_barcodes'))
check('preflight performs no DDL', !/\bCREATE\s+(TABLE|INDEX|FUNCTION)|\bALTER\s+TABLE|\bDROP\s+/i.test(preflight))

check('migration creates no table', !/\bCREATE\s+TABLE\b/i.test(migration))
check('migration changes no RLS policy', !/\bCREATE\s+POLICY\b|\bDROP\s+POLICY\b|\bENABLE\s+ROW\s+LEVEL\s+SECURITY\b|\bDISABLE\s+ROW\s+LEVEL\s+SECURITY\b/i.test(migration))
check('migration creates active-loan partial unique index', migration.includes('ux_ac360_library_one_active_loan_per_copy'))
check('migration creates barcode uniqueness index', migration.includes('ux_ac360_library_copy_barcode'))
check('migration creates integrity function', migration.includes('angelcare360_library_integrity_status_v1'))
check('migration creates loan function', migration.includes('angelcare360_library_create_loan_v1'))
check('migration creates return function', migration.includes('angelcare360_library_return_loan_v1'))
check('migration creates loss function', migration.includes('angelcare360_library_mark_lost_v1'))
check('migration creates cancel function', migration.includes('angelcare360_library_cancel_loan_v1'))
check('loan RPC locks copy row', /library_create_loan_v1[\s\S]*FOR UPDATE/i.test(migration))
check('return RPC locks circulation rows', /library_return_loan_v1[\s\S]*FOR UPDATE/i.test(migration))
check('negative dual-loan prevented at database layer', migration.includes("WHERE returned_at IS NULL AND status IN ('open','active','overdue')"))
check('service_role-only grants present', migration.includes('GRANT EXECUTE') && migration.includes('TO service_role'))
check('authenticated direct RPC grants revoked', migration.includes('FROM PUBLIC, anon, authenticated'))
check('postcheck validates objects', postcheck.includes('POSTCHECK FAILED'))
check('postcheck runs integrity per school', postcheck.includes('angelcare360_library_integrity_status_v1(s.id)'))
check('rollback removes only package RPCs/indexes', rollback.includes('DROP FUNCTION IF EXISTS') && rollback.includes('DROP INDEX IF EXISTS') && !rollback.includes('DROP TABLE'))

check('external reminders are not claimed as sent', views.includes('relances externes ne sont pas présentées comme envoyées'))
check('fine is explicitly not Finance invoice', views.includes('n’est pas présenté comme facture Finance'))
check('reserved state is labelled factual', actions.includes('Réservé · état factuel existant'))
check('no fake reservation creation action', !actions.includes('reservation.create') && !api.includes('reservation.create'))
check('no fake recommendation language', !/recommandation IA|score de lecture|popularité prédite/i.test(views + actions))
check('no fake external delivery status', !/SMS envoyé|WhatsApp envoyé|email envoyé/i.test(views + actions))

check('WCAG focus-visible styling present', css.includes(':focus-visible'))
check('reduced motion fallback present', css.includes('prefers-reduced-motion'))
check('mobile breakpoint present', css.includes('@media(max-width:620px)'))
check('tablet breakpoint present', css.includes('@media(max-width:900px)'))
check('touch-sized mobile buttons present', css.includes('min-height:44px'))
check('no dark-only theme', css.includes('--paper:#fffdf8') && css.includes('background:'))

const domainFiles = walk(path.join(app, routeBase)).concat(walk(path.join(app, 'components/angelcare360/library-command')))
const domainText = domainFiles.filter(f => /\.(ts|tsx|css)$/.test(f)).map(f => fs.readFileSync(f,'utf8')).join('\n')
for (const oldName of [
  'Angelcare360LibraryHub',
  'Angelcare360LibraryNavigation',
  'Angelcare360LibraryPageShell',
  'Angelcare360LibraryMutationForm',
  'Angelcare360LibrarySectionScreen',
  'Angelcare360LibraryRiskPanel',
  'Angelcare360LibraryAuditDrawer'
]) check(`old beta component not imported: ${oldName}`, !domainText.includes(oldName))

check('target tsconfig disables inherited include', /"include"\s*:\s*\[\s*\]/.test(tsconfig))
check('target tsconfig has explicit files', /"files"\s*:\s*\[/.test(tsconfig))
check('target tsconfig no production build command', !tsconfig.includes('next build'))

console.log()
console.log('========================================================================')
console.log(`RESULT: ${passed}/${passed + failed} checks passed`)
if (failed === 0) {
  console.log('SANILA Library & Circulation OS is statically accepted.')
} else {
  console.log(`SANILA Library & Circulation OS FAILED ${failed} static check(s).`)
  process.exit(1)
}
console.log('NO SQL EXECUTED · NO BUILD · NO STAGE · NO COMMIT · NO PUSH · NO DEPLOYMENT')
console.log('========================================================================')
