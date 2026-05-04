import { HrModulePage } from '@/components/hr-v2-max/HrMaxShell'
import { getHrMaximumSnapshot } from '@/lib/hr-v2-max/sync'

export default async function Page() {
  const snapshot = await getHrMaximumSnapshot()
  return <HrModulePage title='Create Staff Profile' subtitle='Create a new HR staff profile and prepare role, department, contract and onboarding controls.' icon='users' rows={snapshot.positions.rows} route=/hr/{route} />
}
