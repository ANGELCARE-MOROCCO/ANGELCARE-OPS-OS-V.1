import { CareLinkFieldAgentPremiumApp } from '@/components/carelink/mobile/CareLinkFieldAgentPremiumApp'
import { loadCarelinkMobileMissionContextOrRedirect } from '@/lib/carelink/mobile-page-access'

export const dynamic = 'force-dynamic'

export default async function CareLinkMissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { records, dossier, workspace } = await loadCarelinkMobileMissionContextOrRedirect(id)
  return <CareLinkFieldAgentPremiumApp records={records} selectedId={id} dossier={dossier} workspace={workspace} view="mission" />
}
