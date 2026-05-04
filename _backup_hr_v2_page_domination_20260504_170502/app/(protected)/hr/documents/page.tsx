import { HrModulePage } from '@/components/hr-v2-max/HrMaxShell'
import { getHrMaximumSnapshot } from '@/lib/hr-v2-max/sync'

export default async function Page() {
  const snapshot = await getHrMaximumSnapshot()
  return <HrModulePage title='Staff Documents' subtitle='Contracts, IDs, certifications, expiry controls, verification and compliance documents.' icon='file' rows={snapshot.staff.rows} route=/hr/{route} />
}
