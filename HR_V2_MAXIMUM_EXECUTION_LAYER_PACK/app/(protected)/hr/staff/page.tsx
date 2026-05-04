import { HrModulePage } from '@/components/hr-v2-max/HrMaxShell'
import { getHrMaximumSnapshot } from '@/lib/hr-v2-max/sync'

export default async function Page() {
  const snapshot = await getHrMaximumSnapshot()
  return <HrModulePage title='Staff Directory' subtitle='Premium worker directory with profile, department, status, readiness and direct action access.' icon='users' rows={snapshot.staff.rows} route=/hr/{route} />
}
