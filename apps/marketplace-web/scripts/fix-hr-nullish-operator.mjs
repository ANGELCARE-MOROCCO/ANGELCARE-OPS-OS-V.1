import fs from 'node:fs'

const targets = [
  'app/(protected)/hr/page.tsx',
  'app/(protected)/page.tsx',
]

for (const file of targets) {
  if (!fs.existsSync(file)) continue

  let s = fs.readFileSync(file, 'utf8')

  s = s.replace(
`  const unvalidatedAttendance =
    (metrics as any).unvalidatedAttendance ??
    Math.max(0, (metrics.attendanceRecords || attendance.length) - (metrics.validatedAttendance || 0)) ||
    countUnvalidatedAttendance(attendance)`,
`  const unvalidatedAttendance =
    (metrics as any).unvalidatedAttendance ??
    (
      Math.max(0, (metrics.attendanceRecords || attendance.length) - (metrics.validatedAttendance || 0)) ||
      countUnvalidatedAttendance(attendance)
    )`
  )

  s = s.replace(
`  const rosterConflicts =
    (metrics as any).rosterConflicts ??
    (metrics as any).conflictsCount ??
    countRosterConflicts(rosters)`,
`  const rosterConflicts =
    (metrics as any).rosterConflicts ??
    (
      (metrics as any).conflictsCount ??
      countRosterConflicts(rosters)
    )`
  )

  s = s.replace(
`  const openQuality =
    (metrics as any).openQuality ??
    (metrics as any).qualityIssues ??
    countOpenQuality(data)`,
`  const openQuality =
    (metrics as any).openQuality ??
    (
      (metrics as any).qualityIssues ??
      countOpenQuality(data)
    )`
  )

  fs.writeFileSync(file, s)
  console.log(`Patched ${file}`)
}
