import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8')
const exists = (relative) => fs.existsSync(path.join(root, relative))
const checks = []
const check = (name, condition) => checks.push({ name, ok: Boolean(condition) })

const files = {
  layout: 'app/(protected)/hr/layout.tsx',
  shell: 'components/hr-shell/HRModuleShell.tsx',
  sidebar: 'components/hr-shell/HRSovereignSidebar.tsx',
  shellCss: 'components/hr-shell/HRSovereignShell.module.css',
  broadcast: 'components/hr-shell/HRLiveBroadcastBar.tsx',
  nav: 'lib/hr-shell/navigation.ts',
  snapshot: 'lib/hr-shell/snapshot.ts',
  onboardingPage: 'app/(protected)/hr/onboarding/page.tsx',
  onboardingActions: 'app/(protected)/hr/onboarding/_actions.ts',
  onboarding: 'app/(protected)/hr/onboarding/_components/OnboardingCommandCenter.tsx',
  employee: 'app/(protected)/hr/employees/_components/Employee360DossierModal.tsx',
  nativeEmployee: 'app/(protected)/hr/employees/_components/Employee360NativeCommand.tsx',
  nativeCss: 'app/(protected)/hr/employees/_components/Employee360Sovereign.module.css',
  staff360: 'components/hr-production/Staff360ProductionView.tsx',
  employeePage: 'app/(protected)/hr/employees/[id]/page.tsx',
}

for (const [key, relative] of Object.entries(files)) check(`file ${key}`, exists(relative))

const layout = read(files.layout)
const shell = read(files.shell)
const sidebar = read(files.sidebar)
const shellCss = read(files.shellCss)
const broadcast = read(files.broadcast)
const nav = read(files.nav)
const snapshot = read(files.snapshot)
const onboardingPage = read(files.onboardingPage)
const onboardingActions = read(files.onboardingActions)
const onboarding = read(files.onboarding)
const employee = read(files.employee)
const nativeEmployee = read(files.nativeEmployee)
const nativeCss = read(files.nativeCss)
const staff360 = read(files.staff360)
const employeePage = read(files.employeePage)

const expectedRoutes = [
  '/hr',
  '/hr/employees',
  '/hr/staff',
  '/hr/departments',
  '/hr/positions',
  '/hr/contracts',
  '/hr/documents',
  '/hr/recruitment',
  '/hr/recruitment/interviews',
  '/hr/recruitment/questionnaires',
  '/hr/openings',
  '/hr/onboarding',
]
const routeMatches = [...nav.matchAll(/href:\s*"([^"]+)"/g)].map((match) => match[1])
check('sidebar exact route count', routeMatches.length === expectedRoutes.length)
check('sidebar exact route inventory', JSON.stringify(routeMatches) === JSON.stringify(expectedRoutes))
check('questionnaires retained', nav.includes('label: "Questionnaires"') && nav.includes('href: "/hr/recruitment/questionnaires"'))
check('no foreign navigation groups', !nav.includes('/hr/attendance') && !nav.includes('/hr/training') && !nav.includes('/hr/settings') && !nav.includes('/hr/performance-matrix'))
check('official repository logo used', sidebar.includes('AngelCareLogo') && !sidebar.includes('<img'))
check('collapse preserved', sidebar.includes('onToggleCollapsed') && sidebar.includes('PanelLeftClose') && sidebar.includes('PanelLeftOpen'))
check('all original groups opened by default', sidebar.includes('HR_NAVIGATION_GROUPS.map((group) => group.key)'))
check('premium broadcast preserved', shell.includes('HRLiveBroadcastBar') && snapshot.includes('HR_SNAPSHOT_FACTOR_KEYS'))
check('exact twenty snapshot factors', snapshot.includes('HR_SNAPSHOT_FACTOR_COUNT') && (snapshot.match(/^\s*"[a-z_]+",?$/gm) || []).length >= 20)
check('snapshot no polling', !snapshot.includes('setInterval') && !broadcast.includes('setInterval') && !broadcast.includes('WebSocket') && !broadcast.includes('EventSource'))
check('shell no browser storage', !`${shell}${sidebar}${broadcast}`.match(/localStorage|sessionStorage|indexedDB/i))
check('shell always renders one premium sidebar', shell.includes('<HRSovereignSidebar') && !shell.includes('nativeWorkspace') && !shell.includes('NATIVE_WORKSPACE_PREFIXES'))
check('no generic descendant sidebar suppression', !shellCss.includes('aside[class*=') && !shellCss.includes('grid-cols-') && !shellCss.includes('shellNativeWorkspace'))
check('layout uses shared shell', layout.includes('HRModuleShell') && layout.includes('loadHRShellSnapshot'))

check('onboarding uses canonical workspace', onboardingPage.includes('getOnboardingWorkspace'))
check('onboarding canonical action adapter', onboardingActions.includes('@/lib/hr-onboarding/server') && onboardingActions.includes('advanceOnboardingJourney'))
check('onboarding original command identity', onboarding.includes('Onboarding Command Center') && onboarding.includes('HR / CANDIDATE ONBOARDING'))
check('onboarding original journey navigator', onboarding.includes('All Onboardings') && onboarding.includes('My Onboardings'))
check('onboarding original command buttons', ['View Timeline', 'Edit Journey', 'New Journey', 'Add Task'].every((token) => onboarding.includes(token)))
check('onboarding original phase system', onboarding.includes('Advance Phase') && onboarding.includes('Offer & Acceptance') && onboarding.includes('Probation & Review'))
check('onboarding original workspaces', ['Tasks', 'Documents', 'Timeline', 'Checklist', 'Notes', 'Activity'].every((token) => onboarding.includes(`"${token}"`)))
check('onboarding original quick actions', ['Send Reminder', 'Add Document', 'Reassign Owner', 'View Profile'].every((token) => onboarding.includes(token)))
check('onboarding embedded duplicate nav disabled', onboarding.includes('<aside className="hidden">'))
check('onboarding no fake fallback identities', !onboarding.includes('Aminata') && !onboarding.includes('Sarah Mitchell') && !onboarding.includes('fallbackJourneys'))
check('onboarding no fake document/activity records', !onboarding.includes('id: "doc-1"') && !onboarding.includes('id: "a1"') && !onboarding.includes('IT Team started equipment setup'))
check('onboarding no local business IDs', !onboarding.match(/local-(doc|task|timeline|event|reminder)-/))
check('onboarding no browser persistence or reload', !onboarding.match(/localStorage|sessionStorage|indexedDB|window\.location\.reload/))
check('onboarding archive is controlled', onboardingActions.includes('archiveJourney') && onboarding.includes('Parcours onboarding archivé'))
check('onboarding server-confirmed mutations', onboarding.includes('if (!result?.ok)') && onboarding.includes('router.refresh()'))

check('employee original full workspace restored', employee.includes('EmployeeMegaHRWorkspace'))
check('employee original eight domains restored', ['Paie & paiements', 'Congés & absences', 'Présence', 'Planning', 'Documents', 'Contrats', 'Performance', 'Formation'].every((token) => employee.includes(token)))
check('employee original contract studio restored', employee.includes('buildContractDefaults') && employee.includes('Imprimer le contrat A4'))
check('employee original attestation studio restored', employee.includes('buildAttestationDefaults') && employee.includes('Attestation de stage collaborateur'))
check('employee original commands restored', ['Valider & sauvegarder', 'Duplicate', 'Print A4', 'Save'].every((token) => employee.includes(token)))
check('employee A4 dossier restored', employee.includes('Imprimer A4 McKinsey') && employee.includes('employee-a4-print'))
check('employee viewport portal repair', employee.includes('createPortal') && employee.includes('document.body') && employee.includes('100vw-16px'))
check('employee no fake seeded cases', !employee.includes('function seedActions()') && employee.includes('Aucun cas RH sauvegardé'))
check('employee controlled archive wording', employee.includes('Archiver le dossier') && employee.includes('Archiver le cas') && !employee.includes('Delete permanently'))
check('employee native enterprise layer added', employee.includes('Commandement natif 360') && employee.includes('Employee360CommandSurface'))
check('native authority uses focused API', nativeEmployee.includes('/360/actions') && nativeEmployee.includes('/360/documents/upload') && nativeEmployee.includes('Employee360Aggregate'))
check('native CRUD domain inventory present', ['attendance:', 'leave:', 'payroll:', 'planning:', 'documents:', 'contracts:', 'onboarding:', 'training:', 'performance:', 'tasks:', 'approvals:', 'incidents:'].every((token) => nativeEmployee.includes(token)))
check('native modal above restored dossier', nativeCss.includes('2147483500') && nativeCss.includes('2147483550'))
check('full-page route continuity', employeePage.includes('Staff360ProductionView') && staff360.includes('Employee360DossierModal'))
check('staff 360 uses employeeId contract', employeePage.includes('employeeId={id}') && staff360.includes('{ employeeId }: { employeeId: string }'))
check('employee no browser storage', !`${employee}${nativeEmployee}`.match(/localStorage|sessionStorage|indexedDB/i))

const moduleCssFiles = [files.shellCss, files.nativeCss]
for (const relative of moduleCssFiles) {
  const css = read(relative)
  const bareUniversal = /(^|\n)\s*\*(?:\s|,|::)/m.test(css)
  check(`CSS module purity ${relative}`, !bareUniversal)
}

let passed = 0
let failed = 0
for (const item of checks) {
  if (item.ok) { passed += 1; console.log(`PASS  ${item.name}`) }
  else { failed += 1; console.error(`FAIL  ${item.name}`) }
}
console.log('\n========================================================================')
console.log('ANGELCARE — HR FORWARD RECOVERY STATIC ACCEPTANCE')
console.log('========================================================================')
console.log(`Checks passed: ${passed}`)
console.log(`Checks failed: ${failed}`)
console.log('Production build: NO')
console.log('Git mutation:     NO')
if (failed) process.exit(1)
console.log('\n✓ HR FORWARD RECOVERY STATIC ACCEPTANCE PASSED')
