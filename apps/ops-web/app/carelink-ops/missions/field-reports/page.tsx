import { CareLinkMissionControlCenter } from '@/components/carelink/ops/missions/CareLinkMissionControlCenter'
import { listMissionControlRecords } from '@/lib/missions/repository'

export const dynamic = 'force-dynamic'

export default async function CareLinkOpsMissionsfield_reportsPage() {
  const records = await listMissionControlRecords().catch(() => [])
  return <CareLinkMissionControlCenter activeView="field-reports" initialRecords={records} />
}
