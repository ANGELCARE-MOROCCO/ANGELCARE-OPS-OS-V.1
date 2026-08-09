import fs from 'node:fs'
import path from 'node:path'

const app = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd()
const required = [
  'angelcare-marketplace/journey-control/types.ts',
  'angelcare-marketplace/journey-control/content.ts',
  'angelcare-marketplace/journey-control/repository.ts',
  'angelcare-marketplace/journey-control/api-handlers.ts',
  'angelcare-marketplace/journey-control/journey.module.css',
  'angelcare-marketplace/journey-control/components/AccountCommand.tsx',
  'angelcare-marketplace/journey-control/components/JourneyExperience.tsx',
  'angelcare-marketplace/journey-control/components/ProductOrderJourney.tsx',
  'angelcare-marketplace/journey-control/components/FamilyBookingJourney.tsx',
  'angelcare-marketplace/journey-control/components/AcademyEnrollmentJourney.tsx',
  'angelcare-marketplace/journey-control/components/B2BQuotationJourney.tsx',
  'angelcare-marketplace/journey-control/components/PartnerActivationJourney.tsx',
  'angelcare-marketplace/journey-control/components/QualityAssessmentJourney.tsx',
  'angelcare-marketplace/journey-control/components/JourneyAdminCommand.tsx',
  'app/angelcare-marketplace/[locale]/account/page.tsx',
  'app/angelcare-marketplace/[locale]/account/journeys/[journeyId]/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/journeys/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/journeys/[journeyId]/page.tsx',
  'app/api/angelcare-marketplace/journeys/route.ts',
  'app/api/angelcare-marketplace/journeys/account/route.ts',
  'app/api/angelcare-marketplace/journeys/[journeyId]/route.ts',
  'supabase/migrations/20260802190000_angelcare_marketplace_journey_control_universe.sql',
  'angelcare-marketplace/database/rollback/20260802190000_angelcare_marketplace_journey_control_universe_SAFE_ROLLBACK.sql',
  'tsconfig.angelcare-marketplace-journey-control.json',
]
const failures = []
let pass = 0
function check(label, condition) { if (condition) { console.log(`  ✓ ${label}`); pass += 1 } else failures.push(label) }
function text(rel) { return fs.readFileSync(path.join(app, rel), 'utf8') }
console.log('ANGELCARE Journey Control — contractual verifier')
for (const rel of required) check(`required ${rel}`, fs.existsSync(path.join(app, rel)))
const sql = text('supabase/migrations/20260802190000_angelcare_marketplace_journey_control_universe.sql')
for (const marker of [
  'angelcare_marketplace_journeys','angelcare_marketplace_journey_events','angelcare_marketplace_journey_actions',
  'angelcare_marketplace_journey_documents','angelcare_marketplace_journey_notifications','angelcare_marketplace_journey_change_requests',
  'angelcare_marketplace_journey_recovery_cases','angelcare_marketplace_journey_sla_events','angelcare_marketplace_materialize_journey_from_conversion',
  'angelcare_marketplace_journey_command_v','angelcare_marketplace_journey_funnel_v','marketplace.journeys.enabled',
  "'journey-control-universe'",'marketplace_journey_manager',',23)',
  'enable row level security','revoke all on table','grant all on table',
]) check(`SQL ${marker}`, sql.toLowerCase().includes(marker.toLowerCase()))
check('SQL no destructive table operation', !/drop\s+table|truncate\s+table|drop\s+column/i.test(sql))
check('SQL conversion authority trigger', /create\s+trigger\s+trg_ac_materialize_journey_from_conversion/i.test(sql))
check('SQL idempotent outcome link', /on\s+conflict\s*\(\s*conversion_outcome_id\s*\)/i.test(sql))
check('SQL post-MZ20 governed sequence', /introduced_by_mega_zip\s*>?=\s*1/i.test(sql))
const types = text('angelcare-marketplace/domain/types.ts')
for (const permission of ['marketplace.journeys.view','marketplace.journeys.manage','marketplace.journeys.recovery.manage','marketplace.journeys.analytics.view']) check(`permission ${permission}`, types.includes(permission))
const nav = text('angelcare-marketplace/shells/AdminNavigation.tsx')
check('Journey Command navigation mounted', nav.includes('/angelcare-marketplace/admin/journeys'))
const css = text('angelcare-marketplace/journey-control/journey.module.css')
for (const marker of ['.accountHero','.journeyHero','.journeyPortfolio','.timelinePanel','.actionPanel','.documentVault','.recoveryPanel','.adminHero','.adminJourneyTable','@media(max-width:720px)','[dir="rtl"]','prefers-reduced-motion']) check(`visual ${marker}`, css.includes(marker))
const sourceRoots = ['angelcare-marketplace/journey-control','app/angelcare-marketplace/[locale]/account','app/angelcare-marketplace/(protected)/admin/journeys','app/api/angelcare-marketplace/journeys']
for (const root of sourceRoots) {
  const walk = (dir) => { for (const entry of fs.readdirSync(dir,{withFileTypes:true})) { const target=path.join(dir,entry.name); if(entry.isDirectory()) walk(target); else if(/\.(ts|tsx)$/.test(entry.name)){const source=fs.readFileSync(target,'utf8');check(`${path.relative(app,target)} no suppression`,!/@ts-ignore|@ts-nocheck|\bas any\b|unknown as|TODO\s*:|lorem ipsum|localStorage/i.test(source))}} }
  walk(path.join(app,root))
}
console.log(`\nPASS ${pass}`)
if (failures.length) { console.log(`FAIL ${failures.length}`); failures.forEach((failure)=>console.log(`  ✗ ${failure}`)); process.exit(1) }
console.log('RESULT: JOURNEY CONTROL STATIC CONTRACTUAL ACCEPTANCE PASSED')
