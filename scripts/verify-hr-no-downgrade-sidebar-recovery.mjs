#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8')
const exists = (p) => fs.existsSync(path.join(root, p))
const fail = []
const ok = []
const assert = (condition, message) => condition ? ok.push(message) : fail.push(message)

const forbiddenSidebarLabels = [
  'Analytics',
  'Reports',
  'Alerts',
  'Organization',
  'Positions & Roles',
  'Overtime & Approvals',
  'Access & Permissions',
]

const approvedLabels = [
  'Dashboard',
  'Employees',
  'Teams & Departments',
  'Recruitment',
  'Onboarding',
  'Performance',
  'Learning & Development',
  'Attendance',
  'Leave Management',
  'Work Schedules',
  'Time Tracking',
  'Policies & Procedures',
  'Documents',
  'Compliance Dashboard',
  'Integrations',
  'Settings',
]

const protectedFiles = [
  'app/components/erp/AppShell.tsx',
  'app/(protected)/hr/page.tsx',
  'app/(protected)/hr/_components/HRCommandScreens.tsx',
  'app/(protected)/hr/employees/_components/EmployeesCommandCenter.tsx',
  'app/(protected)/hr/recruitment/page.tsx',
  'app/(protected)/hr/recruitment/interviews/page.tsx',
  'app/(protected)/hr/training/page.tsx',
  'app/(protected)/hr/departments/page.tsx',
  'app/(protected)/hr/work-schedules/page.tsx',
  'lib/hr-production/navigation.ts',
]

for (const file of protectedFiles) {
  assert(exists(file), `${file} exists`)
}

const allHrFiles = []
function walk(dir) {
  if (!exists(dir)) return
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (/\.(tsx|ts|js|mjs)$/.test(entry.name)) allHrFiles.push(full)
  }
}
walk('app/(protected)/hr')
walk('components/hr')
walk('components/hr-production')
walk('lib/hr-production')

for (const file of allHrFiles) {
  const content = read(file)
  assert(!content.includes('HRProductionWorkspace'), `${file} does not import/use generic downgrade workspace`)
}
assert(!exists('app/(protected)/hr/_components/HRProductionWorkspace.tsx'), 'generic HRProductionWorkspace file is not present')
assert(!exists('app/api/hr/production-command/route.ts'), 'generic one-size production-command API is not present')
assert(!exists('database/hr-production-readiness.sql'), 'parallel fallback HR readiness migration is not present')

function extractBlock(content, startNeedle, endNeedle) {
  const start = content.indexOf(startNeedle)
  if (start < 0) return ''
  const end = endNeedle ? content.indexOf(endNeedle, start + startNeedle.length) : -1
  return end > start ? content.slice(start, end) : content.slice(start, Math.min(content.length, start + 3200))
}

const sidebarScopes = {
  'app/components/erp/AppShell.tsx': ['const HR_NAV_GROUPS', 'const HR_QUICK_CREATE'],
  'app/(protected)/hr/page.tsx': ['const sidebarGroups', 'const quickActions'],
  'app/(protected)/hr/_components/HRCommandScreens.tsx': ['const sidebarGroups', 'const screenMeta'],
  'app/(protected)/hr/employees/_components/EmployeesCommandCenter.tsx': ['const sidebarGroups', 'type EmployeeFormState'],
  'app/(protected)/hr/recruitment/page.tsx': ['const sidebarGroups', 'function text'],
  'app/(protected)/hr/recruitment/interviews/page.tsx': ['const sidebarGroups', 'const text'],
  'app/(protected)/hr/training/page.tsx': ['const sidebarGroups', 'function s'],
  'app/(protected)/hr/departments/page.tsx': ['const sidebarGroups', 'function text'],
  'app/(protected)/hr/work-schedules/page.tsx': ['function HRSidebar()', 'function StatCard'],
  'lib/hr-production/navigation.ts': ['export const HR_PRODUCTION_NAV', 'export function'],
}

for (const [file, [start, end]] of Object.entries(sidebarScopes)) {
  const content = read(file)
  const scope = extractBlock(content, start, end)
  assert(Boolean(scope), `${file} has a detectable sidebar/nav scope`)
  for (const label of forbiddenSidebarLabels) {
    assert(!scope.includes(label), `${file} sidebar/nav does not expose forbidden label: ${label}`)
  }
}

const appShell = read('app/components/erp/AppShell.tsx')
assert(appShell.includes('const HR_NAV_GROUPS'), 'AppShell has HR-specific navigation override')
assert(appShell.includes("pathname === '/hr' || pathname.startsWith('/hr/')"), 'AppShell detects HR workspace routes')
for (const label of approvedLabels) {
  assert(appShell.includes(`label: '${label}'`) || appShell.includes(`label: "${label}"`), `AppShell HR menu includes ${label}`)
}

const screenshotRoutes = {
  'app/(protected)/hr/performance-matrix/page.tsx': 'performance',
  'app/(protected)/hr/approvals/page.tsx': 'leave',
  'app/(protected)/hr/workforce-ops/page.tsx': 'time',
  'app/(protected)/hr/documents/page.tsx': 'documents',
  'app/(protected)/hr/compliance/page.tsx': 'compliance',
  'app/(protected)/hr/sync-center/page.tsx': 'sync',
  'app/(protected)/hr/settings/page.tsx': 'settings',
}
for (const [file, variant] of Object.entries(screenshotRoutes)) {
  const content = read(file)
  assert(content.includes('HRCommandScreens'), `${file} preserves rich HRCommandScreens UI`) 
  assert(content.includes(`variant="${variant}"`), `${file} preserves ${variant} screenshot variant`)
}

const legacyRedirects = {
  'app/(protected)/hr/analytics/page.tsx': '/hr',
  'app/(protected)/hr/reports/page.tsx': '/hr/documents',
  'app/(protected)/hr/alerts/page.tsx': '/hr/sync-center',
  'app/(protected)/hr/notifications/page.tsx': '/hr/sync-center',
  'app/(protected)/hr/organization/page.tsx': '/hr/departments',
  'app/(protected)/hr/positions/page.tsx': '/hr/settings',
  'app/(protected)/hr/overtime-approvals/page.tsx': '/hr/approvals',
  'app/(protected)/hr/access/page.tsx': '/hr/settings',
  'app/(protected)/hr/permissions/page.tsx': '/hr/settings',
}
for (const [file, target] of Object.entries(legacyRedirects)) {
  const content = read(file)
  assert(content.includes('redirect') && content.includes(target), `${file} redirects to approved HR route ${target}`)
}

const approvedRoutes = [
  'app/(protected)/hr/page.tsx',
  'app/(protected)/hr/employees/page.tsx',
  'app/(protected)/hr/departments/page.tsx',
  'app/(protected)/hr/recruitment/page.tsx',
  'app/(protected)/hr/onboarding/page.tsx',
  'app/(protected)/hr/performance-matrix/page.tsx',
  'app/(protected)/hr/training/page.tsx',
  'app/(protected)/hr/attendance/page.tsx',
  'app/(protected)/hr/approvals/page.tsx',
  'app/(protected)/hr/work-schedules/page.tsx',
  'app/(protected)/hr/workforce-ops/page.tsx',
  'app/(protected)/hr/templates/page.tsx',
  'app/(protected)/hr/documents/page.tsx',
  'app/(protected)/hr/compliance/page.tsx',
  'app/(protected)/hr/sync-center/page.tsx',
  'app/(protected)/hr/settings/page.tsx',
]
for (const file of approvedRoutes) assert(exists(file), `${file} approved route exists`)

if (fail.length) {
  console.error('HR NO-DOWNGRADE SIDEBAR RECOVERY VERIFY FAILED')
  for (const item of fail) console.error('✗ ' + item)
  console.error(`\n${ok.length} checks passed before failure.`)
  process.exit(1)
}

console.log('HR NO-DOWNGRADE SIDEBAR RECOVERY VERIFY PASSED')
for (const item of ok) console.log('✓ ' + item)
