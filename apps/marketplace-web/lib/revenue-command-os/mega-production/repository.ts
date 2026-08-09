import 'server-only'
import { createServiceClient } from '@/lib/supabase/server'
import { normalizeRevenueOsError, RevenueOsError } from '../errors'
import type {
  Anomaly,
  AttributionResult,
  CommandPerformance,
  ConfidencePolicy,
  DisasterRecoverySummary,
  EmergencyStop,
  EvaluationSummary,
  MegaCapabilityKey,
  MegaSourceCriticality,
  MegaSourceHealth,
  ForecastCalibration,
  ProductionActivation,
  QueueHealth,
  RegistryEntry,
  RevenueExperiment,
  SecurityReview,
  SegmentLearning,
  StrategyOutcome,
  WorkerHealth,
} from './types'

export type MegaSources = {
  outcomes: StrategyOutcome[]
  commandPerformance: CommandPerformance[]
  segments: SegmentLearning[]
  experiments: RevenueExperiment[]
  attributions: AttributionResult[]
  calibrations: ForecastCalibration[]
  anomalies: Anomaly[]
  workers: WorkerHealth[]
  queues: QueueHealth[]
  registries: RegistryEntry[]
  evaluations: EvaluationSummary[]
  confidencePolicies: ConfidencePolicy[]
  emergencyStops: EmergencyStop[]
  activations: ProductionActivation[]
  securityReviews: SecurityReview[]
  drRuns: DisasterRecoverySummary[]
  costUsage: any[]
  costBudgets: any[]
}

interface MegaSourceDefinition {
  key: keyof MegaSources
  label: string
  table: string
  capability: MegaCapabilityKey
  criticality: MegaSourceCriticality
  limit: number
  order: string
}

export const MEGA_SOURCE_DEFINITIONS: readonly MegaSourceDefinition[] = [
  { key: 'outcomes', label: 'Mémoire des résultats', table: 'revenue_os_strategy_outcomes', capability: 'learning', criticality: 'operational', limit: 80, order: 'observed_at' },
  { key: 'commandPerformance', label: 'Classement des commandes', table: 'revenue_os_command_performance', capability: 'learning', criticality: 'operational', limit: 200, order: 'updated_at' },
  { key: 'segments', label: 'Apprentissage des segments', table: 'revenue_os_segment_response_models', capability: 'learning', criticality: 'advisory', limit: 120, order: 'recalculated_at' },
  { key: 'experiments', label: 'Expériences contrôlées', table: 'revenue_os_experiments', capability: 'experimentation', criticality: 'operational', limit: 100, order: 'updated_at' },
  { key: 'attributions', label: 'Attribution causale', table: 'revenue_os_attribution_results', capability: 'attribution', criticality: 'advisory', limit: 100, order: 'observed_at' },
  { key: 'calibrations', label: 'Calibration des prévisions', table: 'revenue_os_forecast_calibrations', capability: 'forecasting', criticality: 'advisory', limit: 120, order: 'observed_at' },
  { key: 'anomalies', label: 'Anomalies opérationnelles', table: 'revenue_os_anomalies', capability: 'forecasting', criticality: 'operational', limit: 150, order: 'detected_at' },
  { key: 'workers', label: 'Registre des workers', table: 'revenue_os_worker_registry', capability: 'runtime', criticality: 'operational', limit: 100, order: 'heartbeat_at' },
  { key: 'queues', label: 'Santé des files', table: 'revenue_os_queue_health_snapshots', capability: 'runtime', criticality: 'operational', limit: 100, order: 'observed_at' },
  { key: 'registries', label: 'Registres gouvernés', table: 'revenue_os_registry_entries', capability: 'governance', criticality: 'operational', limit: 200, order: 'updated_at' },
  { key: 'evaluations', label: 'Évaluations et non-régression', table: 'revenue_os_evaluation_runs', capability: 'quality', criticality: 'advisory', limit: 100, order: 'observed_at' },
  { key: 'confidencePolicies', label: 'Politiques de confiance', table: 'revenue_os_confidence_policies', capability: 'governance', criticality: 'operational', limit: 100, order: 'updated_at' },
  { key: 'emergencyStops', label: 'Arrêts d’urgence', table: 'revenue_os_emergency_stops', capability: 'safety', criticality: 'safety', limit: 100, order: 'updated_at' },
  { key: 'activations', label: 'Activations de production', table: 'revenue_os_production_activations', capability: 'activation', criticality: 'safety', limit: 30, order: 'updated_at' },
  { key: 'securityReviews', label: 'Revues de sécurité', table: 'revenue_os_security_reviews', capability: 'safety', criticality: 'safety', limit: 30, order: 'updated_at' },
  { key: 'drRuns', label: 'Exercices de reprise', table: 'revenue_os_disaster_recovery_runs', capability: 'recovery', criticality: 'safety', limit: 30, order: 'updated_at' },
  { key: 'costUsage', label: 'Consommation des coûts', table: 'revenue_os_cost_usage', capability: 'finops', criticality: 'advisory', limit: 100, order: 'observed_at' },
  { key: 'costBudgets', label: 'Budgets de production', table: 'revenue_os_cost_budgets', capability: 'finops', criticality: 'operational', limit: 30, order: 'updated_at' },
]


async function db(): Promise<any> {
  return (await createServiceClient()) as any
}

async function readSource(
  definition: MegaSourceDefinition,
  tenantId: string,
): Promise<{ key: keyof MegaSources; rows: any[]; health: MegaSourceHealth }> {
  const queriedAt = new Date().toISOString()

  try {
    const client = await db()
    let query = client
      .from(definition.table)
      .select('*')
      .eq('tenant_id', tenantId)
      .limit(definition.limit)

    if (definition.order) query = query.order(definition.order, { ascending: false })

    const result = await query
    if (result.error) throw result.error
    const rows = result.data ?? []

    return {
      key: definition.key,
      rows,
      health: {
        key: definition.key,
        label: definition.label,
        table: definition.table,
        capability: definition.capability,
        criticality: definition.criticality,
        ok: true,
        count: rows.length,
        queriedAt,
        recoverable: false,
      },
    }
  } catch (error) {
    const normalized = normalizeRevenueOsError(error)
    return {
      key: definition.key,
      rows: [],
      health: {
        key: definition.key,
        label: definition.label,
        table: definition.table,
        capability: definition.capability,
        criticality: definition.criticality,
        ok: false,
        count: 0,
        queriedAt,
        recoverable: normalized.recoverable,
        errorCode: normalized.code,
        message: normalized.message,
        traceId: normalized.traceId,
      },
    }
  }
}

export async function loadMegaSources(tenantId: string): Promise<{
  data: MegaSources
  sourceHealth: MegaSourceHealth[]
}> {
  const results = await Promise.all(
    MEGA_SOURCE_DEFINITIONS.map((definition) => readSource(definition, tenantId)),
  )

  const data = Object.fromEntries(results.map((result) => [result.key, result.rows])) as MegaSources
  const sourceHealth = results.map((result) => result.health)

  return { data, sourceHealth }
}

export async function probeMegaSources(tenantId: string, sourceKeys: string[]): Promise<MegaSourceHealth[]> {
  const definitions = MEGA_SOURCE_DEFINITIONS.filter((definition) => sourceKeys.includes(definition.key))
  return Promise.all(definitions.map(async (definition) => (await readSource(definition, tenantId)).health))
}

export async function insertRow(table: string, payload: Record<string, unknown>): Promise<any> {
  try {
    const client = await db()
    const result = await client.from(table).insert(payload).select('*').single()
    if (result.error) throw result.error
    return result.data
  } catch (error) {
    const normalized = normalizeRevenueOsError(error)
    throw new RevenueOsError('REVENUE_OS_STORAGE_FAILURE', normalized.message, {
      status: normalized.status,
      recoverable: normalized.recoverable,
      cause: error,
      context: { ...normalized.context, table, operation: 'insert' },
    })
  }
}

export async function updateRow(
  table: string,
  id: string,
  tenantId: string,
  payload: Record<string, unknown>,
): Promise<any> {
  try {
    const client = await db()
    const result = await client
      .from(table)
      .update(payload)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select('*')
      .maybeSingle()
    if (result.error) throw result.error
    if (!result.data) {
      throw new RevenueOsError('REVENUE_OS_NOT_FOUND', 'Ressource Revenue OS introuvable dans ce tenant.', {
        status: 404,
        recoverable: false,
        context: { table, id },
      })
    }
    return result.data
  } catch (error) {
    if (error instanceof RevenueOsError) throw error
    const normalized = normalizeRevenueOsError(error)
    throw new RevenueOsError('REVENUE_OS_STORAGE_FAILURE', normalized.message, {
      status: normalized.status,
      recoverable: normalized.recoverable,
      cause: error,
      context: { ...normalized.context, table, operation: 'update', id },
    })
  }
}

export async function appendAudit(
  tenantId: string,
  actorId: string,
  eventType: string,
  objectType: string,
  objectId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  await insertRow('revenue_os_mega_production_audit_events', {
    tenant_id: tenantId,
    actor_id: actorId,
    event_type: eventType,
    object_type: objectType,
    object_id: objectId,
    payload,
  })
}
