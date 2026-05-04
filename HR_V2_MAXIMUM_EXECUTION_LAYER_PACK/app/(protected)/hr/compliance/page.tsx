import { HrModulePage } from '@/components/hr-v2-max/HrMaxShell'
import { getHrMaximumSnapshot } from '@/lib/hr-v2-max/sync'

export default async function Page() {
  const snapshot = await getHrMaximumSnapshot()
  return <HrModulePage title='Compliance Control' subtitle='Audit readiness, document gaps, training expiry, incidents and HR policy risk.' icon='shield' rows={snapshot.incidents.rows} route=/hr/{route} />
}
