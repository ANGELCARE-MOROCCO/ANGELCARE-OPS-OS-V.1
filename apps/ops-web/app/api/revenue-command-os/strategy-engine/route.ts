import crypto from 'node:crypto'
import type { NextRequest } from 'next/server'
import { resolveRevenueOsActor } from '@/lib/revenue-command-os/access'
import { RevenueOsError } from '@/lib/revenue-command-os/errors'
import { revenueOsErrorResponse, revenueOsSuccess } from '@/lib/revenue-command-os/http'
import { readRevenueOsOperationalModel } from '@/lib/revenue-command-os/operational-read-model'
import { createRevenueOsObjective, writeRevenueOsAuditEvent } from '@/lib/revenue-command-os/repository'
import { executeLiveOperation } from '@/lib/revenue-command-os/live-operations/service'
import { readRevenueCommandKernel } from '@/lib/revenue-command-os/command-kernel/repository'
import { runGeminiStrategyAssembly } from '@/lib/revenue-command-os/strategy-brain/ai-orchestration'
import { normalizeObjective } from '@/lib/revenue-command-os/strategy-brain/objective-normalizer'
import type { RevenueObjective } from '@/lib/revenue-command-os/strategy-brain/types'

const allowedActions = new Set([
  'create_objective','validate_objective','build_context','select_commands','assemble','compare','combine','version','archive','prepare_for_council','publish','execute',
])

function asRecord(value: unknown): Record<string, any> { return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {} }

export async function GET(request: NextRequest) {
  try {
    const actor = await resolveRevenueOsActor('revenue_os.strategy.view', { aliases: ['revenue_os.view'] })
    const url = new URL(request.url)
    const operations = await readRevenueOsOperationalModel(actor.tenantId)
    return revenueOsSuccess({ phase: 'TRUSTED_OPERATOR_LIVE', mode: 'live', objectiveId: url.searchParams.get('objectiveId'), tenantId: actor.tenantId, actorId: actor.id, externalActions: true, persistenceEnabled: true, executionEnabled: true, strategies: operations.strategies, counts: operations.counts, warnings: operations.warnings })
  } catch (error) { return revenueOsErrorResponse(error) }
}

export async function POST(request: NextRequest) {
  try {
    const body = asRecord(await request.json().catch(() => ({})))
    const actor = await resolveRevenueOsActor('revenue_os.strategy.manage', { payload: body })
    const action = String(body.action || '')
    if (!action) throw new RevenueOsError('REVENUE_OS_INVALID_INPUT','Action Strategy Engine requise.',{status:422,recoverable:true})
    if (!allowedActions.has(action)) throw new RevenueOsError('REVENUE_OS_ACTION_NOT_SUPPORTED',`Action non supportée: ${action}`,{status:400,recoverable:true})

    if (action === 'create_objective') {
      const input = asRecord(body.objective || body.payload)
      const data = await createRevenueOsObjective({ title:String(input.title||'Mandat Revenue live'), mandate:String(input.mandate||input.description||input.title||'Mandat Revenue exécuté directement par un opérateur authentifié.'), businessUnit:String(input.businessUnit||input.business_unit||'ANGELCARE'), targetMarket:String(input.targetMarket||input.target_market||'Maroc'), horizon:String(input.horizon||'30 jours'), priority:(String(input.priority||'high') as any), executionMode:'live' }, { id:actor.id,label:actor.displayName })
      return revenueOsSuccess({ action,status:'completed',mode:'live',data })
    }

    if (action === 'assemble' || action === 'build_context') {
      const objective = asRecord(body.objective) as RevenueObjective
      const normalized = normalizeObjective({ ...objective, tenantId: actor.tenantId, requestedBy: actor.id, id: objective.id || crypto.randomUUID(), status: 'active' } as RevenueObjective)
      const data = await runGeminiStrategyAssembly({ objective: normalized.objective, userId: actor.id, idempotencyKey: request.headers.get('idempotency-key') || String(body.idempotencyKey||'') || undefined })
      return revenueOsSuccess({ action,status:'completed',mode:'live',warnings:normalized.issues,data })
    }

    if (action === 'select_commands') {
      const { bootstrap, warnings } = await readRevenueCommandKernel()
      return revenueOsSuccess({ action,status:'completed',mode:'live',data:{ commands:bootstrap.commands, schedules:bootstrap.schedules, readiness:bootstrap.readiness },warnings })
    }

    if (action === 'compare') {
      const operations = await readRevenueOsOperationalModel(actor.tenantId)
      return revenueOsSuccess({ action,status:'completed',mode:'live',data:{ strategies:operations.strategies, count:operations.strategies.length } })
    }

    if (action === 'validate_objective') {
      const objective = asRecord(body.objective) as RevenueObjective
      const normalized = normalizeObjective({ ...objective, tenantId:actor.tenantId, requestedBy:actor.id, id:objective.id||crypto.randomUUID(), status:'active' } as RevenueObjective)
      await writeRevenueOsAuditEvent({ action:'objective.validated_live',actorId:actor.id,actorLabel:actor.displayName,actorType:'user',resourceType:'revenue_os_objective',resourceId:String(objective.id||'new'),outcome:'success',summary:'Objectif validé sans gate organisationnel.',metadata:{warnings:normalized.issues} })
      return revenueOsSuccess({ action,status:'completed',mode:'live',data:normalized })
    }

    const strategyId = String(body.strategyId || body.entityId || '')
    if (!strategyId) throw new RevenueOsError('STRATEGY_ID_REQUIRED','Stratégie requise.',{status:422,recoverable:true})
    const operation = action === 'archive' ? 'archive' : action === 'publish' || action === 'prepare_for_council' ? 'publish' : action === 'execute' ? 'execute' : 'update'
    const data = await executeLiveOperation({ tenantId:actor.tenantId,actorId:actor.id,actorLabel:actor.displayName,entityType:'strategy',operation,entityId:strategyId,reason:String(body.reason||`Action ${action}`),changes:{ ...asRecord(body.changes), lastStrategyAction:action, status: action==='combine'?'active':undefined } })
    return revenueOsSuccess({ action,status:data.status,mode:'live',data })
  } catch (error) { return revenueOsErrorResponse(error) }
}
