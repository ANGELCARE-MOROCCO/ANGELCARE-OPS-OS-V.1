import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'
import { AC360_PHASE1_TABLES } from './constants'
import type { Ac360AccessDecision, Ac360FoundationSnapshot, Ac360UsageRecordInput } from './types'

type SupabaseLike = Awaited<ReturnType<typeof createClient>>
type QueryResult<T = any> = { data: T[] | null; error: any }

function normalizeNumber(value: unknown) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

async function listTable<T = any>(db: SupabaseLike, table: string, options?: { order?: string; ascending?: boolean; limit?: number; select?: string }): Promise<{ rows: T[]; error?: string }> {
  try {
    let query = db.from(table).select(options?.select || '*') as any
    if (options?.order) query = query.order(options.order, { ascending: options.ascending ?? false })
    if (options?.limit) query = query.limit(options.limit)
    const result = (await query) as QueryResult<T>
    if (result.error) return { rows: [], error: result.error.message || String(result.error) }
    return { rows: result.data || [] }
  } catch (error) {
    return { rows: [], error: error instanceof Error ? error.message : String(error) }
  }
}

async function countTable(db: SupabaseLike, table: string): Promise<{ count: number; error?: string }> {
  try {
    const { count, error } = await db.from(table).select('*', { count: 'exact', head: true })
    if (error) return { count: 0, error: error.message || String(error) }
    return { count: count || 0 }
  } catch (error) {
    return { count: 0, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function getAc360FoundationSnapshot(): Promise<Ac360FoundationSnapshot> {
  const generatedAt = new Date().toISOString()
  let db: SupabaseLike
  try {
    db = await createClient()
  } catch (error) {
    return {
      ok: false,
      migrated: false,
      generatedAt,
      error: error instanceof Error ? error.message : 'Unable to create Supabase client.',
      counts: {},
      engines: [],
      plans: [],
      features: [],
      addons: [],
      meters: [],
      subscriptions: [],
      restrictions: [],
      recommendations: [],
      usageEvents: [],
      auditLogs: [],
      rules: [],
      missingTables: [...AC360_PHASE1_TABLES],
    }
  }

  const tableCounts = await Promise.all(AC360_PHASE1_TABLES.map(async (table) => [table, await countTable(db, table)] as const))
  const counts: Record<string, number> = {}
  const missingTables: string[] = []
  for (const [table, result] of tableCounts) {
    counts[table] = result.count
    if (result.error) missingTables.push(table)
  }

  const [engines, plans, features, addons, meters, subscriptions, restrictions, recommendations, usageEvents, auditLogs, rules] = await Promise.all([
    listTable(db, 'ac360_foundation_engines', { order: 'engine_code', ascending: true, limit: 80 }),
    listTable(db, 'ac360_plans', { order: 'position', ascending: true, limit: 20 }),
    listTable(db, 'ac360_feature_registry', { order: 'module_key', ascending: true, limit: 200 }),
    listTable(db, 'ac360_addons', { order: 'family', ascending: true, limit: 80 }),
    listTable(db, 'ac360_usage_meters', { order: 'category', ascending: true, limit: 40 }),
    listTable(db, 'ac360_subscriptions', { order: 'created_at', ascending: false, limit: 30 }),
    listTable(db, 'ac360_restrictions', { order: 'created_at', ascending: false, limit: 30 }),
    listTable(db, 'ac360_recommendations', { order: 'created_at', ascending: false, limit: 30 }),
    listTable(db, 'ac360_usage_events', { order: 'created_at', ascending: false, limit: 50 }),
    listTable(db, 'ac360_audit_logs', { order: 'created_at', ascending: false, limit: 50 }),
    listTable(db, 'ac360_automation_rules', { order: 'sort_order', ascending: true, limit: 80 }),
  ])

  return {
    ok: missingTables.length === 0,
    migrated: missingTables.length === 0,
    generatedAt,
    counts,
    engines: engines.rows,
    plans: plans.rows,
    features: features.rows,
    addons: addons.rows,
    meters: meters.rows,
    subscriptions: subscriptions.rows,
    restrictions: restrictions.rows,
    recommendations: recommendations.rows,
    usageEvents: usageEvents.rows,
    auditLogs: auditLogs.rows,
    rules: rules.rows,
    missingTables,
    error: missingTables.length ? `AC360 Phase 1 migration is missing or incomplete: ${missingTables.slice(0, 6).join(', ')}${missingTables.length > 6 ? '…' : ''}` : undefined,
  }
}

export async function evaluateAc360Access(input: { orgId: string; featureKey: string; actionKey?: string; quantity?: number }): Promise<Ac360AccessDecision> {
  if (!input.orgId || !input.featureKey) {
    return { allowed: false, decision: 'error', reason: 'orgId and featureKey are required.', source: 'validation' }
  }

  const db = await createClient()
  try {
    const { data, error } = await db.rpc('ac360_has_feature', {
      p_org_id: input.orgId,
      p_feature_key: input.featureKey,
      p_action_key: input.actionKey || null,
      p_quantity: input.quantity || 1,
    })

    if (error) {
      return { allowed: false, decision: 'error', reason: error.message || 'Entitlement RPC failed.', source: 'rpc' }
    }

    const row = Array.isArray(data) ? data[0] : data
    if (!row) return { allowed: false, decision: 'blocked', reason: 'No entitlement decision returned.', source: 'rpc' }

    return {
      allowed: Boolean(row.allowed),
      decision: row.decision || (row.allowed ? 'allowed' : 'blocked'),
      reason: row.reason || 'AC360 entitlement decision returned.',
      source: row.source || 'rpc',
      accessMode: row.access_mode || null,
      limitKey: row.limit_key || null,
      limitValue: row.limit_value == null ? null : normalizeNumber(row.limit_value),
      activeSubscriptionId: row.active_subscription_id || null,
    }
  } catch (error) {
    return { allowed: false, decision: 'error', reason: error instanceof Error ? error.message : 'Entitlement evaluation failed.', source: 'exception' }
  }
}

export async function recordAc360UsageEvent(input: Ac360UsageRecordInput) {
  if (!input.orgId || !input.meterKey) {
    return { ok: false, error: 'orgId and meterKey are required.' }
  }

  const db = await createClient()
  const actor = await getCurrentUser().catch(() => null) as any
  const actorId = input.actorAppUserId || actor?.id || null

  try {
    const { data, error } = await db.rpc('ac360_record_usage', {
      p_org_id: input.orgId,
      p_meter_key: input.meterKey,
      p_quantity: input.quantity || 1,
      p_feature_key: input.featureKey || null,
      p_action_key: input.actionKey || null,
      p_actor_app_user_id: actorId,
      p_idempotency_key: input.idempotencyKey || null,
      p_metadata: input.metadata || {},
    })

    if (error) return { ok: false, error: error.message || 'Usage recording failed.' }
    return { ok: true, usageEventId: data }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Usage recording failed.' }
  }
}

export async function getAc360ActiveRestrictions(orgId?: string) {
  const db = await createClient()
  let query = db.from('ac360_restrictions').select('*').eq('status', 'active').order('created_at', { ascending: false }).limit(100) as any
  if (orgId) query = query.eq('org_id', orgId)
  const { data, error } = await query
  if (error) return { ok: false, error: error.message || 'Unable to load restrictions.', restrictions: [] }
  return { ok: true, restrictions: data || [] }
}

export function computeAc360Readiness(snapshot: Ac360FoundationSnapshot) {
  const expectedTables = AC360_PHASE1_TABLES.length
  const presentTables = expectedTables - snapshot.missingTables.length
  const engineCount = snapshot.engines.length
  const planCount = snapshot.plans.length
  const featureCount = snapshot.features.length
  const addonCount = snapshot.addons.length
  const meterCount = snapshot.meters.length
  const score = Math.round(((presentTables / expectedTables) * 45) + (Math.min(engineCount, 52) / 52) * 25 + (Math.min(planCount, 3) / 3) * 10 + (Math.min(featureCount, 30) / 30) * 10 + (Math.min(addonCount, 12) / 12) * 5 + (Math.min(meterCount, 7) / 7) * 5)
  return {
    score,
    expectedTables,
    presentTables,
    engineCount,
    planCount,
    featureCount,
    addonCount,
    meterCount,
    status: score >= 95 ? 'foundation_ready' : score >= 75 ? 'migration_partial' : 'not_ready',
  }
}
