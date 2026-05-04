import { HrModulePage } from '@/components/hr-v2-max/HrMaxShell'
import { getHrMaximumSnapshot } from '@/lib/hr-v2-max/sync'

export default async function Page() {
  const snapshot = await getHrMaximumSnapshot()
  return <HrModulePage title='HR Command Ops' subtitle='Corporate HR operation room for daily command, alerts, blockers and workforce instructions.' icon='activity' rows={snapshot.actions.rows} route=/hr/{route} />
}
