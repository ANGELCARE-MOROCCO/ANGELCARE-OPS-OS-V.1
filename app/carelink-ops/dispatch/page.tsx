import { CareLinkDispatchControlCenter } from '@/components/carelink/ops/dispatch/CareLinkDispatchControlCenter'
import { getCareLinkOpsDispatchPayload } from '@/lib/carelink/ops-dispatch-repository'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CareLinkOpsDispatchPage() {
  const payload = await getCareLinkOpsDispatchPayload()
  return <CareLinkDispatchControlCenter initialPayload={payload} />
}
