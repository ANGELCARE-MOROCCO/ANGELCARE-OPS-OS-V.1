import { HrModulePage } from '@/components/hr-v2-max/HrMaxShell'
import { getHrMaximumSnapshot } from '@/lib/hr-v2-max/sync'

export default async function Page() {
  const snapshot = await getHrMaximumSnapshot()
  return <HrModulePage title='Attendance Command' subtitle='Attendance, pointage, lateness, coverage and payroll-preparation visibility.' icon='check' rows={snapshot.attendance.rows} route=/hr/{route} />
}
