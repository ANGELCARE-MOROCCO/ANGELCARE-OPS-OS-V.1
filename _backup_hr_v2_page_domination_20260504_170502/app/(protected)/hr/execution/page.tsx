import { HrModulePage } from '@/components/hr-v2-max/HrMaxShell'
import { getHrMaximumSnapshot } from '@/lib/hr-v2-max/sync'

export default async function Page() {
  const snapshot = await getHrMaximumSnapshot()
  return <HrModulePage title='HR Execution Layer' subtitle='Operational task chains, HR action queue, workforce workflows and execution accountability.' icon='clipboard' rows={snapshot.actions.rows} route=/hr/{route} />
}
