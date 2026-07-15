import { CareLinkOpsProductionDashboard } from '@/components/carelink/ops/CareLinkOpsProductionDashboard'
import { getCareLinkOpsLiveMissionBridge } from '@/lib/carelink/ops-live-missions-bridge'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CareLinkOpsPage() {
  const livePayload = await getCareLinkOpsLiveMissionBridge()

  return (
    <CareLinkOpsProductionDashboard
      initialPayload={livePayload as any}
    />
  )
}
