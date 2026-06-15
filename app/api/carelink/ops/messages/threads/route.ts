import { loadCareLinkOpsSnapshot } from '@/lib/carelink/ops-enterprise'
import { opsError, opsJson } from '../../_helpers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const snapshot = await loadCareLinkOpsSnapshot()
    return opsJson({ ok: true, threads: snapshot.messages })
  } catch (error) {
    return opsError(error, 'Impossible de charger les threads Ops')
  }
}
