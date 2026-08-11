import { NextResponse } from 'next/server'

export type OperationalWiringKey =
  | 'email_os.compose_send'
  | 'email_os.ai_assist'
  | 'email_os.compose_attachments'
  | 'capital.tasks.create'
  | 'capital.tasks.import'
  | 'revenue.tasks.update'

type OperationalStaticWiring = {
  wiringKey: OperationalWiringKey
  routePath: string
  method: 'POST' | 'PATCH'
  actionKey: string
  targetModule: string
  quantityStrategy: string
}

type OperationalActionOptions = {
  orgId?: string | null
  quantity?: number
  idempotencyKey?: string
  metadata?: Record<string, unknown>
}

type OperationalGuard = {
  ok: boolean
  allowed: boolean
  decision: string
  reason: string
  actionKey?: string
  featureKey?: string | null
  meterKey?: string | null
  guardStage?: string
  guardDecisionId?: string | null
  credits?: unknown
  capacity?: unknown
}

export const OPERATIONAL_ACTION_WIRING: OperationalStaticWiring[] = [
  {
    wiringKey: 'email_os.compose_send',
    routePath: '/api/email-os/compose/send',
    method: 'POST',
    actionKey: 'communication.email_send',
    targetModule: 'email_os',
    quantityStrategy: 'recipient_count',
  },
  {
    wiringKey: 'email_os.ai_assist',
    routePath: '/api/email-os/ai-assist',
    method: 'POST',
    actionKey: 'ai.message_generate',
    targetModule: 'email_os',
    quantityStrategy: 'fixed_1',
  },
  {
    wiringKey: 'email_os.compose_attachments',
    routePath: '/api/email-os/compose/attachments',
    method: 'POST',
    actionKey: 'document.attachment_register',
    targetModule: 'email_os',
    quantityStrategy: 'attachment_storage',
  },
  {
    wiringKey: 'capital.tasks.create',
    routePath: '/api/capital-command-center/tasks',
    method: 'POST',
    actionKey: 'operations.task_create',
    targetModule: 'capital_command_center',
    quantityStrategy: 'fixed_or_starter_count',
  },
  {
    wiringKey: 'capital.tasks.import',
    routePath: '/api/capital-command-center/tasks/import',
    method: 'POST',
    actionKey: 'operations.task_import',
    targetModule: 'capital_command_center',
    quantityStrategy: 'row_count',
  },
  {
    wiringKey: 'revenue.tasks.update',
    routePath: '/api/tasks',
    method: 'PATCH',
    actionKey: 'operations.task_update',
    targetModule: 'revenue_tasks',
    quantityStrategy: 'fixed_1',
  },
]

export function countEmailRecipients(...values: unknown[]) {
  const unique = new Set<string>()
  for (const value of values) {
    if (!value) continue
    const parts = Array.isArray(value) ? value : String(value).split(/[;,]/)
    for (const part of parts) {
      const item = String(part || '').trim().toLowerCase()
      if (item) unique.add(item)
    }
  }
  return Math.max(unique.size, 1)
}

export function estimateStorageGbFromBytes(bytes: unknown) {
  const parsed = Number(bytes || 0)
  if (!Number.isFinite(parsed) || parsed <= 0) return 1
  return Math.max(1, Number((parsed / (1024 * 1024 * 1024)).toFixed(3)))
}

export function buildOperationalIdempotencyKey(prefix: string, seed?: unknown) {
  const cleanSeed = String(seed || '')
    .trim()
    .replace(/[^a-zA-Z0-9_.:-]/g, '-')
    .slice(0, 120)

  return `${prefix}:${cleanSeed || `${Date.now()}:${Math.random().toString(36).slice(2, 10)}`}`
}

export function operationalActionBlockedResponse(
  result: { guard?: OperationalGuard; error?: string },
  status = 409,
) {
  const guard = result.guard

  const response = NextResponse.json(
    {
      ok: false,
      error: result.error || guard?.reason || 'Operational action was blocked.',
      execution: {
        blocked: true,
        decision: guard?.decision || 'blocked',
        reason: guard?.reason || result.error || 'Operational action was blocked.',
        actionKey: guard?.actionKey,
        guardStage: guard?.guardStage,
      },
    },
    { status },
  )

  response.headers.set('Cache-Control', 'no-store')
  return response
}

/**
 * Neutral shared Ops execution wrapper.
 *
 * AngelCare 360 used to own policy/capacity enforcement for these six routes.
 * AC360 is now a separate Marketplace product, so surviving Ops services must
 * not import or query the AC360 policy runtime. This wrapper preserves the
 * callers' { ok, data, guard, usage } contract while executing the surviving
 * Ops action independently.
 */
export async function runOperationalWiredAction<T>(
  wiringKey: OperationalWiringKey,
  executor: () => Promise<T>,
  options: OperationalActionOptions = {},
) {
  const wiring = OPERATIONAL_ACTION_WIRING.find((item) => item.wiringKey === wiringKey)

  if (!wiring) {
    const guard: OperationalGuard = {
      ok: false,
      allowed: false,
      decision: 'unknown_wiring',
      reason: `Unknown operational wiring key: ${wiringKey}`,
      guardStage: 'ops_shared_runtime',
    }

    return {
      ok: false as const,
      error: guard.reason,
      guard,
      usage: null,
    }
  }

  const rawQuantity = Number(options.quantity ?? 1)
  const quantity = Number.isFinite(rawQuantity) && rawQuantity > 0 ? rawQuantity : 1

  const data = await executor()

  const guard: OperationalGuard = {
    ok: true,
    allowed: true,
    decision: 'allowed',
    reason: 'Shared Ops action is independent from the retired AC360 policy runtime.',
    actionKey: wiring.actionKey,
    featureKey: null,
    meterKey: null,
    guardStage: 'ops_shared_runtime',
    guardDecisionId: null,
    credits: null,
    capacity: null,
  }

  return {
    ok: true as const,
    data,
    guard,
    usage: {
      recorded: false,
      quantity,
      idempotencyKey: options.idempotencyKey || null,
      orgId: options.orgId || null,
      wiringKey,
      actionKey: wiring.actionKey,
      routePath: wiring.routePath,
      targetModule: wiring.targetModule,
      quantityStrategy: wiring.quantityStrategy,
      metadata: options.metadata || {},
      runtime: 'ops_shared',
    },
  }
}
