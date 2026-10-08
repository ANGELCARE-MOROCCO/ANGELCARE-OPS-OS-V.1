#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')
const fail = (message) => { throw new Error(`SANILA_DUAL_ENTRY_CERTIFICATION_FAILED: ${message}`) }
const assert = (condition, message) => { if (!condition) fail(message) }

const files = {
  page: 'app/(protected)/angelcare-360-command-center/page.tsx',
  layout: 'app/(protected)/angelcare-360-command-center/layout.tsx',
  api: 'app/api/angelcare360/demo-experience/route.ts',
  contract: 'lib/angelcare360/experience/contract.ts',
  snapshot: 'lib/angelcare360/server/command-center-experience.ts',
  demoState: 'lib/angelcare360/server/demo-experience-state.ts',
  demo: 'components/angelcare360/demo-experience/MasterDemoExperienceCenter.tsx',
  tenant: 'components/angelcare360/command-center/TenantExecutiveCommandCenter.tsx',
  tracker: 'components/angelcare360/demo-experience/DemoExperienceRouteTracker.tsx',
  contextBar: 'components/angelcare360/demo-experience/DemoExperienceContextBar.tsx',
  demoDesk: 'components/marketplace/SanilaDemoDesk.tsx',
}
for (const rel of Object.values(files)) assert(fs.existsSync(path.join(root, rel)), `missing ${rel}`)

const page = read(files.page)
const layout = read(files.layout)
const api = read(files.api)
const contract = read(files.contract)
const snapshot = read(files.snapshot)
const demoState = read(files.demoState)
const demo = read(files.demo)
const tenant = read(files.tenant)
const tracker = read(files.tracker)
const contextBar = read(files.contextBar)
const demoDesk = read(files.demoDesk)

assert(page.includes('isTrustedSanilaMasterDemoContext(context)'), 'root page does not use trusted server classifier')
assert(page.includes('<MasterDemoExperienceCenter') && page.includes('<TenantExecutiveCommandCenter'), 'dual entry components not both wired')
assert(page.indexOf('isTrustedSanilaMasterDemoContext(context)') < page.indexOf('<MasterDemoExperienceCenter'), 'Demo view can render before trusted classification')
assert(!page.includes('school.name.includes') && !page.includes('pathname.includes') && !page.includes('searchParams'), 'heuristic Demo authority detected in root page')

assert(snapshot.includes("context?.school?.id === SANILA_MASTER_DEMO_SCHOOL_ID"), 'exact Master Demo school authority missing')
assert(snapshot.includes('context.demoAccess.schoolId === context.school.id'), 'Demo principal/school binding missing')
assert(snapshot.includes("export type SanilaDataState = 'synced' | 'partial' | 'unavailable' | 'restricted'"), 'role-aware restricted source state missing')
assert(snapshot.includes('financeAllowed') && snapshot.includes('payrollAllowed') && snapshot.includes('attendanceAllowed'), 'sensitive domain permission gates missing')
assert(snapshot.includes(".eq('school_id', schoolId)"), 'school scoped data resolution missing')
assert(snapshot.includes("state: 'restricted'"), 'restricted domain fail-closed behavior missing')

assert(layout.includes('const isMasterDemo = isTrustedSanilaMasterDemoContext(context)'), 'layout Demo authority is not server-derived')
assert(layout.includes('<DemoExperienceRouteTracker enabled={isMasterDemo}/>'), 'deep-route Demo tracker is not explicitly gated')
assert(layout.includes('isMasterDemo ? <DemoExperienceContextBar/> : null'), 'Demo context bar can leak into real tenant')

assert(api.includes('!isTrustedSanilaMasterDemoContext(context)'), 'Demo Experience API lacks trusted Master Demo guard')
assert(api.includes('config.school_id !== context.school?.id'), 'Demo Experience API lacks config/school binding')
assert(api.includes("metadata.source = 'sanila_experience_center'"), 'experience event provenance missing')
assert(!api.includes('createServiceClient'), 'public Demo Experience endpoint must not bypass established user authority')

assert(demoState.includes(".from('sanila_demo_access_events')"), 'Demo experience state does not reuse governed event authority')
for (const forbidden of ['angelcare360_students', 'angelcare360_invoices', 'angelcare360_attendance_records']) {
  assert(!demoState.includes(forbidden), `commercial visit state touches canonical school table ${forbidden}`)
}

const moduleBlock = contract.slice(contract.indexOf('SANILA_EXPERIENCE_MODULES'), contract.indexOf('SANILA_GUIDED_JOURNEYS'))
const moduleCount = [...moduleBlock.matchAll(/\{ id: '[^']+', label:/g)].length
assert(moduleCount === 14, `expected 14 Demo universes, found ${moduleCount}`)
const journeyBlock = contract.slice(contract.indexOf('SANILA_GUIDED_JOURNEYS'), contract.indexOf('SANILA_PRIORITY_OPTIONS'))
const journeyCount = [...journeyBlock.matchAll(/\{ id: '[^']+', label:/g)].length
assert(journeyCount === 5, `expected 5 guided journeys, found ${journeyCount}`)

for (const capability of ['experience_favorite_set', 'experience_priority_set', 'experience_question_added', 'experience_journey_selected', 'experience_conversion_intent', 'experience_visit_reset']) {
  assert(demo.includes(capability) || api.includes(capability), `missing Demo experience capability ${capability}`)
}
assert(demo.includes('SANILA EXPERIENCE CENTER'), 'premium Demo Experience hero missing')
assert(demo.includes('Ma visite') || demo.includes('Votre visite'), 'Demo visit progress surface missing')
assert(tracker.includes("if (!enabled || !pathname.startsWith('/angelcare-360-command-center')) return"), 'route tracker lacks explicit Demo enable gate')

for (const forbidden of ['SANILA EXPERIENCE CENTER', 'Ma visite SANILA', 'École de démonstration', 'experience_favorite_set', 'experience_question_added']) {
  assert(!tenant.includes(forbidden), `real tenant command center contains Demo-only behavior: ${forbidden}`)
}
assert(tenant.includes('SANILA EXECUTIVE COMMAND CENTER'), 'real tenant executive experience missing')
assert(tenant.includes('snapshot.domainStates.finance'), 'real tenant finance visualization does not respect role state')
assert(tenant.includes('Accès restreint') || tenant.includes('Accès selon votre rôle'), 'role-aware restricted UX missing')

for (const legacy of ['Shell opérationnel et isolé', 'Points de vigilance pour l’exploitation', 'Recherche contrôlée', 'Ouvrir l’audit']) {
  assert(!page.includes(legacy) && !demo.includes(legacy) && !contextBar.includes(legacy), `legacy engineering language still exposed at Demo entry: ${legacy}`)
}

assert(demoDesk.includes('experienceSummary(events'), 'Demo Desk lacks exploration replay')
assert(demoDesk.includes('Exploration') && demoDesk.includes('Favoris') && demoDesk.includes('Questions du prospect'), 'Demo Desk lacks commercial visit intelligence')

const suspiciousAuthority = [page, layout, snapshot, api].join('\n')
for (const pattern of ['schoolName.includes(', 'school.name.includes(', 'pathname.includes("demo")', "pathname.includes('demo')", 'searchParams.demo']) {
  assert(!suspiciousAuthority.includes(pattern), `forbidden heuristic authority pattern detected: ${pattern}`)
}

console.log(JSON.stringify({
  mission: 'SANILA_DUAL_ENTRY_EXPERIENCE_PREMIUM_EVOLUTION',
  status: 'PASS_STATIC_SOURCE_ONLY',
  serverAuthoritativeDualEntry: true,
  exactMasterDemoAuthority: true,
  realTenantShowroomLeak: false,
  experienceModules: moduleCount,
  guidedJourneys: journeyCount,
  demoStateAuthority: 'sanila_demo_access_events',
  newDatabaseMigrationRequired: false,
  canonicalMasterDemoDatasetTouched: false,
  tenantSchoolScope: true,
  tenantSensitiveDomainsPermissionGated: true,
  roleRestrictedStateTruthful: true,
  demoDeskExplorationIntelligence: true,
}, null, 2))
