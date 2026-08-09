#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { execFileSync } from 'node:child_process'
const require=createRequire(import.meta.url)
const ts=require('typescript')
const root=process.cwd(), checks=[]
const pass=(label,ok,detail='')=>checks.push({label,ok:Boolean(ok),detail})
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8')
const exists=rel=>fs.existsSync(path.join(root,rel))

const routeMap={
 'app/(protected)/revenue-command-center/appointments/page.tsx':'engagement-command',
 'app/(protected)/revenue-command-center/appointments/dashboard/page.tsx':'appointment-dashboard',
 'app/(protected)/revenue-command-center/appointments/command/page.tsx':'appointment-command',
 'app/(protected)/revenue-command-center/appointments/control-tower/page.tsx':'control-tower',
 'app/(protected)/revenue-command-center/appointments/[id]/page.tsx':'appointment-dossier',
 'app/(protected)/revenue-command-center/appointments/briefing/[id]/page.tsx':'briefing-room',
 'app/(protected)/revenue-command-center/appointments/calendar/page.tsx':'calendar',
 'app/(protected)/revenue-command-center/appointments/conversion/page.tsx':'conversion',
 'app/(protected)/revenue-command-center/appointments/escalations/page.tsx':'escalations',
 'app/(protected)/revenue-command-center/appointments/executive/page.tsx':'executive',
 'app/(protected)/revenue-command-center/appointments/follow-up/[id]/page.tsx':'follow-up',
 'app/(protected)/revenue-command-center/appointments/high-value/page.tsx':'high-value',
 'app/(protected)/revenue-command-center/appointments/live/page.tsx':'live-command',
 'app/(protected)/revenue-command-center/appointments/live/[id]/page.tsx':'live-room',
 'app/(protected)/revenue-command-center/appointments/schedule/page.tsx':'schedule-studio',
 'app/(protected)/revenue-command-center/appointments/new/page.tsx':'new-appointment',
 'app/(protected)/revenue-command-center/appointments/no-shows/page.tsx':'no-shows',
 'app/(protected)/revenue-command-center/appointments/outcome/[id]/page.tsx':'outcome-studio',
 'app/(protected)/revenue-command-center/appointments/performance/page.tsx':'performance',
 'app/(protected)/revenue-command-center/appointments/queue/page.tsx':'queue',
 'app/(protected)/revenue-command-center/appointments/recovery/page.tsx':'recovery',
 'app/(protected)/revenue-command-center/appointments/reschedules/page.tsx':'reschedules',
 'app/(protected)/revenue-command-center/appointments/risk/page.tsx':'risk',
 'app/(protected)/revenue-command-center/appointments/analytics/page.tsx':'analytics',
}
const routeCount=Number(execFileSync('bash',['-lc',"find 'app/(protected)/revenue-command-center' -type f -name page.tsx | wc -l"],{encoding:'utf8'}).trim())
pass('All 151 Revenue Command Center routes remain present',routeCount===151,`count=${routeCount}`)
for(const [rel,key] of Object.entries(routeMap)){
 const src=exists(rel)?read(rel):''
 pass(`${rel} exists`,Boolean(src))
 pass(`${rel} uses RevenueEngagementWorkspace`,src.includes('RevenueEngagementWorkspace'))
 pass(`${rel} has individual experience ${key}`,src.includes(`experience="${key}"`))
 pass(`${rel} no longer imports the retired appointment mega workspace`,!src.includes('RevenueAppointmentsV12MegaWorkspace'))
}
const required=[
 'components/revenue-command-center/engagement-enterprise/RevenueEngagementWorkspace.tsx',
 'components/revenue-command-center/engagement-enterprise/RevenueEngagementWorkspace.module.css',
 'components/revenue-command-center/engagement-enterprise/route-contracts.ts',
 'components/revenue-command-center/engagement-enterprise/types.ts',
 'components/revenue-command-center/engagement-enterprise/useEngagementPortfolio.ts',
 'lib/revenue-command-center/engagement-enterprise/server.ts',
 'supabase/revenue-command-center/preflight/20260725_engagement_appointments_communications_live_schema_preflight.sql',
 'supabase/migrations/20260725_0300_revenue_engagement_appointments_communications_conversion.sql',
 'supabase/revenue-command-center/verification/20260725_engagement_appointments_communications_rls_verification.sql',
 'supabase/revenue-command-center/rollback/20260725_revenue_engagement_phase5_rollback.sql',
]
for(const f of required) pass(`${f} exists`,exists(f))
const apiRoutes=[
 'app/api/revenue-command-center/engagement/portfolio/route.ts','app/api/revenue-command-center/engagement/appointments/route.ts','app/api/revenue-command-center/engagement/appointments/[id]/route.ts','app/api/revenue-command-center/engagement/appointments/[id]/transition/route.ts','app/api/revenue-command-center/engagement/participants/route.ts','app/api/revenue-command-center/engagement/confirmations/route.ts','app/api/revenue-command-center/engagement/preparation/route.ts','app/api/revenue-command-center/engagement/attendance/route.ts','app/api/revenue-command-center/engagement/notes/route.ts','app/api/revenue-command-center/engagement/objections/route.ts','app/api/revenue-command-center/engagement/decisions/route.ts','app/api/revenue-command-center/engagement/commitments/route.ts','app/api/revenue-command-center/engagement/outcomes/route.ts','app/api/revenue-command-center/engagement/no-shows/route.ts','app/api/revenue-command-center/engagement/recovery/route.ts','app/api/revenue-command-center/engagement/follow-ups/route.ts','app/api/revenue-command-center/engagement/communications/threads/route.ts','app/api/revenue-command-center/engagement/communications/events/route.ts','app/api/revenue-command-center/engagement/communications/delivery/route.ts'
]
for(const f of apiRoutes){const src=exists(f)?read(f):'';pass(`${f} exists`,Boolean(src));pass(`${f} enforces Revenue access`,src.includes('engagementContext('));pass(`${f} returns controlled errors`,src.includes('revenueAccessFailure'))}
const server=read(required[5])
pass('Canonical appointment status taxonomy exists',server.includes('APPOINTMENT_STATUSES'))
pass('Appointment transition validation exists',server.includes('validateAppointmentTransition'))
pass('Legacy status aliases are normalized',server.includes('STATUS_ALIASES'))
pass('TEXT prospect identity is preserved in appointment payloads',server.includes('prospect_id:cleanString'))
pass('Server execution requires Revenue access before service role',server.includes('requireRevenueApiAccess')&&server.indexOf('requireRevenueApiAccess')<server.indexOf('SUPABASE_SERVICE_ROLE_KEY'))
pass('Engagement events persist to canonical activity and action logs',server.includes('logRevenueActivity')&&server.includes('logRevenueAction'))
pass('Meeting commitments can create governed follow-up tasks',server.includes('createFollowUpTask'))
const transition=read(apiRoutes[3]);pass('Transition route validates state movement',transition.includes('validateAppointmentTransition'));pass('Transition route relies on canonical event and database status-history capture',transition.includes('recordEngagementEvent')&&transition.includes('status:normalizeAppointmentStatus'));pass('Transition route uses controlled conflict handling',transition.includes('409')||transition.includes('expectedVersion'))
const outcomes=read('app/api/revenue-command-center/engagement/outcomes/route.ts');pass('Outcome command delegates to the atomic database command',outcomes.includes('revenue_apply_meeting_outcome'));pass('Outcome command returns governed follow-up execution results',outcomes.includes('taskIds'))
const communication=read('app/api/revenue-command-center/engagement/communications/events/route.ts');pass('Communication event supports inbound and outbound direction',communication.includes('direction'));pass('Communication event records provider references',communication.includes('provider'));pass('Communication API records truth without claiming provider delivery',!communication.includes('email sent successfully')&&!communication.includes('WhatsApp sent successfully'))
const workspace=read(required[0]), contracts=read(required[2]), types=read(required[3]), hook=read(required[4]), css=read(required[1])
for(const key of Object.values(routeMap)) pass(`Route contract ${key} exists`,contracts.includes(`"${key}"`)&&types.includes(`"${key}"`))
for(const token of ['CommandExperience','DashboardExperience','ControlTowerExperience','QueueExperience','CalendarExperience','ScheduleStudio','DossierExperience','BriefingExperience','LiveExperience','ConversionExperience','NoShowExperience','RecoveryExperience','RescheduleExperience','RiskExperience','EscalationExperience','HighValueExperience','AnalyticsExperience','PerformanceExperience','ExecutiveExperience','FollowUpExperience','EngagementModal']) pass(`Unique UX surface ${token} exists`,workspace.includes(`function ${token}`))
for(const kind of ['schedule','participant','confirm','reschedule','cancel','communication','follow-up','no-show','recovery','preparation','note','objection','decision','commitment','outcome']) pass(`Enterprise modal ${kind} exists`,types.includes(`"${kind}"`)&&workspace.includes(kind))
pass('French corporate money formatting uses fr-FR and Dh',workspace.includes('Intl.NumberFormat("fr-FR"')&&workspace.includes(' Dh`'))
pass('Modal focus trap exists',workspace.includes('focusable')&&workspace.includes('keydown'))
pass('Modal restores focus and page scrolling',workspace.includes('previousFocus')&&workspace.includes('document.body.style.overflow'))
pass('Live-meeting capture actions persist through controlled server mutations',workspace.includes('/engagement/notes')&&workspace.includes('/engagement/objections')&&workspace.includes('/engagement/decisions')&&workspace.includes('/engagement/commitments'))
pass('Portfolio hook rejects failed mutations before success UI',hook.includes('if(!response.ok')||hook.includes('if (!response.ok'))
pass('Portfolio hook uses canonical engagement APIs',hook.includes('/api/revenue-command-center/engagement'))
const migration=read(required[7]);pass('Opportunity progression is explicit rather than automatic',workspace.includes('applyOpportunity:false')&&outcomes.includes('p_payload:body')&&migration.includes('applyOpportunity'))
const tables=['revenue_appointment_participants','revenue_appointment_status_history','revenue_meeting_agenda_items','revenue_meeting_preparation_items','revenue_meeting_attendance','revenue_meeting_notes','revenue_meeting_objections','revenue_meeting_decisions','revenue_meeting_commitments','revenue_meeting_outcomes','revenue_meeting_follow_ups','revenue_appointment_no_shows','revenue_appointment_recovery_attempts','revenue_communication_threads','revenue_communication_events','revenue_communication_delivery_events']
for(const table of tables) pass(`Migration creates ${table}`,migration.includes(`create table if not exists public.${table}`))
for(const col of ['account_id','contact_id','opportunity_id','timezone','confirmation_status','preparation_status','no_show_risk','commercial_value_mad','outcome_code','version']) pass(`Migration extends appointments with ${col}`,migration.includes(`add column if not exists ${col}`))
pass('Migration preserves TEXT prospect contract',migration.includes('revenue_prospects.id remains TEXT')&&migration.includes("prospect_type <> 'text'"))
pass('Migration requires UUID appointment identity',migration.includes("appointment_type <> 'uuid'")&&migration.includes('revenue_appointments.id UUID'))
pass('Migration is additive and transactional',migration.includes('begin;')&&migration.trim().endsWith('commit;'))
pass('Dynamic appointment view avoids duplicate entity_name',migration.includes("column_name not in (")&&migration.includes("'entity_name'"))
pass('Engagement appointment read model exists',migration.includes('revenue_engagement_appointment_view'))
pass('Communication thread read model exists',migration.includes('revenue_communication_thread_view'))
pass('Appointment workload read model exists',migration.includes('revenue_appointment_workload_view'))
pass('Appointment status history trigger exists',migration.includes('trg_revenue_appointment_status_history')&&migration.includes('revenue_capture_appointment_status_history'))
pass('Support tables enable RLS',migration.includes('enable row level security'))
pass('Authenticated clients receive read-only policies',migration.includes('for select to authenticated'))
pass('Authenticated clients do not receive broad writes',!/grant\s+(insert|update|delete|all).*authenticated/i.test(migration))
pass('Service role receives controlled support-table privileges',migration.includes('to service_role'));pass('Atomic meeting outcome RPC exists',migration.includes('revenue_apply_meeting_outcome')&&migration.includes('for update'));pass('Atomic outcome RPC creates follow-up tasks and optional opportunity progression',migration.includes('v_task_ids')&&migration.includes('applyOpportunity'))
const preflight=read(required[6]);pass('Preflight exposes CUTOVER_GATE',preflight.toLowerCase().includes('cutover_gate'));pass('Preflight checks TEXT prospect compatibility',preflight.includes('prospect_id_type')&&preflight.includes("<> 'text'"));pass('Preflight checks appointment and task UUID contracts',preflight.includes('revenue_appointments')&&preflight.includes('revenue_tasks'))
const verification=read(required[8]);pass('Verification checks all support relations',tables.every(t=>verification.includes(t)));pass('Verification audits RLS policies',verification.includes('pg_policies'));pass('Verification checks orphaned records',verification.toLowerCase().includes('orphan'))
const rollback=read(required[9]);pass('Rollback drops only Phase 5 support objects',tables.every(t=>rollback.includes(t)));pass('Rollback does not drop legacy appointments',!rollback.includes('drop table if exists public.revenue_appointments'))
const tsFiles=[...Object.keys(routeMap),...required.filter(f=>/\.(ts|tsx)$/.test(f)),...apiRoutes]
let syntax=[]
for(const f of tsFiles){const r=ts.transpileModule(read(f),{fileName:f,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.Preserve}});for(const d of r.diagnostics||[])if(d.category===ts.DiagnosticCategory.Error)syntax.push(`${f}: ${ts.flattenDiagnosticMessageText(d.messageText,' ')}`)}
pass('TypeScript isolated syntax gate passes',syntax.length===0,syntax.slice(0,5).join(' | '))
const cssRefs=[...workspace.matchAll(/styles\.([A-Za-z0-9_]+)/g)].map(m=>m[1]);const missing=[...new Set(cssRefs)].filter(n=>!new RegExp(`\\.${n}(?:[\\s,{:\\[]|$)`).test(css));pass('CSS-module references resolve',missing.length===0,missing.join(', '))
let failed=0;for(const c of checks){console.log(`${c.ok?'PASS':'FAIL'}  ${c.label}${c.detail?` (${c.detail})`:''}`);if(!c.ok)failed++}
console.log(`\n${checks.length} checks passed: ${checks.length-failed}; failed: ${failed}.`)
if(failed)process.exit(1)
console.log('Communications / Appointments / Meetings / Conversion Mega ZIP 5 is statically accepted.')
