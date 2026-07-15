import { createClient } from '@/lib/supabase/server'

type AnyRow = Record<string, any>

function normalizeKey(value: unknown) {
  const key = String(value || '').trim()
  return key.length >= 8 ? key.slice(0, 160) : ''
}

async function safeMaybeSingle<T = AnyRow>(query: any): Promise<T | null> {
  try {
    const { data, error } = await query
    if (error) return null
    return (data || null) as T | null
  } catch {
    return null
  }
}

async function safeWrite(query: any) {
  try {
    await query
  } catch {
    // Idempotency persistence must never block field execution.
  }
}

export async function beginCareLinkMobileAction(args: {
  missionId?: number | null
  caregiverId: number
  actionType: string
  idempotencyKey?: string | null
  payload?: Record<string, unknown>
}) {
  const idempotencyKey = normalizeKey(args.idempotencyKey)
  if (!idempotencyKey) return { duplicate: false, existing: null as AnyRow | null, idempotencyKey: null as string | null }

  const supabase = await createClient()
  const existing = await safeMaybeSingle<AnyRow>(supabase
    .from('carelink_mobile_action_requests')
    .select('*')
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle())

  if (existing?.status === 'completed') {
    return { duplicate: true, existing, idempotencyKey }
  }

  await safeWrite(supabase.from('carelink_mobile_action_requests').upsert([{
    idempotency_key: idempotencyKey,
    mission_id: args.missionId ?? null,
    caregiver_id: args.caregiverId,
    action_type: args.actionType,
    status: 'started',
    request_payload: args.payload || {},
    updated_at: new Date().toISOString(),
  }], { onConflict: 'idempotency_key' }))

  return { duplicate: false, existing: null as AnyRow | null, idempotencyKey }
}

export async function completeCareLinkMobileAction(args: {
  idempotencyKey?: string | null
  responsePayload?: Record<string, unknown>
}) {
  const idempotencyKey = normalizeKey(args.idempotencyKey)
  if (!idempotencyKey) return

  const supabase = await createClient()
  await safeWrite(supabase.from('carelink_mobile_action_requests').update({
    status: 'completed',
    response_payload: args.responsePayload || {},
    completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('idempotency_key', idempotencyKey))
}


export async function failCareLinkMobileAction(args: {
  idempotencyKey?: string | null
  error?: unknown
  responsePayload?: Record<string, unknown>
}) {
  const idempotencyKey = normalizeKey(args.idempotencyKey)
  if (!idempotencyKey) return

  const message = args.error instanceof Error ? args.error.message : args.error ? String(args.error) : 'CareLink mobile action failed'
  const supabase = await createClient()
  await safeWrite(supabase.from('carelink_mobile_action_requests').update({
    status: 'failed',
    failed_at: new Date().toISOString(),
    response_payload: { error: message, ...(args.responsePayload || {}) },
    updated_at: new Date().toISOString(),
  }).eq('idempotency_key', idempotencyKey))
}
