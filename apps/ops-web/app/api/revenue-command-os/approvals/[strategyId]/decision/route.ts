import crypto from 'node:crypto'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getCurrentUser } from '@/lib/getUser'
import { RevenueOsError } from '@/lib/revenue-command-os/errors'
import { revenueOsErrorResponse } from '@/lib/revenue-command-os/http'
import { actorOf, canApproveClass, studioRights, tenantOf } from '@/lib/revenue-command-os/strategy-studio/api-access'
import { executeStudioAction } from '@/lib/revenue-command-os/strategy-studio/service'
import type { ApprovalCondition, StudioAction } from '@/lib/revenue-command-os/strategy-studio/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const decisionSchema = z.object({
  action: z.enum(['approve', 'request_correction', 'reject']),
  strategyVersion: z.string().min(1),
  reason: z.string().min(3).max(4000),
  conditionsText: z.string().max(4000).optional(),
  approvalClass: z.enum(['standard', 'financial', 'capacity', 'managing_director', 'multi_director', 'conditional_pilot', 'high_risk_exception']).default('managing_director'),
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ strategyId: string }> }) {
  const user = await getCurrentUser()
  if (!user) return revenueOsErrorResponse(new RevenueOsError('UNAUTHENTICATED', 'Authentification requise.', { status: 401 }))

  const rights = studioRights(user)
  if (!rights.review) return revenueOsErrorResponse(new RevenueOsError('FORBIDDEN', 'Permission de décision stratégique requise.', { status: 403 }))

  try {
    const { strategyId } = await params
    const parsed = decisionSchema.safeParse(await request.json())
    if (!parsed.success) return revenueOsErrorResponse(new RevenueOsError('INVALID_APPROVAL_DECISION', 'La décision transmise est incomplète ou invalide.', { status: 422, context: { validation: parsed.error.flatten() } }))

    if (parsed.data.action === 'approve' && !canApproveClass(user, parsed.data.approvalClass)) {
      return revenueOsErrorResponse(new RevenueOsError('APPROVAL_AUTHORITY_INSUFFICIENT', 'Votre autorité ne couvre pas cette classe de décision.', { status: 403 }))
    }

    const action: StudioAction = parsed.data.action === 'request_correction' ? 'request_evidence' : parsed.data.action
    const conditions: ApprovalCondition[] | undefined = parsed.data.action === 'approve' && parsed.data.conditionsText?.trim()
      ? [{
          id: crypto.randomUUID(),
          type: 'custom',
          label: parsed.data.conditionsText.trim(),
          operator: 'custom',
          value: parsed.data.conditionsText.trim(),
          status: 'pending',
          machineReadable: true,
          evidenceIds: [],
        }]
      : undefined

    const result = await executeStudioAction({
      tenantId: tenantOf(user),
      actor: actorOf(user),
      action,
      strategyId,
      strategyVersion: parsed.data.strategyVersion,
      reason: parsed.data.reason,
      approvalClass: parsed.data.approvalClass,
      conditions,
      amendment: parsed.data.action === 'request_correction' ? { requestedCorrection: parsed.data.conditionsText || parsed.data.reason } : undefined,
      idempotencyKey: request.headers.get('idempotency-key') || crypto.randomUUID(),
    })

    return NextResponse.json({ ok: true, data: result, traceId: `approval-decision:${strategyId}:${result.newStatus}`, externalActions: 0 })
  } catch (error) {
    return revenueOsErrorResponse(error instanceof RevenueOsError ? error : new RevenueOsError('APPROVAL_DECISION_FAILED', 'La décision n’a pas pu être enregistrée. Aucun effet externe n’a été exécuté.', { status: 500, recoverable: true, cause: error }))
  }
}
