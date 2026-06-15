import { CareLinkMissionControlCenter } from '@/components/carelink/ops/missions/CareLinkMissionControlCenter'
import { listMissionControlRecords } from '@/lib/missions/repository'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CareLinkOpsMissionsPage() {
  const records = await listMissionControlRecords()

  return <CareLinkMissionControlCenter initialRecords={records} />
}
