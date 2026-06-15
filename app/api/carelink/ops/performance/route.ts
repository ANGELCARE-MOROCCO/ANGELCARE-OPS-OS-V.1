import { loadCareLinkOpsSnapshot } from '@/lib/carelink/ops-enterprise'
import { opsError, opsJson } from '../_helpers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    return opsJson(await loadCareLinkOpsSnapshot())
  } catch (error) {
    return opsError(error, 'Impossible de charger la performance Ops')
  }
}
