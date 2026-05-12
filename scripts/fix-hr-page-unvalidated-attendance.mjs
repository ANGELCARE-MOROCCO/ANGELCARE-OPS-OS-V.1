import fs from 'node:fs'

const file = 'app/(protected)/hr/page.tsx'

if (!fs.existsSync(file)) {
  console.error('Missing app/(protected)/hr/page.tsx')
  process.exit(1)
}

let s = fs.readFileSync(file, 'utf8')

// Add helper after rows() if missing.
if (!s.includes('function countUnvalidatedAttendance')) {
  s = s.replace(
`function rows(value: unknown): any[] {
  return Array.isArray(value) ? value : []
}`,
`function rows(value: unknown): any[] {
  return Array.isArray(value) ? value : []
}

function countUnvalidatedAttendance(attendance: any[]) {
  return attendance.filter((row) => {
    const status = String(row.validation_status || row.status || row.attendance_status || '').toLowerCase()
    return !['validated', 'approved', 'closed', 'complete', 'completed'].some((x) => status.includes(x))
  }).length
}`
  )
}

// Add computed const after metrics/score area if missing.
if (!s.includes('const unvalidatedAttendance =')) {
  s = s.replace(
`  const metrics = getHRProductionMetrics(data)
  const score = getHRProductionScore(data)`,
`  const metrics = getHRProductionMetrics(data)
  const score = getHRProductionScore(data)
  const attendanceRows = rows(data.attendance)
  const unvalidatedAttendance = Math.max(
    0,
    (metrics.attendanceRecords || attendanceRows.length) - (metrics.validatedAttendance || 0)
  ) || countUnvalidatedAttendance(attendanceRows)`
  )
}

// Replace direct invalid metrics property.
s = s.replaceAll('metrics.unvalidatedAttendance', 'unvalidatedAttendance')

fs.writeFileSync(file, s)
console.log('Patched app/(protected)/hr/page.tsx unvalidatedAttendance usage')
