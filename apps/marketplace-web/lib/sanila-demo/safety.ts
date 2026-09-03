import { createServiceClient } from '@/lib/supabase/server'
import { decideSanilaExternalSideEffect, type SanilaDemoSafetyContext, type SanilaExternalChannel } from './safety-policy'
export { MASTER_DEMO_SAFE_RESULT, decideSanilaExternalSideEffect } from './safety-policy'
export type { SanilaDemoSafetyContext, SanilaExternalChannel } from './safety-policy'

export async function getSanilaDemoSafetyContext(input: { tenantId?: string | null; schoolId?: string | null }): Promise<SanilaDemoSafetyContext> {
  if (!input.tenantId && !input.schoolId) return { isMasterDemo: false, configId: null, schoolId: null, tenantId: null, accessStatus: null, safetyStatus: null, billingMode: null }
  const db = await createServiceClient()
  let query = db.from('sanila_demo_configs').select('id,operator_tenant_id,school_id,classification,active,access_status,billing_mode,safety_status').eq('classification', 'master_demo').eq('active', true)
  query = input.tenantId ? query.eq('operator_tenant_id', input.tenantId) : query.eq('school_id', input.schoolId!)
  const { data, error } = await query.maybeSingle()
  if (error && ['42P01', '42703', 'PGRST204', 'PGRST205'].includes(String(error.code || ''))) return { isMasterDemo: false, configId: null, schoolId: input.schoolId || null, tenantId: input.tenantId || null, accessStatus: null, safetyStatus: null, billingMode: null }
  if (error) throw new Error(error.message)
  if (!data) return { isMasterDemo: false, configId: null, schoolId: input.schoolId || null, tenantId: input.tenantId || null, accessStatus: null, safetyStatus: null, billingMode: null }
  return { isMasterDemo: true, configId: String(data.id), schoolId: String(data.school_id), tenantId: String(data.operator_tenant_id), accessStatus: data.access_status, safetyStatus: data.safety_status, billingMode: data.billing_mode }
}

export async function isMasterDemoScope(input: { tenantId?: string | null; schoolId?: string | null }) { return (await getSanilaDemoSafetyContext(input)).isMasterDemo }

export async function assertExternalSideEffectAllowed(input: { channel: SanilaExternalChannel; operation: string; tenantId?: string | null; schoolId?: string | null; actorUserId?: string | null; metadata?: Record<string, unknown>; simulate?: boolean }) {
  const context = await getSanilaDemoSafetyContext(input)
  const decision = decideSanilaExternalSideEffect(context, input.simulate !== false)
  if (decision.allowed) return { ...decision, context }
  const db = await createServiceClient()
  await db.from('sanila_demo_side_effect_events').insert({ config_id: context.configId, school_id: context.schoolId, channel: input.channel, operation: input.operation, outcome: decision.outcome, actor_user_id: input.actorUserId || null, metadata: { ...(input.metadata || {}), authority: 'sanila_master_demo_safety_v1' } })
  return { ...decision, context }
}
