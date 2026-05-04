import { HrModulePage } from '@/components/hr-v2-max/HrMaxShell'
import { getHrMaximumSnapshot } from '@/lib/hr-v2-max/sync'

export default async function Page() {
  const snapshot = await getHrMaximumSnapshot()
  return <HrModulePage title='Positions Catalog' subtitle='AngelCare position catalog, families, KPI expectations, shift defaults and role logic.' icon='briefcase' rows={snapshot.positions.rows} route=/hr/{route} />
}
