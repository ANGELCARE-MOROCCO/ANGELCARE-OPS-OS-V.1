import fs from 'node:fs'

const file = 'app/(protected)/hr/page.tsx'

if (!fs.existsSync(file)) {
  console.error('Missing app/(protected)/hr/page.tsx')
  process.exit(1)
}

let s = fs.readFileSync(file, 'utf8')

// 1) Force replace the invalid TypeScript property everywhere.
s = s.replaceAll(
  'metrics.unvalidatedAttendance',
  'Math.max(0, (metrics.attendanceRecords || 0) - (metrics.validatedAttendance || 0))'
)

// 2) Also handle optional chaining or cast variants if they exist.
s = s.replaceAll(
  'metrics?.unvalidatedAttendance',
  'Math.max(0, (metrics.attendanceRecords || 0) - (metrics.validatedAttendance || 0))'
)

s = s.replaceAll(
  '(metrics as any).unvalidatedAttendance',
  'Math.max(0, (metrics.attendanceRecords || 0) - (metrics.validatedAttendance || 0))'
)

fs.writeFileSync(file, s)
console.log('Force-patched unvalidatedAttendance in app/(protected)/hr/page.tsx')
