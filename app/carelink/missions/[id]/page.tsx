import { CareLinkFieldAgentPremiumApp } from '@/components/carelink/mobile/CareLinkFieldAgentPremiumApp'
import { loadCarelinkMobileWorkspace } from '@/lib/carelink/mobile-adapter'
import { getMissionDossier, listMissionControlRecords } from '@/lib/missions/repository'

export const dynamic = 'force-dynamic'

export default async function CareLinkMissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [records, dossier] = await Promise.all([
    listMissionControlRecords().catch(() => []),
    getMissionDossier(Number(id)).catch(() => null),
  ])
  const workspace = await loadCarelinkMobileWorkspace()
  return <CareLinkFieldAgentPremiumApp records={records.filter((item) => item.missionKind !== 'dossier')} selectedId={id} dossier={dossier} workspace={workspace} view="mission" />
}
