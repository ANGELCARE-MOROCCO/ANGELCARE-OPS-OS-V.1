import { CareLinkDispatchWorkspacePage } from '@/components/carelink/ops/dispatch/CareLinkDispatchWorkspacePage'
import { getCareLinkOpsDispatchPayload } from '@/lib/carelink/ops-dispatch-repository'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const payload = await getCareLinkOpsDispatchPayload()
  return <CareLinkDispatchWorkspacePage view="matching-engine" initialPayload={payload} />
}
