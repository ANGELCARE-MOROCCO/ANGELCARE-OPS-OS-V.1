import crypto from 'node:crypto'
import type { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/getUser'
import { RevenueOsError } from '../errors'
import { revenueOsErrorResponse, revenueOsSuccess } from '../http'
import { actorOf, compilerRights, tenantOf } from './api-access'
import { compileInputSchema } from './schemas'
import { compileApprovedStrategy, previewCompilation, recompileApprovedStrategy } from './service'

export async function handleCompile(
  request: NextRequest,
  mode: 'preview' | 'validate' | 'compile' | 'recompile' | 'partial_recompile',
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new RevenueOsError('REVENUE_OS_UNAUTHENTICATED', 'Authentification requise.', {
        status: 401,
        recoverable: true,
      })
    }

    const rights = compilerRights(user)
    if ((mode === 'preview' || mode === 'validate') && !rights.view) {
      throw new RevenueOsError('REVENUE_OS_PERMISSION_DENIED', 'Permission de consultation compilateur requise.', { status: 403 })
    }
    if (mode === 'compile' && !rights.compile) {
      throw new RevenueOsError('REVENUE_OS_PERMISSION_DENIED', 'Permission de compilation requise.', { status: 403 })
    }
    if ((mode === 'recompile' || mode === 'partial_recompile') && !rights.recompile) {
      throw new RevenueOsError('REVENUE_OS_PERMISSION_DENIED', 'Permission de recompilation requise.', { status: 403 })
    }

    const raw = await request.json()
    const parsed = compileInputSchema.safeParse(raw)
    if (!parsed.success) {
      throw new RevenueOsError('REVENUE_OS_INVALID_INPUT', parsed.error.message, {
        status: 422,
        recoverable: true,
      })
    }

    const tenantId = tenantOf(user, raw)
    const input = {
      tenantId,
      actor: actorOf(user, tenantId),
      ...parsed.data,
      idempotencyKey:
        request.headers.get('idempotency-key') || parsed.data.idempotencyKey || crypto.randomUUID(),
      dryRun: mode === 'preview' || mode === 'validate',
    }

    const result =
      mode === 'recompile' || mode === 'partial_recompile'
        ? await recompileApprovedStrategy(input)
        : mode === 'compile'
          ? await compileApprovedStrategy(input)
          : await previewCompilation(input)

    return revenueOsSuccess(result, {
      status: mode === 'compile' ? 201 : 200,
      meta: { mode: 'shadow', externalActions: 0 },
    })
  } catch (error) {
    if (error instanceof Error && /BLOCKED|REQUIRED|MISMATCH/.test(error.message)) {
      return revenueOsErrorResponse(
        new RevenueOsError('REVENUE_OS_CONFLICT', error.message, {
          status: 409,
          recoverable: true,
          cause: error,
        }),
      )
    }
    return revenueOsErrorResponse(error)
  }
}
