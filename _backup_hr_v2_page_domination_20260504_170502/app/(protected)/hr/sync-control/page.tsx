import { HrModulePage } from '@/components/hr-v2-max/HrMaxShell'
import { getHrMaximumSnapshot } from '@/lib/hr-v2-max/sync'

export default async function Page() {
  const snapshot = await getHrMaximumSnapshot()
  return <HrModulePage title='HR Sync Control' subtitle='Live compatibility view across HR, pointage, missions, tasks, academy, incidents and operations.' icon='database' rows={snapshot.audits.rows} route=/hr/{route} />
}
