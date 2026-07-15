import fs from 'node:fs'

const file = 'lib/hr-unified/route-restore-data.ts'

if (!fs.existsSync(file)) {
  console.error('Missing lib/hr-unified/route-restore-data.ts')
  process.exit(1)
}

let s = fs.readFileSync(file, 'utf8')

// Avoid strict dependency on a missing HRDashboardData field.
// Keep legacy snake_case alias but safely read from any-compatible data.
s = s.replaceAll(
  'attendance_corrections: data.attendanceCorrections,',
  'attendance_corrections: (data as any).attendanceCorrections || (data as any).attendance_corrections || [],'
)

fs.writeFileSync(file, s)
console.log('Patched route-restore-data attendanceCorrections fallback')
