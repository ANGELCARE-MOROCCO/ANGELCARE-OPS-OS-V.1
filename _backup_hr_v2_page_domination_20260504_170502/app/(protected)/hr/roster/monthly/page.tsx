import { HrModulePage } from '@/components/hr-v2-max/HrMaxShell'
import { getHrMaximumSnapshot } from '@/lib/hr-v2-max/sync'

export default async function Page() {
  const snapshot = await getHrMaximumSnapshot()
  return <HrModulePage title='Monthly Staff Roster' subtitle='Large monthly roster control card with all-staff duty planning, filters and coverage signals.' icon='calendar' rows={snapshot.roster.rows} route=/hr/{route} />
}
