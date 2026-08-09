import crypto from 'node:crypto'
import type { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/getUser'
import { RevenueOsError } from '../errors'
import { revenueOsErrorResponse, revenueOsSuccess } from '../http'
import { actorOf, tenantOf } from './api-access'
import { activateSchema, adapterControlSchema, approveActionSchema, prepareSchema, rejectActionSchema, retrySchema, rollbackSchema, runActionSchema } from './schemas'
import {
  activatePropagation, approveExecutionAction, cancelPropagation, compensateExecutionAction, controlAdapter,
  executionDashboard, pausePropagation, preparePropagation, rejectExecutionAction, resumePropagation,
  retryExecutionAction, validatePropagationPackage,
} from './service'
import { adapterRegistry } from './registry'

async function authenticatedUser() {
  const user = await getCurrentUser()
  if (!user) throw new RevenueOsError('REVENUE_OS_UNAUTHENTICATED', 'Authentification requise.', { status: 401, recoverable: true })
  return user
}
const validationError = (message: string) => new RevenueOsError('REVENUE_OS_INVALID_INPUT', message, { status: 422, recoverable: true })

export async function handlePropagation(request: NextRequest, action: 'validate' | 'prepare' | 'activate' | 'pause' | 'resume' | 'cancel') {
  try {
    const user = await authenticatedUser()
    const raw = await request.json().catch(() => ({}))
    const tenantId = tenantOf(user, raw)
    const actor = actorOf(user, tenantId)
    if (action === 'validate') {
      const parsed = prepareSchema.pick({ packageId: true }).safeParse(raw)
      if (!parsed.success) throw validationError(parsed.error.issues.map((issue) => issue.message).join('; '))
      return revenueOsSuccess(await validatePropagationPackage(tenantId, parsed.data.packageId))
    }
    if (action === 'prepare') {
      const parsed = prepareSchema.safeParse({ ...raw, executionMode: 'live', dryRun: false })
      if (!parsed.success) throw validationError(parsed.error.issues.map((issue) => issue.message).join('; '))
      const idempotencyKey = request.headers.get('idempotency-key') || parsed.data.idempotencyKey || crypto.randomUUID()
      const preparation = await preparePropagation({ tenantId, actor, ...parsed.data, executionMode: 'live', dryRun: false, idempotencyKey })
      const activation = await activatePropagation({ tenantId, actor, runId: preparation.run.id, acknowledgeControls: true })
      return revenueOsSuccess({ ...preparation, activation })
    }
    if (action === 'activate') {
      const parsed = activateSchema.safeParse(raw)
      if (!parsed.success) throw validationError(parsed.error.issues.map((issue) => issue.message).join('; '))
      return revenueOsSuccess(await activatePropagation({ tenantId, actor, ...parsed.data }))
    }
    const parsed = runActionSchema.safeParse(raw)
    if (!parsed.success) throw validationError(parsed.error.issues.map((issue) => issue.message).join('; '))
    if (action === 'pause') return revenueOsSuccess(await pausePropagation({ tenantId, actor, ...parsed.data }))
    if (action === 'resume') return revenueOsSuccess(await resumePropagation({ tenantId, actor, ...parsed.data }))
    return revenueOsSuccess(await cancelPropagation({ tenantId, actor, ...parsed.data }))
  } catch (error) { return revenueOsErrorResponse(error) }
}

export async function handleExecutionAction(request: NextRequest, action: 'approve' | 'reject' | 'retry' | 'rollback' | 'compensate') {
  try {
    const user = await authenticatedUser()
    const raw = await request.json().catch(() => ({}))
    const tenantId = tenantOf(user, raw)
    const actor = actorOf(user, tenantId)
    if (action === 'approve') {
      const parsed = approveActionSchema.safeParse(raw)
      if (!parsed.success) throw validationError(parsed.error.issues.map((issue) => issue.message).join('; '))
      return revenueOsSuccess(await approveExecutionAction({ tenantId, actor, ...parsed.data }))
    }
    if (action === 'reject') {
      const parsed = rejectActionSchema.safeParse(raw)
      if (!parsed.success) throw validationError(parsed.error.issues.map((issue) => issue.message).join('; '))
      return revenueOsSuccess(await rejectExecutionAction({ tenantId, actor, ...parsed.data }))
    }
    if (action === 'retry') {
      const parsed = retrySchema.safeParse(raw)
      if (!parsed.success) throw validationError(parsed.error.issues.map((issue) => issue.message).join('; '))
      return revenueOsSuccess(await retryExecutionAction({ tenantId, actor, ...parsed.data }))
    }
    const parsed = rollbackSchema.safeParse(raw)
    if (!parsed.success) throw validationError(parsed.error.issues.map((issue) => issue.message).join('; '))
    return revenueOsSuccess(await compensateExecutionAction({ tenantId, actor, actionId: parsed.data.actionId, reason: parsed.data.reason }))
  } catch (error) { return revenueOsErrorResponse(error) }
}

export async function handleAdapter(request: NextRequest, action: 'test' | 'suspend' | 'restore') {
  try {
    const user = await authenticatedUser()
    const raw = await request.json().catch(() => ({}))
    const tenantId = tenantOf(user, raw)
    const actor = actorOf(user, tenantId)
    const parsed = adapterControlSchema.safeParse(raw)
    if (!parsed.success) throw validationError(parsed.error.issues.map((issue) => issue.message).join('; '))
    if (action === 'test') return revenueOsSuccess({ action, adapter: parsed.data.adapterCode, health: await adapterRegistry().resolve(parsed.data.adapterCode).health(), reason: parsed.data.reason })
    return revenueOsSuccess(await controlAdapter({ tenantId, actor, adapterCode: parsed.data.adapterCode, enabled: action === 'restore', reason: parsed.data.reason }))
  } catch (error) { return revenueOsErrorResponse(error) }
}

export async function handleDashboard() {
  try {
    const user = await authenticatedUser()
    return revenueOsSuccess(await executionDashboard(tenantOf(user)))
  } catch (error) { return revenueOsErrorResponse(error) }
}
