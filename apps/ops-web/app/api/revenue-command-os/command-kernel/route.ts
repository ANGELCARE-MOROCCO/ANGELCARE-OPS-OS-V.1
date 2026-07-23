import type { NextRequest } from 'next/server'
import { resolveRevenueOsActor, requireRevenueOsPermission } from '@/lib/revenue-command-os/access'
import { RevenueOsError } from '@/lib/revenue-command-os/errors'
import { revenueOsErrorResponse, revenueOsSuccess } from '@/lib/revenue-command-os/http'
import {
  persistKernelValidation,
  readRevenueCommandKernel,
  simulateRevenueCommandSituation,
} from '@/lib/revenue-command-os/command-kernel/repository'
import type { RevenueCommandSituation } from '@/lib/revenue-command-os/command-kernel/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const actor = await resolveRevenueOsActor('revenue_os.commands.view', {
      aliases: ['revenue_os.view', 'revenue_os.commands.manage'],
      message: 'Accès au noyau des commandes refusé.',
    })
    const result = await readRevenueCommandKernel(actor.tenantId)
    return revenueOsSuccess(result.bootstrap, { meta: { warnings: result.warnings } })
  } catch (error) {
    return revenueOsErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const action = String(body?.action ?? '')
    const actor = await resolveRevenueOsActor(undefined, { payload: body?.payload ?? body })

    if (action === 'simulate') {
      requireRevenueOsPermission(actor, 'revenue_os.commands.simulate', 'Permission de simulation requise.', [
        'revenue_os.commands.manage',
      ])
      const payload = body?.payload ?? {}
      const situation: RevenueCommandSituation = {
        id: String(payload.id ?? `situation-${Date.now()}`),
        tenantId: actor.tenantId,
        organizationId: actor.tenantId,
        businessUnit: String(payload.businessUnit ?? 'ANGELCARE'),
        segment: payload.segment ? String(payload.segment) : undefined,
        territory: String(payload.territory ?? 'MA'),
        commercialStage: String(payload.commercialStage ?? 'qualification'),
        signalType: String(payload.signalType ?? 'manual.kernel.simulation'),
        urgency: Number(payload.urgency ?? 7),
        opportunityValueDh: Number(payload.opportunityValueDh ?? 0),
        accountPriority: Number(payload.accountPriority ?? 5),
        actorId: actor.id,
        actorRole: actor.role,
        permissions: actor.permissions,
        executionMode: 'simulation',
        context: Array.isArray(payload.context)
          ? payload.context
          : [
              { key: 'account', state: 'available', value: { code: 'ACC-DEMO' }, observedAt: new Date().toISOString(), source: 'kernel-ui', reasons: ['Contexte de démonstration'] },
              { key: 'signal', state: 'available', value: { type: 'manual' }, observedAt: new Date().toISOString(), source: 'kernel-ui', reasons: ['Signal manuel'] },
              { key: 'pipeline', state: 'available', value: { stage: 'qualification' }, observedAt: new Date().toISOString(), source: 'kernel-ui', reasons: ['Pipeline disponible'] },
              { key: 'lastInteraction', state: 'available', value: { days: 9 }, observedAt: new Date().toISOString(), source: 'kernel-ui', reasons: ['Interaction connue'] },
              { key: 'offerCatalogue', state: 'available', value: { offers: 3 }, observedAt: new Date().toISOString(), source: 'digital-twin', reasons: ['Catalogue validé'] },
              { key: 'pricingRules', state: 'available', value: { status: 'approved' }, observedAt: new Date().toISOString(), source: 'doctrine-memory', reasons: ['Règles approuvées'] },
              { key: 'capacity', state: 'available', value: { status: 'conditional' }, observedAt: new Date().toISOString(), source: 'digital-twin', reasons: ['Capacité récente'] },
              { key: 'margin', state: 'available', value: { status: 'protected' }, observedAt: new Date().toISOString(), source: 'digital-twin', reasons: ['Marge connue'] },
              { key: 'authority', state: 'available', value: { level: 'director' }, observedAt: new Date().toISOString(), source: 'doctrine-memory', reasons: ['Autorité connue'] },
              { key: 'qualification', state: 'available', value: { score: 72 }, observedAt: new Date().toISOString(), source: 'kernel', reasons: ['Qualification simulée'] },
              { key: 'runPlan', state: 'available', value: {}, observedAt: new Date().toISOString(), source: 'kernel', reasons: ['Plan disponible'] },
            ],
        metadata: { decisionMakerConfirmed: false, ...(payload.metadata ?? {}) },
      }
      return revenueOsSuccess(await simulateRevenueCommandSituation(situation))
    }

    if (action === 'validate') {
      requireRevenueOsPermission(actor, 'revenue_os.commands.manage', 'Permission de gestion requise.')
      return revenueOsSuccess(await persistKernelValidation(actor.tenantId, actor.id), { status: 201 })
    }

    if (action === 'rollback') {
      throw new RevenueOsError(
        'REVENUE_OS_REMOTE_ROLLBACK_BLOCKED',
        'Le rollback applicatif demeure une opération contrôlée hors API; aucune mutation distante automatique n’est autorisée.',
        { status: 409, recoverable: false },
      )
    }

    throw new RevenueOsError('REVENUE_OS_ACTION_NOT_ALLOWED', 'Action Command Kernel non supportée.', {
      status: 405,
      recoverable: false,
      context: { action },
    })
  } catch (error) {
    return revenueOsErrorResponse(error)
  }
}
