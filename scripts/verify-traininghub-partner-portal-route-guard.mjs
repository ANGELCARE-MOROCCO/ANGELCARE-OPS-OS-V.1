import fs from 'node:fs'
const files={page:'app/traininghub/page.tsx',guard:'components/traininghub/auth/TrainingHubPartnerRouteGuard.tsx',route:'app/api/traininghub/auth/entry-route/route.ts'}
const page=fs.existsSync(files.page)?fs.readFileSync(files.page,'utf8'):''
const guard=fs.existsSync(files.guard)?fs.readFileSync(files.guard,'utf8'):''
const route=fs.existsSync(files.route)?fs.readFileSync(files.route,'utf8'):''
const checks=[
 ['admin page exists',fs.existsSync(files.page)],['route guard component exists',fs.existsSync(files.guard)],['entry route API exists',fs.existsSync(files.route)],['admin page imports guard',page.includes('TrainingHubPartnerRouteGuard')],['admin page renders guard',page.includes('<TrainingHubPartnerRouteGuard />')],['guard checks current logged-in user',guard.includes('supabase.auth.getUser')],['guard redirects partner away from admin',guard.includes("window.location.replace('/traininghub/partner')")],['API resolves profile by auth/email',route.includes('core_user_profiles')&&route.includes('auth_user_id')&&route.includes('ilike')],['API resolves membership by profile/auth',route.includes('core_memberships')&&route.includes('profile_id')],['API resolves RBAC role rows',route.includes('authz_user_role_assignments')&&route.includes('resolveRoleRows')],['partner precedence over admin route',route.includes('partner_context_takes_partner_portal_precedence')||route.includes('partner_only_account')]
]
console.table(checks.map(([name,pass])=>({name,pass})))
if(checks.some(([,pass])=>!pass)){console.error('TrainingHub partner portal route guard verification FAILED.');process.exit(1)}
console.log('TrainingHub partner portal route guard verification PASSED.')
