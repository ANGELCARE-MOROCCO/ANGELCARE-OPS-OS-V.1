import { HrModulePage } from '@/components/hr-v2-max/HrMaxShell'
import { getHrMaximumSnapshot } from '@/lib/hr-v2-max/sync'

export default async function Page() {
  const snapshot = await getHrMaximumSnapshot()
  return <HrModulePage title='Leave & Absence Management' subtitle='Leave requests, absence impact, coverage checks and approval follow-up.' icon='calendar' rows={snapshot.leave.rows} route=/hr/{route} />
}
