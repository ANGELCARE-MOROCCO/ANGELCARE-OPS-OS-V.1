import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const mustExist = [
  'app/(protected)/hr/layout.tsx',
  'app/(protected)/hr/_components/HRUnifiedSidebar.tsx',
  'app/(protected)/hr/_components/HRProductionWorkspace.tsx',
  'app/api/hr/production-command/route.ts',
  'database/hr-production-readiness.sql',
  'app/(protected)/hr/page.tsx',
  'app/(protected)/hr/employees/page.tsx',
  'app/(protected)/hr/employees/[id]/page.tsx',
  'app/(protected)/hr/departments/page.tsx',
  'app/(protected)/hr/recruitment/page.tsx',
  'app/(protected)/hr/onboarding/page.tsx',
  'app/(protected)/hr/attendance/page.tsx',
  'app/(protected)/hr/work-schedules/page.tsx',
  'app/(protected)/hr/approvals/page.tsx',
  'app/(protected)/hr/documents/page.tsx',
  'app/(protected)/hr/compliance/page.tsx',
  'app/(protected)/hr/sync-center/page.tsx',
  'app/(protected)/hr/settings/page.tsx',
]

const approvedSidebarMissing = [
  'Dashboard','Employees','Teams & Departments','Recruitment','Onboarding','Performance','Learning & Development',
  'Attendance','Leave Management','Work Schedules','Time Tracking','Policies & Procedures','Documents','Compliance Dashboard','Integrations','Settings'
]
const forbiddenSidebar = ['Analytics','Reports','Alerts','Organization','Positions & Roles','Overtime & Approvals','Access & Permissions']
const blockers = []
function read(rel) { return fs.readFileSync(path.join(root, rel), 'utf8') }
function exists(rel) { return fs.existsSync(path.join(root, rel)) }
for (const rel of mustExist) if (!exists(rel)) blockers.push(`Missing required HR file: ${rel}`)

if (exists('app/(protected)/hr/_components/HRUnifiedSidebar.tsx')) {
  const sidebar = read('app/(protected)/hr/_components/HRUnifiedSidebar.tsx')
  for (const label of approvedSidebarMissing) if (!sidebar.includes(label)) blockers.push(`Unified sidebar missing approved label: ${label}`)
  for (const label of forbiddenSidebar) if (sidebar.includes(label)) blockers.push(`Unified sidebar still contains removed label: ${label}`)
}

if (exists('app/(protected)/hr/_components/HRProductionWorkspace.tsx')) {
  const ui = read('app/(protected)/hr/_components/HRProductionWorkspace.tsx')
  const requiredFragments = ['fetch(\'/api/hr/production-command', 'method === \'POST\'', 'persist(\'PATCH\'', 'persist(\'DELETE\'', 'doPrint', 'selectedRows', 'openCreate', 'openEdit', 'Create live record', 'Save live']
  for (const frag of requiredFragments) if (!ui.includes(frag)) blockers.push(`HRProductionWorkspace missing execution fragment: ${frag}`)
  const banned = ['TODO', 'coming soon', 'alert(\'TODO', 'console.log(\'todo', 'demoOnly']
  for (const frag of banned) if (ui.toLowerCase().includes(frag.toLowerCase())) blockers.push(`HRProductionWorkspace contains blocker placeholder: ${frag}`)
}

if (exists('app/api/hr/production-command/route.ts')) {
  const api = read('app/api/hr/production-command/route.ts')
  for (const name of ['GET','POST','PATCH','DELETE']) if (!api.includes(`export async function ${name}`)) blockers.push(`Production command API missing ${name}`)
  for (const frag of ['createClient', 'insert', 'update', 'delete', 'NextResponse.json({ ok: false', 'hr_audit_logs']) if (!api.includes(frag)) blockers.push(`Production command API missing ${frag}`)
  if (api.includes('return NextResponse.json({ ok: true })')) blockers.push('Production command API contains placeholder success return')
}

if (exists('database/hr-production-readiness.sql')) {
  const sql = read('database/hr-production-readiness.sql')
  for (const table of ['hr_staff_profiles','hr_roster_shifts','hr_onboarding_tasks','hr_leave_requests','hr_documents','hr_settings','hr_audit_logs']) if (!sql.includes(`create table if not exists public.${table}`)) blockers.push(`Migration missing table: ${table}`)
  if (/drop\s+table|truncate\s+table|delete\s+from/i.test(sql)) blockers.push('Migration contains destructive SQL')
}

const routeRefs = new Set()
for (const rel of ['app/(protected)/hr/_components/HRUnifiedSidebar.tsx','app/(protected)/hr/_components/HRProductionWorkspace.tsx']) {
  if (!exists(rel)) continue
  const text = read(rel)
  for (const m of text.matchAll(/href=["'`]([^"'`]+)["'`]/g)) {
    const href = m[1]
    if (href.startsWith('/hr')) routeRefs.add(href.split('?')[0].replace(/\/$/, ''))
  }
}
for (const href of routeRefs) {
  const rel = href === '/hr' ? 'app/(protected)/hr/page.tsx' : `app/(protected)${href}/page.tsx`
  if (!exists(rel)) blockers.push(`HR route reference has no page: ${href} -> ${rel}`)
}

if (blockers.length) {
  console.error('HR PRODUCTION READINESS VERIFY FAILED')
  for (const b of blockers) console.error(`✗ ${b}`)
  process.exit(1)
}
console.log('HR PRODUCTION READINESS VERIFY PASSED')
console.log(`✓ ${mustExist.length} required HR files present`)
console.log('✓ unified sidebar labels verified')
console.log('✓ production workspace CRUD/bulk/print controls verified')
console.log('✓ production command API methods verified')
console.log('✓ idempotent HR migration verified')
console.log('✓ visible HR route references resolved')
