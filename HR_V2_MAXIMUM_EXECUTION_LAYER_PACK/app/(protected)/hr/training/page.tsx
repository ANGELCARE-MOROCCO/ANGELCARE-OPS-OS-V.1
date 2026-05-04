import { HrModulePage } from '@/components/hr-v2-max/HrMaxShell'
import { getHrMaximumSnapshot } from '@/lib/hr-v2-max/sync'

export default async function Page() {
  const snapshot = await getHrMaximumSnapshot()
  return <HrModulePage title='Training & Certification' subtitle='Academy linkage, certifications, trainee readiness and training compliance.' icon='badge' rows={snapshot.training.rows} route=/hr/{route} />
}
