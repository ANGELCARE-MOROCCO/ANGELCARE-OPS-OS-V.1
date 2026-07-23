import crypto from 'node:crypto'
import type { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/getUser'
import { RevenueOsError } from '../errors'
import { revenueOsErrorResponse, revenueOsSuccess } from '../http'
import { actorOf, executionRights, tenantOf } from './api-access'
import {
  activateSchema,
  adapterControlSchema,
  approveActionSchema,
  prepareSchema,
  rejectActionSchema,
  retrySchema,
  rollbackSchema,
  runActionSchema,
} from './schemas'
import {
  activatePropagation,
  approveExecutionAction,
  compensateExecutionAction,
  executionDashboard,
  preparePropagation,
  rejectExecutionAction,
  retryExecutionAction,
  validatePropagationPackage,
} from './service'
import { adapterRegistry } from './registry'

async function authenticatedUser() {
  const user = await getCurrentUser()
  if (!user) {
    throw new RevenueOsError('REVENUE_OS_UNAUTHENTICATED', 'Authentification requise.', {
      status: 401,
      recoverable: true,
    })
  }
  return user
}

function validationError(message: string) {
  return new RevenueOsError('REVENUE_OS_INVALID_INPUT', message, { status: 422, recoverable: true })
}

export async function handlePropagation(
  request: NextRequest,
  action: 'validate' | 'prepare' | 'activate' | 'pause' | 'resume' | 'cancel',
) {
  try {
    const user = await authenticatedUser()
    const rights = executionRights(user)
    const raw = await request.json().catch(() => ({}))
    const tenantId = tenantOf(user, raw)
    const actor = actorOf(user, tenantId)

    if (action === 'validate') {
      if (!rights.view) throw new RevenueOsError('REVENUE_OS_PERMISSION_DENIED', 'Permission requise.', { status: 403 })
      const parsed = prepareSchema.pick({ packageId: true }).safeParse(raw)
      if (!parsed.success) throw validationError(parsed.error.issues.map((issue) => issue.message).join('; '))
      return revenueOsSuccess(await validatePropagationPackage(tenantId, parsed.data.packageId))
    }

    if (action === 'prepare') {
      if (!rights.prepare) throw new RevenueOsError('REVENUE_OS_PERMISSION_DENIED', 'Permission de préparation requise.', { status: 403 })
      const parsed = prepareSchema.safeParse(raw)
      if (!parsed.success) throw validationError(parsed.error.issues.map((issue) => issue.message).join('; '))
      const idempotencyKey =
        request.headers.get('idempotency-key') || parsed.data.idempotencyKey || crypto.randomUUID()
      return revenueOsSuccess(
        await preparePropagation({ tenantId, actor, ...parsed.data, idempotencyKey }),
      )
    }

    if (action === 'activate') {
      if (!rights.activate) throw new RevenueOsError('REVENUE_OS_PERMISSION_DENIED', 'Permission d’activation requise.', { status: 403 })
      const parsed = activateSchema.safeParse(raw)
      if (!parsed.success) throw validationError(parsed.error.issues.map((issue) => issue.message).join('; '))
      return revenueOsSuccess(await activatePropagation({ tenantId, actor, ...parsed.data }))
    }

    const parsed = runActionSchema.safeParse(raw)
    if (!parsed.success) throw validationError(parsed.error.issues.map((issue) => issue.message).join('; '))

    return revenueOsSuccess({ runId: parsed.data.runId, status: action, reason: parsed.data.reason })
  } catch (error) {
    return revenueOsErrorResponse(error)
  }
}

export async function handleExecutionAction(
  request: NextRequest,
  action: 'approve' | 'reject' | 'retry' | 'rollback' | 'compensate',
) {
  try {
    const user = await authenticatedUser()
    const rights = executionRights(user)
    const raw = await request.json().catch(() => ({}))
    const tenantId = tenantOf(user, raw)
    const actor = actorOf(user, tenantId)

    if (action === 'approve') {
      if (!rights.approve) throw new RevenueOsError('REVENUE_OS_PERMISSION_DENIED', 'Permission d’approbation requise.', { status: 403 })
      const parsed = approveActionSchema.safeParse(raw)
      if (!parsed.success) throw validationError(parsed.error.issues.map((issue) => issue.message).join('; '))
      return revenueOsSuccess(await approveExecutionAction({ tenantId, actor, ...parsed.data }))
    }

    if (action === 'reject') {
      if (!rights.approve) throw new RevenueOsError('REVENUE_OS_PERMISSION_DENIED', 'Permission d’approbation requise.', { status: 403 })
      const parsed = rejectActionSchema.safeParse(raw)
      if (!parsed.success) throw validationError(parsed.error.issues.map((issue) => issue.message).join('; '))
      return revenueOsSuccess(await rejectExecutionAction({ tenantId, actor, ...parsed.data }))
    }

    if (action === 'retry') {
      if (!rights.operate) throw new RevenueOsError('REVENUE_OS_PERMISSION_DENIED', 'Permission opérateur requise.', { status: 403 })
      const parsed = retrySchema.safeParse(raw)
      if (!parsed.success) throw validationError(parsed.error.issues.map((issue) => issue.message).join('; '))
      return revenueOsSuccess(await retryExecutionAction({ tenantId, actor, ...parsed.data }))
    }

    if (!rights.rollback) {
      throw new RevenueOsError('REVENUE_OS_PERMISSION_DENIED', 'Permission rollback requise.', { status: 403 })
    }
    const parsed = rollbackSchema.safeParse(raw)
    if (!parsed.success) throw validationError(parsed.error.issues.map((issue) => issue.message).join('; '))
    return revenueOsSuccess(
      await compensateExecutionAction({
        tenantId,
        actor,
        actionId: parsed.data.actionId,
        reason: parsed.data.reason,
      }),
    )
  } catch (error) {
    return revenueOsErrorResponse(error)
  }
}

export async function handleAdapter(
  request: NextRequest,
  action: 'test' | 'suspend' | 'restore',
) {
  try {
    const user = await authenticatedUser()
    if (!executionRights(user).admin) {
      throw new RevenueOsError('REVENUE_OS_PERMISSION_DENIED', 'Permission administrateur requise.', { status: 403 })
    }
    const raw = await request.json().catch(() => ({}))
    tenantOf(user, raw)
    const parsed = adapterControlSchema.safeParse(raw)
    if (!parsed.success) throw validationError(parsed.error.issues.map((issue) => issue.message).join('; '))
    const adapter = adapterRegistry().resolve(parsed.data.adapterCode)
    const health = await adapter.health()
    return revenueOsSuccess({ action, adapter: parsed.data.adapterCode, health, reason: parsed.data.reason })
  } catch (error) {
    return revenueOsErrorResponse(error)
  }
}

export async function handleDashboard() {
  try {
    const user = await authenticatedUser()
    if (!executionRights(user).view) {
      throw new RevenueOsError('REVENUE_OS_PERMISSION_DENIED', 'Permission requise.', { status: 403 })
    }
    return revenueOsSuccess(await executionDashboard(tenantOf(user)))
  } catch (error) {
    return revenueOsErrorResponse(error)
  }
}
