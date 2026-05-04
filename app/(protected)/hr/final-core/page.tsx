import { HrModulePage } from '@/components/hr-v2-max/HrMaxShell'
import { getHrMaximumSnapshot } from '@/lib/hr-v2-max/sync'

export default async function Page() {
  const snapshot = await getHrMaximumSnapshot()
  return <HrModulePage title='Final Core Control' subtitle='Final HR core view: sync health, staff actions, payroll, compliance and workforce readiness.' icon='activity' rows={snapshot.actions.rows} route=/hr/{route} />
}
