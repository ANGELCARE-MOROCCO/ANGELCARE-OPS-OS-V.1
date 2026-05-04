import { HrModulePage } from '@/components/hr-v2-max/HrMaxShell'
import { getHrMaximumSnapshot } from '@/lib/hr-v2-max/sync'

export default async function Page() {
  const snapshot = await getHrMaximumSnapshot()
  return <HrModulePage title='Workforce Capacity' subtitle='Capacity planning, coverage gaps, required staffing and department risk visibility.' icon='gauge' rows={snapshot.capacity.rows} route=/hr/{route} />
}
