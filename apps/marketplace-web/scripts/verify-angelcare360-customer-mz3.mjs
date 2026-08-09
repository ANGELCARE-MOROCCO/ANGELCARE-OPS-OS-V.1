#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const app=path.resolve(process.argv[2]||process.cwd())
const requireFromApp=createRequire(path.join(app,'package.json'))
let ts
try{ts=requireFromApp('typescript')}catch{console.error('FAIL: project-local TypeScript is unavailable.');process.exit(1)}
let checks=0
function pass(message){checks+=1;console.log(`PASS  ${message}`)}
function fail(message){console.error(`FAIL  ${message}`);process.exit(1)}
function read(rel){const file=path.join(app,rel);if(!fs.existsSync(file))fail(`missing file ${rel}`);pass(`file ${rel}`);return fs.readFileSync(file,'utf8')}
function has(source,marker,label){if(!source.includes(marker))fail(`${label}: ${marker}`);pass(label)}
function lacks(source,marker,label){if(source.includes(marker))fail(`${label}: ${marker}`);pass(label)}

const prerequisites=[
 ['data/angelcare360/module-registry.ts','export function getAngelcare360ModuleById'],
 ['components/angelcare360/customer-experience/CustomerExperienceProvider.tsx','durationMs: input.durationMs ?? 3000'],
 ['components/angelcare360/customer-experience/CustomerOverlayPortal.tsx','createPortal'],
 ['components/angelcare360/customer-foundation/DirectionExecutiveCommand.tsx','Direction'],
 ['components/angelcare360/customer-foundation/AdmissionsEnrollmentCommand.tsx','Admissions'],
]
for(const [rel,marker] of prerequisites){const source=read(rel);has(source,marker,`post-MZ2 prerequisite ${rel}`)}

const routes=[
 'academique','academique/appreciations','academique/audit','academique/bulletins','academique/bulletins/[id]','academique/cours','academique/cours/[id]','academique/devoirs','academique/devoirs/[id]','academique/examens','academique/examens/[id]','academique/moyennes','academique/notes','academique/sessions-examens','academique/soumissions',
 'emploi-du-temps','emploi-du-temps/calendrier','emploi-du-temps/classes','emploi-du-temps/enseignants',
 'presences','presences/absences','presences/audit','presences/classes','presences/classes/[id]','presences/eleves','presences/jour','presences/justifications','presences/justifications/[id]','presences/retards',
]
for(const route of routes){const rel=`app/(protected)/angelcare-360-command-center/${route}/page.tsx`;if(!fs.existsSync(path.join(app,rel)))fail(`registered route missing ${route}`);pass(`registered MZ3 route ${route}`)}
if(routes.length!==29)fail(`expected 29 routes, found ${routes.length}`);pass('exact 29-route MZ3 coverage')

const planeSource=read('data/angelcare360/customer-academic-authority.ts')
const planes={attendance:['live-control','students','classes','absences','late-arrivals','justifications','corrections','day-closure','analytics','audit'],timetable:['command','calendar','classes','teachers','constraints','conflicts','publication','revisions','audit'],learning:['command','curriculum','courses','progression','homework','submissions','review','audit'],assessment:['assessment-command','sessions','examinations','gradebook','missing-grades','averages','validation','report-cards','appreciations','publication','assessment-audit']}
let planeCount=0
for(const [family,keys] of Object.entries(planes)){for(const key of keys){has(planeSource,`['${key}'`,`plane ${family}.${key}`);planeCount+=1}}
if(planeCount!==38)fail(`expected 38 planes, found ${planeCount}`);pass('exact 38-plane horizontal depth')

const tsFiles=[
 'types/angelcare360/customer-academic-authority.ts','data/angelcare360/customer-academic-authority.ts','lib/angelcare360/server/customer-academic-authority.ts','app/api/angelcare360/customer-academic-authority/route.ts',
 'components/angelcare360/customer-academic-authority/AcademicAuthorityPlaneRail.tsx','components/angelcare360/customer-academic-authority/AcademicAuthorityActionDrawer.tsx','components/angelcare360/customer-academic-authority/PresenceDailyControl.tsx','components/angelcare360/customer-academic-authority/TimetableSchedulingAuthority.tsx','components/angelcare360/customer-academic-authority/AcademicLearningAuthority.tsx',
 'app/(protected)/angelcare-360-command-center/presences/page.tsx','app/(protected)/angelcare-360-command-center/emploi-du-temps/page.tsx','app/(protected)/angelcare-360-command-center/academique/page.tsx',
]
for(const rel of tsFiles){const source=read(rel);const kind=rel.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS;const parsed=ts.createSourceFile(rel,source,ts.ScriptTarget.Latest,true,kind);if(parsed.parseDiagnostics.length){for(const diagnostic of parsed.parseDiagnostics)console.error(ts.flattenDiagnosticMessageText(diagnostic.messageText,'\n'));fail(`syntax ${rel}`)}pass(`isolated syntax ${rel}`)}

const cssPairs=[
 ['components/angelcare360/customer-academic-authority/AcademicAuthorityActionDrawer.tsx','components/angelcare360/customer-academic-authority/AcademicAuthorityActionDrawer.module.css'],
 ['components/angelcare360/customer-academic-authority/PresenceDailyControl.tsx','components/angelcare360/customer-academic-authority/PresenceDailyControl.module.css'],
 ['components/angelcare360/customer-academic-authority/TimetableSchedulingAuthority.tsx','components/angelcare360/customer-academic-authority/TimetableSchedulingAuthority.module.css'],
 ['components/angelcare360/customer-academic-authority/AcademicLearningAuthority.tsx','components/angelcare360/customer-academic-authority/AcademicLearningAuthority.module.css'],
]
for(const [tsxRel,cssRel] of cssPairs){const source=read(tsxRel);const css=read(cssRel);const used=new Set([...source.matchAll(/styles\.([A-Za-z_][A-Za-z0-9_]*)/g)].map(x=>x[1]));const defined=new Set([...css.matchAll(/\.([A-Za-z_][A-Za-z0-9_-]*)/g)].map(x=>x[1]));const missing=[...used].filter(x=>!defined.has(x));if(missing.length)fail(`${tsxRel} missing CSS classes ${missing.join(', ')}`);pass(`CSS references ${tsxRel}`);if(/(^|})\s*\[[^}]+\]\s*\{/m.test(css))fail(`impure CSS selector in ${cssRel}`);pass(`CSS module purity ${cssRel}`)}

const generated=tsFiles.map(read).join('\n')
for(const marker of ['alert(','href="javascript:','TODO_ACTION','onClick={() => {}}','OverheadPanel'])lacks(generated,marker,`prohibited generated marker absent ${marker}`)
has(generated,'CustomerOverlayPortal','customer overlay portal used')
has(generated,"/api/angelcare360/customer-academic-authority",'real governed mutation endpoint used')
has(generated,'AcademicAuthorityPlaneRail','real plane navigation used')

const sql=read('supabase/migrations/20260802_angelcare360_customer_mz3_academic_authority.sql')
const tables=['angelcare360_attendance_correction_requests','angelcare360_attendance_day_closures','angelcare360_timetable_publication_runs','angelcare360_timetable_conflict_findings','angelcare360_timetable_revisions','angelcare360_grade_correction_requests','angelcare360_academic_validation_batches','angelcare360_average_computation_revisions','angelcare360_report_card_publication_runs']
for(const table of tables){has(sql,`create table if not exists public.${table}`,`SQL table ${table}`);has(sql,`'${table}'`,`RLS registry ${table}`)}
has(sql,'begin;','SQL transaction begin');has(sql,'commit;','SQL transaction commit');has(sql,'enable row level security','SQL RLS enabled');has(sql,'revoke all','direct browser access revoked')
for(const marker of ['drop table','truncate ','delete from'])lacks(sql.toLowerCase(),marker,`destructive SQL absent ${marker}`)

console.log(`\n${checks} surgical checks passed. Mega ZIP 3 Attendance, Timetable & Academic Authority is structurally accepted.`)
