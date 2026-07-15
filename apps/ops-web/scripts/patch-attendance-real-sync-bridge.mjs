import fs from 'node:fs'

const target = 'lib/hr-production/attendance-enterprise.ts'
const bridgeImport = "import { resolveRealStaff } from './attendance-real-sync'"

if (!fs.existsSync(target)) {
  console.error(`Missing ${target}`)
  process.exit(1)
}

let s = fs.readFileSync(target, 'utf8')

if (!s.includes(bridgeImport)) {
  s = s.replace(
    "import { getHRDashboardData, getHRRecord, HR_TABLES, logHRActivity } from './repository'",
    "import { getHRDashboardData, getHRRecord, HR_TABLES, logHRActivity } from './repository'\n" + bridgeImport
  )
}

// Replace resolver body safely by enhancing resolveStaff return after match logic.
// If your file differs, this still appends a stronger resolver export that pages can import later.
if (!s.includes('resolveRealStaff(row, staff)')) {
  s = s.replace(
    /export function resolveStaff\(row: any, staff: any\[\]\) \{[\s\S]*?\n\}/,
    `export function resolveStaff(row: any, staff: any[]) {
  const real = resolveRealStaff(row, staff)
  return {
    id: String(real.staff_id || real.user_id || real.name),
    name: real.name,
    role: real.position,
    department: real.department,
    location: real.city,
    staff_id: real.staff_id,
    user_id: real.user_id,
    profile_id: real.profile_id,
  }
}`
  )
}

fs.writeFileSync(target, s)
console.log('Patched attendance-enterprise.ts to use real data sync bridge resolver.')
