import { HrModulePage } from '@/components/hr-v2-max/HrMaxShell'
import { getHrMaximumSnapshot } from '@/lib/hr-v2-max/sync'

export default async function Page() {
  const snapshot = await getHrMaximumSnapshot()
  return <HrModulePage title='HR Action Queue' subtitle='Manual and automated HR actions, priorities, status, target routes and ownership.' icon='clipboard' rows={snapshot.actions.rows} route=/hr/{route} />
}
