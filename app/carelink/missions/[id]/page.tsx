import { CareLinkMobileMissionDetail } from '@/components/carelink/mobile/CareLinkMobileMissionDetail'
import { getMissionDossier } from '@/lib/missions/repository'
export const dynamic = 'force-dynamic'
export default async function CareLinkMissionDetailPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const dossier = await getMissionDossier(Number(id)).catch(() => null); return <CareLinkMobileMissionDetail dossier={dossier} /> }
