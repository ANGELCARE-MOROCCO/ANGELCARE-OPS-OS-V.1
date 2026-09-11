import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
let pass = 0
let fail = 0
const failures = []
function read(rel){ return fs.readFileSync(path.join(root,rel),'utf8') }
function exists(rel){ return fs.existsSync(path.join(root,rel)) }
function ok(name, cond, detail=''){
  if(cond){ pass++; console.log(`PASS  ${name}`) }
  else { fail++; failures.push(`${name}${detail?`: ${detail}`:''}`); console.error(`FAIL  ${name}${detail?` — ${detail}`:''}`) }
}
function filesUnder(rel, basename='page.tsx'){
  const base=path.join(root,rel); const out=[]
  const walk=(dir)=>{ for(const entry of fs.readdirSync(dir,{withFileTypes:true})){ const p=path.join(dir,entry.name); if(entry.isDirectory()) walk(p); else if(entry.isFile()&&entry.name===basename) out.push(path.relative(root,p)) } }
  if(fs.existsSync(base)) walk(base)
  return out.sort()
}
function includesAll(text, needles){ return needles.every(n=>text.includes(n)) }

const portalServer=read('lib/angelcare360/portal/server.ts')
const portalAuth=read('lib/angelcare360/portal/auth.ts')
const portalPolicy=read('lib/angelcare360/portal/policy.ts')
const portalActions=read('lib/angelcare360/server/portal-actions.ts')
const portalInvites=read('lib/angelcare360/server/portal-invitations.ts')
const commandKernel=read('lib/angelcare360/server/enterprise-command-kernel.ts')
const actionPanel=read('components/angelcare360/role-portals/PortalActionPanel.tsx')
const attendanceRegister=read('components/angelcare360/role-portals/TeacherAttendanceRegister.tsx')
const portalExperience=read('components/angelcare360/role-portals/PortalExperience.tsx')
const portalRecordList=read('components/angelcare360/role-portals/PortalRecordList.tsx')
const roleShell=read('components/angelcare360/role-portals/RolePortalShell.tsx')
const nav=read('data/angelcare360/role-portals.ts')

// 1. Route universe and route-to-loader authority.
const roleSpecs={
  teacher:{dir:'app/angelcare-360-teacher',count:14,loader:'getTeacherPortalSnapshot',kind:'teacher'},
  parent:{dir:'app/angelcare-360-parent',count:15,loader:'getParentPortalSnapshot',kind:'parent'},
  student:{dir:'app/angelcare-360-student',count:15,loader:'getStudentPortalSnapshot',kind:'student'},
  staff:{dir:'app/angelcare-360-staff',count:13,loader:'getStaffPortalSnapshot',kind:'staff'},
}
for(const [role,spec] of Object.entries(roleSpecs)){
  const pages=filesUnder(spec.dir).filter(f=>!f.includes('/login/'))
  ok(`${role} route count ${spec.count}`, pages.length===spec.count, `found=${pages.length}`)
  for(const file of pages){ const t=read(file); ok(`${file} uses ${spec.loader}`, t.includes(spec.loader+'(')) }
  const layout=`${spec.dir}/layout.tsx`; ok(`${role} layout protected by portal identity`, exists(layout)&&read(layout).includes(`requirePortalIdentity('${spec.kind}')`))
}

// 2. Canonical security chain.
ok('portal identity enters canonical requireUser gate', portalServer.includes('await requireUser('))
ok('portal identity does not directly use weak getCurrentAppUser', !/requirePortalIdentity[\s\S]{0,2200}getCurrentAppUser\(/.test(portalServer))
ok('portal login uses canonical credential authority', portalAuth.includes('authenticatePortalCredentials'))
ok('reachable role auth has no login_app_user RPC', ![portalAuth,portalServer,...Object.keys(roleSpecs).map(r=>read(`app/angelcare-360-${r}/login/page.tsx`))].some(t=>t.includes('login_app_user')))
ok('portal context binds kind/person/school cookies', includesAll(portalAuth,['sanila_portal_kind','sanila_portal_person','sanila_portal_school']))
ok('logout clears portal context cookies', includesAll(roleShell,['sanila_portal_kind','sanila_portal_person','sanila_portal_school']))
ok('logout handles canonical cookie domain', roleShell.includes('APP_SESSION_COOKIE_DOMAIN'))

// 3. Multi-role / multi-school resolution.
ok('portal selector route exists', exists('app/angelcare-360-portal/select/page.tsx'))
const selector=read('app/angelcare-360-portal/select/page.tsx')
ok('selector carries person id and school id', includesAll(selector,['personId','schoolId']))
ok('portal persona resolver binds selected person and school', includesAll(portalServer,["cookieStore.get('sanila_portal_person')","cookieStore.get('sanila_portal_school')","personQuery=personQuery.eq('id',selectedPerson)","personQuery=personQuery.eq('school_id',selectedSchool)"]))
ok('no first-school fallback in selected portal context', !/personas\.find\(\s*persona\s*=>\s*persona\.kind\s*===/.test(read('app/angelcare-360-portal/login/page.tsx')))

// 4. Parent relationship authority is executable.
ok('parent policy enforces guardian', portalPolicy.includes("capability === 'guardian'")&&portalPolicy.includes('policy.isGuardian || policy.isPrimary'))
ok('parent policy enforces can_pay_fees', portalPolicy.includes('can_pay_fees'))
ok('parent policy enforces can_pickup', portalPolicy.includes('can_pickup'))
ok('parent policy enforces can_receive_messages', portalPolicy.includes('can_receive_messages'))
ok('attendance justification requires guardian authority', /attendance\.justify[\s\S]{0,1500}requireParentChildCapability\([^)]*'guardian'\)/.test(portalActions))
ok('parent pickup requires pickup authority', portalActions.includes("assertPickupCandidate(client,schoolId,personId,studentId,authorizedPersonId)")&&/assertPickupCandidate[\s\S]{0,700}requireParentChildCapability\(client,schoolId,parentId,studentId,'pickup'\)/.test(portalActions))
ok('parent finance loader applies fee authority', portalServer.includes('canPayFees'))
ok('parent messaging loader applies messaging authority', portalServer.includes('canReceiveMessages'))

// 5. Dedicated portal provisioning / role invariant.
for(const kind of ['teacher','parent','student','staff']) ok(`dedicated ${kind} invitation supported`, portalInvites.includes(`'${kind}'`))
ok('invitation resolves effective portal role', portalInvites.includes('resolveEffectivePortalRole'))
ok('teacher invitation requires operational permissions', includesAll(portalInvites,['academics.create','presences.update','messagerie.create']))
ok('activation does not accept unusable dedicated persona role', portalInvites.includes('const roleId=await resolveEffectivePortalRole')&&portalInvites.includes('Aucun rôle actif ne satisfait le contrat opérationnel'))

// 6. Exact teacher scope and workday.
ok('teacher exact assignment resolver exists', portalActions.includes('exactTeacherAssignment'))
ok('teacher assignment scope includes section', /exactTeacherAssignment[\s\S]{0,1800}section_id/.test(portalActions))
ok('teacher batch attendance validates enrollment section', /attendance\.batch[\s\S]{0,3500}section_id/.test(portalActions))
for(const action of ['attendance.batch','lesson.create','lesson.update','assignment.create','assignment.update','submission.grade','exam.create','exam.update','mark.upsert','comment.create','task.update','leave.request','family.message']) ok(`teacher backend action ${action}`, portalActions.includes(`action==='${action}'`))
ok('teacher attendance operational UI exists', attendanceRegister.includes("action:'attendance.batch'"))

// 7. Parent / student / staff operational action depth.
for(const action of ['request.create','attendance.justify','meeting.create','meeting.cancel','satisfaction.submit','feedback.submit','pickup.request','pickup.revoke','teacher.message','account.update']) ok(`parent backend action ${action}`, portalActions.includes(`action==='${action}'`))
for(const action of ['assignment.submit','teacher.message']) ok(`student backend action ${action}`, portalActions.includes(`action==='${action}'`))
for(const action of ['staff.message','task.update','workflow.transition','approval.decide','incident.create','incident.update']) ok(`staff backend action ${action}`, portalActions.includes(`action==='${action}'`))
ok('shared message reply action exists', portalActions.includes("action==='message.reply'"))

// 8. UI action -> backend parity.
const uiActions=[...actionPanel.matchAll(/action:'([^']+)'/g)].map(m=>m[1])
const backendActions=new Set([...portalActions.matchAll(/action==='([^']+)'/g)].map(m=>m[1]))
for(const action of new Set(uiActions)) ok(`UI action has backend: ${action}`, backendActions.has(action), 'missing backend branch')
ok('batch attendance UI has backend', attendanceRegister.includes("action:'attendance.batch'")&&backendActions.has('attendance.batch'))

// 9. No permanent-empty visible portal datasets / silent truncation.
const forbiddenEmpty=['meetings','satisfaction','pickup','feedback','approvals','tasks','leave','workflows','tickets','team']
for(const key of forbiddenEmpty) ok(`no hardcoded visible empty dataset ${key}`, !new RegExp(`\\b${key}\\s*:\\s*\\[\\]`).test(portalServer))
ok('role record renderer has no 100-row truncation', !portalExperience.includes('slice(0,100)')&&!portalRecordList.includes('slice(0,100)'))
ok('large role collections have search', portalRecordList.includes('Rechercher')&&portalRecordList.includes('const visible=useMemo'))
ok('large role collections have status filter', portalRecordList.includes('status'))

// 10. Documents and governed student attachments.
ok('portal document endpoint exists', exists('app/api/angelcare360/portal-documents/route.ts'))
ok('student attachment endpoint exists', exists('app/api/angelcare360/portal-assignment-attachments/route.ts'))
const docs=read('lib/angelcare360/portal/documents.ts')
ok('teacher assignment attachment authorization is assignment scoped', includesAll(docs,['assignment_id','teacher','student_id']))
ok('parent document authorization uses relationship authority', docs.includes('requireParentChildCapability'))
ok('student attachment finalization is explicit', /assignment\.submit[\s\S]{0,6000}status:'active'/.test(portalActions))
ok('student attachment failure has compensation', /assignment\.submit[\s\S]{0,6500}delete\(\)/.test(portalActions))

// 11. Cross-universe canonical entity coupling.
const couplings=[
  ['attendance teacher write',portalActions,'angelcare360_attendance_records'],
  ['attendance parent read',portalServer,'angelcare360_attendance_records'],
  ['attendance student read',portalServer,'angelcare360_attendance_records'],
  ['assignment teacher write',portalActions,'angelcare360_assignments'],
  ['assignment parent/student read',portalServer,'angelcare360_assignments'],
  ['submission student write',portalActions,'angelcare360_assignment_submissions'],
  ['submission teacher/student read',portalServer,'angelcare360_assignment_submissions'],
  ['marks teacher write/read',portalActions,'angelcare360_marks'],
  ['marks parent/student read',portalServer,'angelcare360_marks'],
  ['leave canonical HR request',portalActions,'createAc360LeaveRequest'],
  ['leave portal readback',portalServer,'ac360_school_leave_requests'],
  ['message write canonical',portalActions,'angelcare360_messages'],
  ['message recipient write canonical',portalActions,'angelcare360_message_recipients'],
  ['message portal readback',portalServer,'angelcare360_message_recipients'],
]
for(const [name,text,needle] of couplings) ok(name,text.includes(needle))

// 12. Workflow and task state authority.
ok('workflow ownership uses owner_app_user_id', portalServer.includes('owner_app_user_id')&&portalActions.includes('owner_app_user_id'))
ok('workflow key uses canonical workflow_key', portalServer.includes('workflow_key'))
ok('workflow transition checks definition schema', commandKernel.includes('workflowTransitionAllowed'))
ok('workflow transition compare-and-swap', commandKernel.includes("eq('current_state', current.data.current_state)"))
ok('workflow transition compensates journal failure', commandKernel.includes('compensation')||commandKernel.includes('Transition annulée'))
ok('teacher/staff task state machine includes in_progress and blocked', includesAll(portalActions,["'in_progress'","'blocked'","task.update"]))

// 13. Exact school binding into enterprise command permissions.
ok('portal actions pass exact schoolId to enterprise command', /executeAngelcare360EnterpriseCommand\(\{[\s\S]{0,300}schoolId/.test(portalActions))
ok('enterprise command permission uses explicit schoolId', commandKernel.includes("schoolId: options.schoolId || null"))

// 14. Operator/Tenant authority estate.
const tenantPages=filesUnder('app/(protected)/angelcare-360-command-center')
ok('tenant command center has expected 195 routes',tenantPages.length===195,`found=${tenantPages.length}`)
for(const f of tenantPages) ok(`tenant route guarded ${f}`, read(f).includes('requireAngelcare360RouteAccess('))
const operatorPages=filesUnder('app/(protected)/angelcare-360-operator')
ok('operator estate has expected 59 routes',operatorPages.length===59,`found=${operatorPages.length}`)
const operatorLayout=read('app/(protected)/angelcare-360-operator/layout.tsx'); ok('operator parent layout requires authenticated operator session',operatorLayout.includes('requireAngelcare360OperatorSession()')); for(const f of operatorPages){ const t=read(f); ok(`operator route inside authenticated operator estate ${f}`, f.startsWith('app/(protected)/angelcare-360-operator/') && (operatorLayout.includes('requireAngelcare360OperatorSession()') || t.includes('requireAngelcare360OperatorSession') || t.includes('requireAngelcare360OperatorPermission'))) }

// 15. Product truth / residue signals.
const scopedFiles=[
  ...Object.values(roleSpecs).flatMap(s=>filesUnder(s.dir)),
  'components/angelcare360/role-portals/PortalExperience.tsx',
  'components/angelcare360/role-portals/PortalActionPanel.tsx',
  'components/angelcare360/role-portals/TeacherAttendanceRegister.tsx',
  'lib/angelcare360/portal/server.ts','lib/angelcare360/portal/auth.ts','lib/angelcare360/portal/policy.ts','lib/angelcare360/portal/documents.ts','lib/angelcare360/server/portal-actions.ts','data/angelcare360/role-portals.ts'
]
for(const f of scopedFiles){ const t=read(f); ok(`no TODO/FIXME/coming-soon residue ${f}`, !/(?:\/\/|\/\*|^\s*\*)[^\n]*(?:\bTODO\b|\bFIXME\b|coming soon|coming_soon|à venir|bientôt)/im.test(t)) }
ok('portal UI exposes source failures instead of fake empty success', portalExperience.includes('sourceWarnings'))
ok('portal server propagates warnings', portalServer.includes('sourceWarnings:warnings'))

console.log(`\nSANILA_PRODUCT_CONTRACT_PASS=${pass}`)
console.log(`SANILA_PRODUCT_CONTRACT_FAIL=${fail}`)
if(fail){ console.error('\nFAILURES'); failures.forEach(x=>console.error(`- ${x}`)); process.exit(1) }
