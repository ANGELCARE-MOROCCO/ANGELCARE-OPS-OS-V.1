import { HrModulePage } from '@/components/hr-v2-max/HrMaxShell'
import { getHrMaximumSnapshot } from '@/lib/hr-v2-max/sync'

export default async function Page() {
  const snapshot = await getHrMaximumSnapshot()
  return <HrModulePage title='Roster Control' subtitle='Daily and weekly roster control with duty, coverage, replacement and shift visibility.' icon='calendar' rows={snapshot.roster.rows} route=/hr/{route} />
}
