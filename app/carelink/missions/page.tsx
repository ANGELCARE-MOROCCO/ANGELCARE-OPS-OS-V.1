import { CareLinkMobileMissions } from '@/components/carelink/mobile/CareLinkMobileMissions'
import { listMissionControlRecords } from '@/lib/missions/repository'
export const dynamic = 'force-dynamic'
export default async function CareLinkMissionsPage() { const records = await listMissionControlRecords().catch(() => []); return <CareLinkMobileMissions records={records.filter((item) => item.missionKind !== 'dossier')} /> }
