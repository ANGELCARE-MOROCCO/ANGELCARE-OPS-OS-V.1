import { governRoute } from '@/lib/runtime/governor/route'
import { loadCareLinkOpsSnapshot } from '@/lib/carelink/ops-enterprise'
import { opsError, opsJson } from '../_helpers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function GET__angelcareGovernedImpl() {
  try {
    return opsJson(await loadCareLinkOpsSnapshot())
  } catch (error) {
    return opsError(error, 'Impossible de charger les rapports Ops')
  }
}

export const GET = governRoute(
  {
    workloadClass: 'heavy',
    operation: 'GET:/api/carelink/ops/reports',
  },
  GET__angelcareGovernedImpl,
)
