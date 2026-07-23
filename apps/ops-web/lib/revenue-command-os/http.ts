import 'server-only'
import { NextResponse } from 'next/server'
import { normalizeRevenueOsError, publicRevenueOsMessage, RevenueOsError } from './errors'

export interface RevenueOsErrorEnvelope {
  ok: false
  error: {
    code: string
    message: string
    traceId: string
    recoverable: boolean
    details?: Record<string, unknown>
  }
  externalActionsExecuted: 0
}

export function revenueOsSuccess<T>(
  data: T,
  init: { status?: number; headers?: HeadersInit; meta?: Record<string, unknown> } = {},
) {
  return NextResponse.json(
    {
      ok: true,
      data,
      ...(init.meta ? { meta: init.meta } : {}),
      externalActionsExecuted: 0,
    },
    {
      status: init.status ?? 200,
      headers: { 'Cache-Control': 'no-store', ...(init.headers ?? {}) },
    },
  )
}

export function revenueOsErrorResponse(error: unknown) {
  const normalized = normalizeRevenueOsError(error)

  console.warn('[RevenueOS:Handled]', {
    traceId: normalized.traceId,
    code: normalized.code,
    status: normalized.status,
    message: normalized.message,
    context: normalized.context,
    cause: normalized.cause,
  })

  const details = normalized.context
    ? Object.fromEntries(
        Object.entries(normalized.context).filter(([key]) => !/secret|token|cookie|password|authorization/i.test(key)),
      )
    : undefined

  const publicMessage = publicRevenueOsMessage(normalized.message, normalized.code)

  const body: RevenueOsErrorEnvelope = {
    ok: false,
    error: {
      code: normalized.code,
      message: publicMessage,
      traceId: normalized.traceId,
      recoverable: normalized.recoverable,
      ...(details && Object.keys(details).length ? { details } : {}),
    },
    externalActionsExecuted: 0,
  }

  return NextResponse.json(body, {
    status: normalized.status,
    headers: { 'Cache-Control': 'no-store', 'X-Revenue-Trace-Id': normalized.traceId },
  })
}

export function invalidRevenueOsAction(action: string): never {
  throw new RevenueOsError('REVENUE_OS_ACTION_NOT_ALLOWED', `Action Revenue OS non supportée: ${action || 'vide'}.`, {
    status: 400,
    recoverable: false,
  })
}
