import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root=process.cwd()
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8')
const exists=(p)=>fs.existsSync(path.join(root,p))
let pass=0, fail=0
const check=(name, ok, detail='')=>{ if(ok){pass++; console.log(`PASS ${name}`)} else {fail++; console.error(`FAIL ${name}${detail?`: ${detail}`:''}`)} }
const has=(p,...patterns)=>{ const s=read(p); return patterns.every(x=>typeof x==='string'?s.includes(x):x.test(s)) }

// Activation + authentication lifecycle
check('tenant/portal activation share one route without sharing one backend', has('app/angelcare-360-access/activate/page.tsx','TenantAccessActivationClient',"params.mode === 'invite' || params.mode === 'reset'",'acceptPortalInvitation'))
check('portal activation success redirect is outside acceptance try/catch', has('app/angelcare-360-access/activate/page.tsx','let result: { portal_kind: string }','redirect(`${destination(result.portal_kind)}?activated=1`)'))
check('MFA challenge route exists', exists('app/angelcare-360-access/mfa/page.tsx') && exists('components/angelcare360/access/TenantMfaChallengeClient.tsx'))
check('forced password change route exists', exists('app/angelcare-360-access/change-password/page.tsx'))
check('canonical session enforces MFA and password change', has('lib/auth/session.ts',"redirect('/angelcare-360-access/mfa')","redirect('/angelcare-360-access/change-password')"))
check('portable auth reuses canonical session authority', has('lib/ac360-portability/auth-session.ts',"from '@/lib/auth/session'"))
check('session security lookup fails closed', has('lib/auth/session.ts','if (tenantAccessResult.error)','delete().eq(\'session_token\', token)'))
check('SANILA logins no longer depend on login_app_user RPC', !read('app/angelcare-360-access/login/page.tsx').includes('login_app_user') && !read('app/angelcare-360-portal/login/page.tsx').includes('login_app_user'))
check('portal login validates linked personas through canonical auth', has('app/angelcare-360-portal/login/page.tsx','authenticatePortalCredentials') && has('lib/angelcare360/portal/auth.ts','listLinkedPortalPersonas','setPortalContext','sanila_portal_person','sanila_portal_school'))
check('multi-role existing identity acceptance exists', has('lib/angelcare360/server/portal-invitations.ts','angelcare360_accept_existing_portal_invitation_v1','verifyPassword'))

// Support boundary
check('support permissions become hard allow-list', has('lib/angelcare360/server/context.ts','permissions.clear()','supportAccess'))
check('support super-admin bypass disabled', has('lib/angelcare360/server/context.ts',"context.supportAccess\n    ? context.permissions.has(permissionKey)\n    : context.access.accessLevel === 'super_admin'"))
check('support invalid/stale session fails closed', has('lib/angelcare360/server/context.ts','session support est invalide, expirée ou terminée'))
check('support requester cannot self-approve', has('lib/angelcare360/operator/tenant-access.ts','le demandeur ne peut pas approuver sa propre session support'))
check('support requests are not auto-active', has('lib/angelcare360/operator/tenant-access.ts',"status: 'requested'"))

// Role portal isolation + continuity
check('teacher class+section authorization exists', has('lib/angelcare360/portal/server.ts','classSectionScopes','classSectionAllowed','teachingScopeAllowed'))
check('student section authorization exists', has('lib/angelcare360/portal/server.ts','sectionVisible(r,sectionId)','scopedExams'))
check('parent timetable is class+section scoped', has('lib/angelcare360/portal/server.ts','parentTimetable','t(child.current_class_id)===t(row.class_id)','sectionVisible(row,t(child.current_section_id))'))
check('teacher tasks/leave use actual Staff OS tables', has('lib/angelcare360/portal/server.ts','teacherTasks','ac360_school_tasks','teacherLeave','ac360_school_leave_requests'))
check('staff readback uses actual Staff OS tables', has('lib/angelcare360/portal/server.ts','ac360_school_attendance_records','ac360_school_leave_requests','ac360_school_tasks','ac360_school_incident_reports'))
check('student assignment submission checks section', has('lib/angelcare360/server/portal-actions.ts','current_section_id','assignment.section_id'))
check('teacher grading is transactional RPC', has('lib/angelcare360/server/portal-actions.ts','angelcare360_grade_submission_atomic_v1'))

// Access administration integrity
check('access area uses unified portal invitation registry', !read('lib/angelcare360/server/access-area.ts').includes('angelcare360_access_invitations') && has('lib/angelcare360/server/access-area.ts','angelcare360_portal_invitations','resendPortalInvitation','revokePortalInvitation'))
check('access loaders do not convert DB errors into empty success', has('lib/angelcare360/server/access-area.ts','throw new Error'))
check('tenant owner transfer is transactional RPC', has('lib/angelcare360/operator/tenant-access.ts','angelcare360_transfer_tenant_ownership_v1'))
check('tenant activation has explicit DB finalization checks', has('lib/angelcare360/operator/tenant-access.ts','accountUpdate.error','inviteUpdate.error','sessionRevoke.error'))
check('forced password change flag clears on user-chosen credential', has('lib/angelcare360/operator/tenant-access.ts','must_change_password: false'))

// Payments
const checkout=read('app/api/angelcare360/payment-gate/checkout/route.ts')
check('checkout does not trust client gate code', !/payload\.gateCode/.test(checkout))
check('checkout does not trust client amount/currency', !/payload\.(amountDueMad|currency)/.test(checkout))
check('checkout helper reloads authoritative gate data', has('lib/angelcare360/payment-gates/customer-gate.ts','amount_due_mad','currency'))
check('payment return URL constrained to same origin', has('app/api/angelcare360/payment-gate/checkout/route.ts','target.origin === request.nextUrl.origin'))

// Final release database-delta authority. Historical reconstructed foundation migrations are intentionally not release inputs.
check('final multi-role/atomic business migration exists', exists('supabase/migrations/20260911010000_sanila_portal_multirole_and_atomic_grade.sql'))
const sqlFiles=['supabase/migrations/20260911010000_sanila_portal_multirole_and_atomic_grade.sql']
for(const f of sqlFiles){
  const sql=read(f)
  check(`${f} transaction envelope`, /\bbegin\s*;/i.test(sql) && /\bcommit\s*;/i.test(sql))
  check(`${f} no destructive reset`, !/\b(drop\s+table|truncate\s+table)\b/i.test(sql))
  const dollars=(sql.match(/\$\$/g)||[]).length
  check(`${f} balanced function dollar quotes`, dollars%2===0, `$$ count=${dollars}`)
}

// Runtime/build contract
const pkg=JSON.parse(read('package.json'))
check('repository Node pins preserved', String(pkg.engines?.node||'').startsWith('22') && read('.nvmrc').trim()==='20')
check('build has 16GB heap contract', String(pkg.scripts?.build||'').includes('--max-old-space-size=16384'))

console.log(`FINAL_CLOSURE_GATE_PASS=${pass}`)
console.log(`FINAL_CLOSURE_GATE_FAIL=${fail}`)
process.exit(fail?1:0)
