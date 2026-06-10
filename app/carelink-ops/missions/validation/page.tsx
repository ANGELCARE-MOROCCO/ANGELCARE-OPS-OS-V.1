import { CareLinkMissionControlCenter } from '@/components/carelink/ops/missions/CareLinkMissionControlCenter'
import { listMissionControlRecords } from '@/lib/missions/repository'

export const dynamic = 'force-dynamic'

export default async function CareLinkOpsMissionsvalidationPage() {
  const records = await listMissionControlRecords().catch(() => [])
  return <CareLinkMissionControlCenter activeView="validation" initialRecords={records} />
}
