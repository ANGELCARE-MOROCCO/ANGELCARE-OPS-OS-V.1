import { CareLinkMissionControlCenter } from '@/components/carelink/ops/missions/CareLinkMissionControlCenter'
import { listMissionControlRecords } from '@/lib/missions/repository'

export const dynamic = 'force-dynamic'

export default async function CareLinkOpsMissionsrisk_monitoringPage() {
  const records = await listMissionControlRecords().catch(() => [])
  return <CareLinkMissionControlCenter activeView="risk-monitoring" initialRecords={records} />
}
