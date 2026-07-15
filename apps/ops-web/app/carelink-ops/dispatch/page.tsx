import { CareLinkDispatchControlCenter } from '@/components/carelink/ops/dispatch/CareLinkDispatchControlCenter'
import { getCareLinkOpsLiveMissionBridge } from '@/lib/carelink/ops-live-missions-bridge'
export default async function CareLinkOpsDispatchPage() {
  const initialPayload = await getCareLinkOpsLiveMissionBridge()
  return <CareLinkDispatchControlCenter initialPayload={initialPayload as any} />
}
export const dynamic = "force-dynamic";
export const revalidate = 0;

