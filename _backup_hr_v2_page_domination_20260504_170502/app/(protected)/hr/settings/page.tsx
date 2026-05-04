import { HrModulePage } from '@/components/hr-v2-max/HrMaxShell'
import { getHrMaximumSnapshot } from '@/lib/hr-v2-max/sync'

export default async function Page() {
  const snapshot = await getHrMaximumSnapshot()
  return <HrModulePage title='HR System Settings' subtitle='HR workflows, sync bridges, operating rules and future automation configuration.' icon='database' rows={snapshot.audits.rows} route=/hr/{route} />
}
