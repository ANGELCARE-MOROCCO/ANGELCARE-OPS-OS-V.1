import type { NextRequest } from 'next/server'
import { resolveRevenueOsActor } from '@/lib/revenue-command-os/access'
import { RevenueOsError } from '@/lib/revenue-command-os/errors'
import { revenueOsErrorResponse, revenueOsSuccess } from '@/lib/revenue-command-os/http'

const allowedActions = new Set([
  'create_objective',
  'validate_objective',
  'build_context',
  'select_commands',
  'assemble',
  'compare',
  'combine',
  'version',
  'archive',
  'prepare_for_council',
])

export async function GET(request: NextRequest) {
  try {
    const actor = await resolveRevenueOsActor('revenue_os.strategy.view', {
      aliases: ['revenue_os.view'],
    })
    const url = new URL(request.url)
    return revenueOsSuccess({
      phase: 'MZ10',
      mode: 'shadow',
      objectiveId: url.searchParams.get('objectiveId'),
      tenantId: actor.tenantId,
      externalActions: false,
      contractStatus: 'shadow_contract_only',
      persistenceEnabled: false,
      executionEnabled: false,
      warning: 'Le Strategy Engine expose un contrat gouverné en mode Shadow; aucune décision ni action externe n’est exécutée.',
    })
  } catch (error) {
    return revenueOsErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const actor = await resolveRevenueOsActor('revenue_os.strategy.manage', { payload: body })
    const action = String(body?.action ?? '')

    if (!action) {
      throw new RevenueOsError('REVENUE_OS_INVALID_INPUT', 'Action Strategy Engine requise.', {
        status: 422,
        recoverable: true,
      })
    }
    if (!allowedActions.has(action)) {
      throw new RevenueOsError('REVENUE_OS_ACTION_NOT_ALLOWED', 'Action Strategy Engine non autorisée.', {
        status: 403,
        recoverable: false,
      })
    }

    return revenueOsSuccess({
      action,
      status: 'accepted_in_shadow_mode',
      tenantId: actor.tenantId,
      actorId: actor.id,
      externalActions: false,
      contractStatus: 'shadow_contract_only',
      persistenceEnabled: false,
      executionEnabled: false,
      warning: 'Action validée contre le contrat mais non persistée et non exécutée en mode Shadow.',
    })
  } catch (error) {
    return revenueOsErrorResponse(error)
  }
}
