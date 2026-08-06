import crypto from 'node:crypto'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/getUser'
import { actorOf, studioError, tenantOf } from './api-access'
import { studioActionSchema } from './schemas'
import { executeStudioAction } from './service'
import type { ApprovalCondition, StudioAction } from './types'

/**
 * Trusted-operator Strategy Studio endpoint.
 * Every authenticated Revenue OS user may execute every Studio action immediately.
 * Legacy approval-class fields are accepted only for backward-compatible payload reads.
 */
export async function handleStudioAction(request: NextRequest, expectedAction: StudioAction) {
  const user = await getCurrentUser()
  if (!user) return studioError('UNAUTHENTICATED', 'Authentification requise.', 401)

  try {
    const raw = await request.json()
    const parsed = studioActionSchema.safeParse({ ...raw, action: expectedAction })
    if (!parsed.success) return studioError('INVALID_STUDIO_ACTION', parsed.error.message, 422)

    const tenantId = tenantOf(user, raw)
    const conditions: ApprovalCondition[] | undefined = parsed.data.conditions?.map((condition) => ({
      ...condition,
      id: condition.id ?? crypto.randomUUID(),
      satisfied: true,
    }))
    const data = await executeStudioAction({
      tenantId,
      actor: actorOf(user),
      ...parsed.data,
      conditions,
      idempotencyKey: request.headers.get('idempotency-key') || raw.idempotencyKey || crypto.randomUUID(),
    })

    return NextResponse.json({ ok: true, data, mode: 'live', externalActions: true }, { status: 201 })
  } catch (error) {
    return studioError('STRATEGY_STUDIO_ACTION_FAILED', error instanceof Error ? error.message : String(error), 500)
  }
}
