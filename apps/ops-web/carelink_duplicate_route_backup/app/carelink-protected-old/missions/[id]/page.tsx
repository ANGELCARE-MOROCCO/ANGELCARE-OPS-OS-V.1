import { CareLinkMobileClient } from '@/components/carelink/CareLinkMobileClient'
import { loadCarelinkDashboard } from '@/lib/carelink/server'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> | { id: string } }

export default async function CareLinkMissionDetailPage({ params }: Props) {
  const resolved = await params
  const { data } = await loadCarelinkDashboard()
  return <CareLinkMobileClient initialDashboard={data} view="mission" missionId={resolved.id} />
}
