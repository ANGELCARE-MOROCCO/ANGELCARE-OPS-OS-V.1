import { HrModulePage } from '@/components/hr-v2-max/HrMaxShell'
import { getHrMaximumSnapshot } from '@/lib/hr-v2-max/sync'

export default async function Page() {
  const snapshot = await getHrMaximumSnapshot()
  return <HrModulePage title='Departments Structure' subtitle='Department command map covering executive, care ops, sales, marketing, academy and office layers.' icon='layers' rows={snapshot.departments.rows} route=/hr/{route} />
}
