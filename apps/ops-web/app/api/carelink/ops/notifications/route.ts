import { loadCareLinkOpsSnapshot, saveOpsNotification } from '@/lib/carelink/ops-enterprise'
import { opsError, opsJson, readJsonBody } from '../_helpers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    return opsJson(await loadCareLinkOpsSnapshot())
  } catch (error) {
    return opsError(error, 'Impossible de charger les notifications Ops')
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request)
    const notification = await saveOpsNotification({
      missionId: body?.missionId == null ? null : Number(body.missionId),
      caregiverId: body?.caregiverId == null ? null : Number(body.caregiverId),
      type: String(body?.type || 'ops_notification'),
      title: String(body?.title || 'Notification Ops'),
      body: String(body?.body || ''),
      priority: typeof body?.priority === 'string' ? body.priority : 'normal',
      metadata: typeof body?.metadata === 'object' && body?.metadata ? body.metadata : {},
    })
    return opsJson({ ok: true, data: notification })
  } catch (error) {
    return opsError(error, 'Impossible de créer la notification Ops')
  }
}
