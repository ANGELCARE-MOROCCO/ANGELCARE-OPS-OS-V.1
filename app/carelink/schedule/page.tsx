import { CareLinkMobileSchedule } from '@/components/carelink/mobile/CareLinkMobileSchedule'
import { listMissionControlRecords } from '@/lib/missions/repository'
export const dynamic = 'force-dynamic'
export default async function CareLinkSchedulePage() { const records = await listMissionControlRecords().catch(() => []); return <CareLinkMobileSchedule records={records.filter((item) => item.missionKind !== 'dossier')} /> }
