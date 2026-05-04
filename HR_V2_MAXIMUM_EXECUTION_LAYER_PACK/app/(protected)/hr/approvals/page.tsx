import { HrModulePage } from '@/components/hr-v2-max/HrMaxShell'
import { getHrMaximumSnapshot } from '@/lib/hr-v2-max/sync'

export default async function Page() {
  const snapshot = await getHrMaximumSnapshot()
  return <HrModulePage title='HR Approval Center' subtitle='Leave, roster, payroll, document and staff approval workflows.' icon='check' rows={snapshot.approvals.rows} route=/hr/{route} />
}
