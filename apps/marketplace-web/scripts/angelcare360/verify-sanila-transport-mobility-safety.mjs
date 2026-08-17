#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const app=path.resolve(process.argv[2]||process.cwd())
let passed=0,failed=0
function check(name,condition){if(condition){console.log(`PASS  ${name}`);passed++}else{console.log(`FAIL  ${name}`);failed++}}
function read(rel){const f=path.join(app,rel);return fs.existsSync(f)?fs.readFileSync(f,'utf8'):''}
function exists(rel){return fs.existsSync(path.join(app,rel))}
function walk(dir){if(!fs.existsSync(dir))return[];let out=[];for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name);out=e.isDirectory()?out.concat(walk(f)):out.concat(f)}return out}

const base='app/(protected)/angelcare-360-command-center/transport'
const routes=[
`${base}/page.tsx`,`${base}/layout.tsx`,`${base}/_utils.ts`,`${base}/loading.tsx`,`${base}/error.tsx`,`${base}/not-found.tsx`,
`${base}/circuits/page.tsx`,`${base}/circuits/[id]/page.tsx`,`${base}/arrets/page.tsx`,
`${base}/vehicules/page.tsx`,`${base}/vehicules/[id]/page.tsx`,
`${base}/chauffeurs/page.tsx`,`${base}/chauffeurs/[id]/page.tsx`,
`${base}/affectations/page.tsx`,`${base}/courses/page.tsx`,`${base}/courses/[id]/page.tsx`,
`${base}/ramassage/page.tsx`,`${base}/depot/page.tsx`,`${base}/securite/page.tsx`,
`${base}/incidents/page.tsx`,`${base}/notifications/page.tsx`,`${base}/audit/page.tsx`]
for(const r of routes)check(`route exists: ${r.replace(base+'/','')}`,exists(r))

const core=[
'types/angelcare360/transport-mobility.ts','lib/angelcare360/server/transport-mobility-command.ts',
'app/api/angelcare360/transport-command/route.ts','components/angelcare360/transport-command/TransportCommand.module.css',
'components/angelcare360/transport-command/TransportCommandShell.tsx','components/angelcare360/transport-command/TransportActions.tsx',
'components/angelcare360/transport-command/TransportViews.tsx','tsconfig.sanila-transport-mobility-safety.json',
'scripts/angelcare360/verify-sanila-transport-mobility-safety.mjs']
for(const r of core)check(`core exists: ${r}`,exists(r))

const sqls=['01_PREFLIGHT.sql','02_MIGRATION.sql','03_POSTCHECK.sql','04_ROLLBACK.sql','SQL_REQUIRED.txt','OBJECT_MANIFEST.txt','EXPECTED_SCHEMA_DELTA.txt']
for(const x of sqls)check(`repo SQL exists: ${x}`,exists(`supabase/transport-mobility-safety/${x}`))

const server=read('lib/angelcare360/server/transport-mobility-command.ts')
const views=read('components/angelcare360/transport-command/TransportViews.tsx')
const actions=read('components/angelcare360/transport-command/TransportActions.tsx')
const shell=read('components/angelcare360/transport-command/TransportCommandShell.tsx')
const css=read('components/angelcare360/transport-command/TransportCommand.module.css')
const api=read('app/api/angelcare360/transport-command/route.ts')
const types=read('types/angelcare360/transport-mobility.ts')
const pre=read('supabase/transport-mobility-safety/01_PREFLIGHT.sql')
const mig=read('supabase/transport-mobility-safety/02_MIGRATION.sql')
const post=read('supabase/transport-mobility-safety/03_POSTCHECK.sql')
const rollback=read('supabase/transport-mobility-safety/04_ROLLBACK.sql')
const tsconfig=read('tsconfig.sanila-transport-mobility-safety.json')

for(const term of [
'Mobility Command Theatre','Mobility Readiness','Planned Network Canvas','Route Command','Route Operations Chamber',
'Stop Sequence Control','Fleet Readiness Command','Vehicle Readiness Dossier','Driver Readiness','Driver Readiness Dossier',
'Student Mobility Matrix','Daily Movement Board','Mobility Run Chamber','Pickup Operations','Dropoff Operations',
'Safety Departure Gate','Incident Truth','Commercial Truth','Transport Watchtower','Mobility Forensics'
])check(`signed experience present: ${term}`,views.includes(term))

for(const term of ['RouteStudio','StopStudio','VehicleStudio','DriverStudio','AssignmentStudio','SafetyStudio','RunStudio','RunEventConsole','ResolveAlertButton'])
  check(`deep action studio present: ${term}`,actions.includes(term)||views.includes(term))

check('advanced transport routes read',server.includes("ac360_school_transport_routes"))
check('advanced route stops read',server.includes("ac360_school_transport_route_stops"))
check('advanced vehicles read',server.includes("ac360_school_transport_vehicles"))
check('advanced drivers read',server.includes("ac360_school_transport_drivers"))
check('advanced assignments read',server.includes("ac360_school_transport_student_assignments"))
check('advanced route runs read',server.includes("ac360_school_transport_route_runs"))
check('advanced run events read',server.includes("ac360_school_transport_run_events"))
check('advanced safety checks read',server.includes("ac360_school_transport_safety_checks"))
check('advanced alerts read',server.includes("ac360_school_transport_alerts"))
check('advanced students read',server.includes("ac360_school_students"))
check('advanced staff read',server.includes("ac360_school_staff_profiles"))
check('legacy routes compatibility preserved',server.includes("angelcare360_transport_routes"))
check('legacy stops compatibility preserved',server.includes("angelcare360_transport_stops"))
check('legacy vehicles compatibility preserved',server.includes("angelcare360_transport_vehicles"))
check('legacy assignments compatibility preserved',server.includes("angelcare360_transport_assignments"))

check('authority resolver exact id',server.includes(".eq('id', school.id)"))
check('authority resolver school code',server.includes(".eq('org_code', school.school_code)"))
check('authority resolver metadata bridge',server.includes("angelcare360_school_id"))
check('no blind name-based organization mapping',!server.includes(".eq('display_name', school.name)"))
check('no dual write path',!server.includes('dualWrite')&&!server.includes('dual_write'))
check('advanced selected when populated',server.includes("advancedCount > 0"))
check('legacy preserved when populated',server.includes("legacyCount > 0"))

check('GPS live hard false in types',types.includes('gpsLiveAvailable: false'))
check('external parent delivery hard false in types',types.includes('externalParentNotificationsAvailable: false'))
check('planned coordinates clearly labelled',(views+actions).includes('PLANIFIÉ')&&(views+actions).includes('PAS DE GPS LIVE'))
check('no fake ETA phrase',!/\bETA\b.*\bmin|arrive dans \d/i.test(views+actions))
check('no moving vehicle animation',!/(movingVehicle|animateVehicle|vehiclePosition|liveLatitude|liveLongitude)/i.test(views+actions+server))
check('parent_notified distinguished from delivery',views.includes('Aucune preuve de livraison externe')||views.includes('livraison WhatsApp/SMS/email/push'))
check('no fake WhatsApp sent',!/WhatsApp (envoyé|delivered|sent)/i.test(views+actions))
check('no fake SMS sent',!/SMS (envoyé|delivered|sent)/i.test(views+actions))

check('route upsert uses existing advanced RPC',server.includes("rpc('ac360_school_upsert_transport_route'"))
check('stop upsert uses existing advanced RPC',server.includes("rpc('ac360_school_upsert_transport_route_stop'"))
check('vehicle upsert uses existing advanced RPC',server.includes("rpc('ac360_school_upsert_transport_vehicle'"))
check('driver upsert uses existing advanced RPC',server.includes("rpc('ac360_school_upsert_transport_driver'"))
check('assignment uses guarded RPC',server.includes("rpc('angelcare360_transport_assign_student_v1'"))
check('run open uses guarded RPC',server.includes("rpc('angelcare360_transport_open_run_v1'"))
check('run event uses guarded RPC',server.includes("rpc('angelcare360_transport_record_run_event_v1'"))
check('safety uses guarded RPC',server.includes("rpc('angelcare360_transport_record_safety_check_v1'"))
check('run close uses guarded RPC',server.includes("rpc('angelcare360_transport_close_run_v1'"))
check('integrity RPC consumed',server.includes("rpc('angelcare360_transport_integrity_status_v1'"))
check('advanced operations lock before SQL',server.includes('requireAdvancedMutation')&&server.includes('locked:true'))

check('API no-store',api.includes("'Cache-Control': 'no-store'"))
check('API force dynamic',api.includes("dynamic = 'force-dynamic'"))
check('API delegates single mutation authority',api.includes('transportMutation'))
check('API snapshot endpoint present',api.includes('getTransportMobilitySnapshot'))

check('preflight canonical advanced routes',pre.includes('ac360_school_transport_routes'))
check('preflight checks stop-route mismatch',pre.includes('assignment_stop_route_mismatch'))
check('preflight checks assignment org',pre.includes('assignment_cross_org'))
check('preflight checks run refs',pre.includes('run_reference_cross_org'))
check('preflight checks event refs',pre.includes('run_event_reference_cross_org'))
check('preflight checks safety refs',pre.includes('safety_reference_cross_org'))
check('preflight reports over capacity',pre.includes('over_capacity_routes'))
check('preflight has no DDL',!/\bCREATE\s+(TABLE|INDEX|FUNCTION)|\bALTER\s+TABLE|\bDROP\s+/i.test(pre))

check('migration creates no tables',!/\bCREATE\s+TABLE\b/i.test(mig))
check('migration creates no indexes',!/\bCREATE\s+(UNIQUE\s+)?INDEX\b/i.test(mig))
check('migration changes no RLS policy',!/\bCREATE\s+POLICY\b|\bDROP\s+POLICY\b|\bENABLE\s+ROW\s+LEVEL\s+SECURITY\b|\bDISABLE\s+ROW\s+LEVEL\s+SECURITY\b/i.test(mig))
check('migration creates integrity RPC',mig.includes('angelcare360_transport_integrity_status_v1'))
check('migration creates safe assignment RPC',mig.includes('angelcare360_transport_assign_student_v1'))
check('migration validates stop belongs route',mig.includes('Selected stop does not belong to selected route'))
check('migration creates safe safety RPC',mig.includes('angelcare360_transport_record_safety_check_v1'))
check('migration creates safe open-run RPC',mig.includes('angelcare360_transport_open_run_v1'))
check('migration blocks expired insurance',mig.includes('Vehicle insurance is expired'))
check('migration blocks expired inspection',mig.includes('Vehicle inspection is expired'))
check('migration blocks expired driver license',mig.includes('Driver license is expired'))
check('migration blocks capacity overrun',mig.includes('Active student assignments exceed vehicle capacity'))
check('migration blocks seatbelt overrun',mig.includes('exceed recorded seatbelt count'))
check('migration requires pre-route safety',mig.includes('Pre-route safety check required'))
check('migration blocks failed safety',mig.includes('Latest pre-route safety check blocks departure'))
check('migration idempotent open run',mig.includes("'idempotent',true"))
check('migration creates safe event RPC',mig.includes('angelcare360_transport_record_run_event_v1'))
check('event verifies student assignment',mig.includes('Student is not actively assigned'))
check('event verifies stop route',mig.includes('Stop does not belong to route run'))
check('migration creates safe close RPC',mig.includes('angelcare360_transport_close_run_v1'))
check('service-role grants only',mig.includes('TO service_role')&&mig.includes('FROM PUBLIC, anon, authenticated'))
check('postcheck integrity all active orgs',post.includes('angelcare360_transport_integrity_status_v1(r.org_id)'))
check('rollback removes package functions only',rollback.includes('DROP FUNCTION IF EXISTS')&&!rollback.includes('DROP TABLE')&&!rollback.includes('DROP INDEX'))

check('route create/edit studio present',actions.includes('Route Design Studio'))
check('stop ordering studio present',actions.includes('Stop Sequence Control'))
check('vehicle readiness studio present',actions.includes('Fleet Readiness Studio'))
check('driver readiness studio present',actions.includes('Driver Readiness'))
check('assignment safety copy present',actions.includes('arrêt appartient au circuit'))
check('safety gate copy present',actions.includes('Safety Departure Gate'))
check('run safety copy present',actions.includes('dernier contrôle pré-départ'))
check('mobile field console present',actions.includes('Run Field Console'))
check('student boarded action present',actions.includes("student_boarded"))
check('student absent action present',actions.includes("student_absent"))
check('student dropped action present',actions.includes("student_dropped"))
check('delay action present',actions.includes("event('delay')"))
check('incident action present',actions.includes("event('incident')"))

check('WCAG focus visible',css.includes(':focus-visible'))
check('reduced motion',css.includes('prefers-reduced-motion'))
check('tablet breakpoint',css.includes('@media(max-width:900px)'))
check('mobile breakpoint',css.includes('@media(max-width:620px)'))
check('mobile touch targets',css.includes('min-height:44px'))
check('light premium base',css.includes('--paper:#fbfdff')&&css.includes('#fff'))
check('not dark-only design',css.includes('linear-gradient(180deg,#f8fbff')&&css.includes('rgba(255,255,255'))

const domainText=walk(path.join(app,base)).concat(walk(path.join(app,'components/angelcare360/transport-command'))).filter(f=>/\.(ts|tsx|css)$/.test(f)).map(f=>fs.readFileSync(f,'utf8')).join('\n')
for(const old of ['Angelcare360TransportHub','Angelcare360TransportPageShell','Angelcare360TransportNavigation','Angelcare360TransportMutationForm','Angelcare360TransportRoutesWorkspace','Angelcare360TransportSafetyWorkspace','Angelcare360TransportPickupListWorkspace','Angelcare360TransportDropoffListWorkspace'])
  check(`old beta component not imported: ${old}`,!domainText.includes(old))

check('target tsconfig disables inherited include',/"include"\s*:\s*\[\s*\]/.test(tsconfig))
check('target tsconfig explicit files',/"files"\s*:\s*\[/.test(tsconfig))
check('target tsconfig no next build',!tsconfig.includes('next build'))
check('no setInterval polling',!domainText.includes('setInterval('))
check('no forced reload',!domainText.includes('window.location.reload'))
check('router refresh after mutations',actions.includes('router.refresh()'))

console.log()
console.log('========================================================================')
console.log(`RESULT: ${passed}/${passed+failed} checks passed`)
if(failed===0){console.log('SANILA Mobility & Safety Command OS is statically accepted.')}
else{console.log(`FAILED ${failed} static check(s).`);process.exit(1)}
console.log('NO SQL EXECUTED · NO BUILD · NO STAGE · NO COMMIT · NO PUSH · NO DEPLOYMENT')
console.log('========================================================================')
