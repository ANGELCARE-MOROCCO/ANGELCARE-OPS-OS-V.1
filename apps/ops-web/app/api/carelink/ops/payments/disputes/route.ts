import { requestMissionCorrectionDispute } from '@/lib/carelink/ops-enterprise'
import { opsError, opsJson, readJsonBody } from '../../_helpers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request)
    const dispute = await requestMissionCorrectionDispute({
      caregiverId: Number(body?.caregiverId || 0),
      missionId: body?.missionId == null ? null : Number(body.missionId),
      amountClaimed: body?.amountClaimed == null ? null : Number(body.amountClaimed),
      reason: String(body?.reason || 'Correction demandée'),
      metadata: typeof body?.metadata === 'object' && body?.metadata ? body.metadata : {},
    })
    return opsJson({ ok: true, data: dispute })
  } catch (error) {
    return opsError(error, 'Impossible de créer le litige paiement Ops')
  }
}
