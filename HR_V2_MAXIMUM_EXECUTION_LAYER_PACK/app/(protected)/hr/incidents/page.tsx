import { HrModulePage } from '@/components/hr-v2-max/HrMaxShell'
import { getHrMaximumSnapshot } from '@/lib/hr-v2-max/sync'

export default async function Page() {
  const snapshot = await getHrMaximumSnapshot()
  return <HrModulePage title='Incident HR Timeline' subtitle='Incident history, severity, corrective actions and staff risk signals.' icon='alert' rows={snapshot.incidents.rows} route=/hr/{route} />
}
