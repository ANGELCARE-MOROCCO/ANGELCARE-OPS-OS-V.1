import { loadCareLinkOpsMissionDetail, recordOpsAuditEvent } from '@/lib/carelink/ops-enterprise'
import { patchMission } from '@/lib/missions/repository'
import { recordMissionEvent } from '@/lib/missions/events'
import { opsError, opsJson, readJsonBody } from '../../_helpers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Context = { params: Promise<{ id: string }> | { id: string } }

async function readId(context: Context) {
  const params = await context.params
  return params.id
}

export async function GET(_request: Request, context: Context) {
  try {
    const id = await readId(context)
    return opsJson(await loadCareLinkOpsMissionDetail(id))
  } catch (error) {
    return opsError(error, 'Impossible de charger le détail mission Ops')
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const id = Number(await readId(context))
    const body = await readJsonBody(request)
    const patch = typeof body?.patch === 'object' && body.patch ? body.patch : body
    const mission = await patchMission(id, patch)
    await recordMissionEvent({
      missionId: id,
      eventType: 'ops_mission_updated',
      content: 'Mission updated by CareLink Ops',
      metadata: { patch },
      source: 'carelink_ops',
    })
    await recordOpsAuditEvent({
      entityType: 'mission',
      entityId: String(id),
      action: 'mission.updated',
      payload: { patch },
    })
    return opsJson({ ok: true, data: mission })
  } catch (error) {
    return opsError(error, 'Impossible de mettre à jour la mission Ops')
  }
}
