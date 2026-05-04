import { HrModulePage } from '@/components/hr-v2-max/HrMaxShell'
import { getHrMaximumSnapshot } from '@/lib/hr-v2-max/sync'

export default async function Page() {
  const snapshot = await getHrMaximumSnapshot()
  return <HrModulePage title='Payroll Preparation' subtitle='Attendance-to-payroll preparation, deductions, bonus signals and finance export readiness.' icon='chart' rows={snapshot.payroll.rows} route=/hr/{route} />
}
