import { HrModulePage } from '@/components/hr-v2-max/HrMaxShell'
import { getHrMaximumSnapshot } from '@/lib/hr-v2-max/sync'

export default async function Page() {
  const snapshot = await getHrMaximumSnapshot()
  return <HrModulePage title='Performance Command' subtitle='Reliability, behavior, client satisfaction, mission success and corrective action overview.' icon='chart' rows={snapshot.staff.rows} route=/hr/{route} />
}
