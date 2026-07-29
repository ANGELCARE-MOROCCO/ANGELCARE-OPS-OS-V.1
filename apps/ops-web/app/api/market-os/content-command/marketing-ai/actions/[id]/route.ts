import { NextResponse } from 'next/server'
import { apiErrorResponse, requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'
import { getInternalAction, updateInternalActionStatus } from '@/lib/market-os/marketing-ai/repository'
import { storeMarketingAiBridgeJson } from '@/lib/market-os/marketing-ai/bridge'

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const actor = await requireMarketingAiUser(['approved', 'rejected'].includes(String(body.status)) ? 'govern' : body.status === 'executed' ? 'run' : 'manage')
    if (!['approved', 'rejected', 'executed', 'failed'].includes(body.status)) {
      return NextResponse.json({ ok: false, error: 'INVALID_ACTION_STATUS' }, { status: 400 })
    }
    const current = await getInternalAction(id)
    if (!current) return NextResponse.json({ ok: false, error: 'ACTION_NOT_FOUND' }, { status: 404 })
    if (body.status === 'executed' && current.status !== 'approved') return NextResponse.json({ ok: false, error: 'ACTION_HUMAN_APPROVAL_REQUIRED' }, { status: 409 })
    let bridgeObject: unknown = null
    let bridgeError: string | null = null
    if (body.status === 'executed') {
      try {
        bridgeObject = await storeMarketingAiBridgeJson({
          actorId: actor.id,
          runId: current.run_id || null,
          actionId: current.id,
          contentId: typeof current.payload?.contentId === 'string' ? current.payload.contentId : null,
          entityType: current.action_type,
          filename: `${current.command_code}-${current.action_type}-${current.id}.json`,
          value: {
            action: current,
            executionResult: body.executionResult || {},
            executedBy: { id: actor.id, name: actor.name, role: actor.role },
            executedAt: new Date().toISOString(),
          },
          classification: {
            module: 'market_os_content_command',
            commandCode: current.command_code,
            actionType: current.action_type,
            authority: 'human_approved_internal_materialization',
          },
        })
      } catch (error) {
        bridgeError = error instanceof Error ? error.message : 'BRIDGE_ARCHIVE_FAILED'
      }
    }
    const executionResult = {
      ...(body.executionResult && typeof body.executionResult === 'object' ? body.executionResult : {}),
      bridgeArchived: Boolean(bridgeObject),
      bridgeObject,
      bridgeError,
    }
    const action = await updateInternalActionStatus(id, body.status, actor.id, executionResult)
    return NextResponse.json({ ok: true, action, bridgeObject, bridgeError })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
