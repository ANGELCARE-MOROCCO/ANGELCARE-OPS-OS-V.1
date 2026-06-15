import { recordOpsAuditEvent } from '@/lib/carelink/ops-enterprise'
import { markDispatchMessageRead } from '@/lib/carelink/mobile-persistence'
import { recordMissionEvent } from '@/lib/missions/events'
import { opsError, opsJson, readJsonBody } from '../../../_helpers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Context = { params: Promise<{ id: string }> | { id: string } }

async function readId(context: Context) {
  const params = await context.params
  return String(params.id)
}

export async function POST(request: Request, context: Context) {
  try {
    const id = await readId(context)
    const body = await readJsonBody(request)
    const result = await markDispatchMessageRead(id)
    if (body?.missionId != null) {
      await recordMissionEvent({
        missionId: Number(body.missionId),
        eventType: 'dispatch_message_read',
        content: typeof body?.note === 'string' ? body.note : 'Dispatch message read',
        metadata: { message_id: id },
        source: 'carelink_ops',
      })
    }
    await recordOpsAuditEvent({
      entityType: 'message',
      entityId: id,
      action: 'message.read',
      payload: { missionId: body?.missionId == null ? null : Number(body.missionId), note: typeof body?.note === 'string' ? body.note : 'Message lu' },
    })
    return opsJson({ ok: true, data: result })
  } catch (error) {
    return opsError(error, 'Impossible de marquer le message comme lu')
  }
}
