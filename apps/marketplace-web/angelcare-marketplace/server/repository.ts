import { createServiceClient } from '@/lib/supabase/server'
import { MODULE_TRANSITIONS, READINESS_TRANSITIONS } from '../domain/constants'
import type {
  MarketplaceAuditEvent,
  MarketplaceConfiguration,
  MarketplaceFeatureFlag,
  MarketplaceModule,
  MarketplaceModuleStatus,
  MarketplaceReadinessCheck,
  MarketplaceReadinessStatus,
  MarketplaceRequestContext,
} from '../domain/types'
import { writeMarketplaceAudit } from '../audit/write-audit'
import { MarketplaceError } from './errors'
import { cleanOptionalText, cleanText, requireText } from './request'

function databaseFailure(error: { message?: string; code?: string } | null, operation: string): MarketplaceError {
  const message = String(error?.message || '')
  const missingFoundation =
    error?.code === '42P01' ||
    message.includes('angelcare_marketplace_') && message.toLowerCase().includes('does not exist')
  return new MarketplaceError(
    missingFoundation ? 'CONFIGURATION_ERROR' : 'INTERNAL_ERROR',
    missingFoundation
      ? 'La migration ANGELCARE Marketplace Mega ZIP 01 doit être appliquée avant cette opération.'
      : `La base de données n’a pas pu exécuter l’opération « ${operation} ».`,
    { cause: error, retryable: true },
  )
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.map((item) => cleanText(item, 160)).filter(Boolean))]
}

function asAudienceArray(value: unknown): MarketplaceModule['audience'] {
  const allowed = new Set([
    'public',
    'parent',
    'tenant',
    'provider',
    'supplier',
    'admin',
    'executive',
    'territory_manager',
  ])
  return asStringArray(value).filter((item) => allowed.has(item)) as MarketplaceModule['audience']
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback
}

export interface ModuleFilters {
  q?: string
  status?: string
  audience?: string
}

export async function listMarketplaceModules(filters: ModuleFilters = {}): Promise<MarketplaceModule[]> {
  const supabase = await createServiceClient()
  let query = supabase
    .from('angelcare_marketplace_modules')
    .select('*')
    .order('navigation_order', { ascending: true })
    .order('name', { ascending: true })

  if (filters.status) query = query.eq('status', filters.status)
  if (filters.audience) query = query.contains('audience', [filters.audience])
  if (filters.q) {
    const escaped = filters.q.replaceAll(',', ' ')
    query = query.or(`name.ilike.%${escaped}%,module_key.ilike.%${escaped}%,description.ilike.%${escaped}%`)
  }

  const { data, error } = await query
  if (error) throw databaseFailure(error, 'liste des modules')
  return (data || []) as MarketplaceModule[]
}

export async function getMarketplaceModule(moduleKey: string): Promise<MarketplaceModule> {
  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('angelcare_marketplace_modules')
    .select('*')
    .eq('module_key', moduleKey)
    .maybeSingle()

  if (error) throw databaseFailure(error, 'lecture du module')
  if (!data) throw new MarketplaceError('NOT_FOUND', 'Le module demandé est introuvable.')
  return data as MarketplaceModule
}

export async function createMarketplaceModule(input: {
  body: Record<string, unknown>
  context: MarketplaceRequestContext
  requestId: string
  request?: Request
}): Promise<MarketplaceModule> {
  const moduleKey = requireText(input.body.moduleKey, 'moduleKey', 'La clé module', 100)
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
  const name = requireText(input.body.name, 'name', 'Le nom du module', 160)
  const routePrefix = requireText(input.body.routePrefix, 'routePrefix', 'La route du module', 240)
  if (!routePrefix.startsWith('/angelcare-marketplace')) {
    throw new MarketplaceError('VALIDATION_ERROR', 'La route doit rester dans /angelcare-marketplace.', {
      fieldErrors: { routePrefix: ['Route hors du périmètre ANGELCARE Marketplace.'] },
    })
  }

  const record = {
    module_key: moduleKey,
    name,
    description: cleanOptionalText(input.body.description, 1000),
    route_prefix: routePrefix,
    module_type: cleanText(input.body.moduleType || 'workspace', 80),
    audience: asAudienceArray(input.body.audience),
    icon_key: cleanOptionalText(input.body.iconKey, 80),
    navigation_group: cleanOptionalText(input.body.navigationGroup, 100),
    navigation_order: Number.isFinite(Number(input.body.navigationOrder))
      ? Number(input.body.navigationOrder)
      : 999,
    status: 'registered',
    enabled: false,
    required_permissions: asStringArray(input.body.requiredPermissions),
    required_dependencies: asStringArray(input.body.requiredDependencies),
    territory_aware: asBoolean(input.body.territoryAware),
    tenant_aware: asBoolean(input.body.tenantAware),
    locale_aware: asBoolean(input.body.localeAware, true),
    feature_flag_key: cleanOptionalText(input.body.featureFlagKey, 120),
    health_status: 'unknown',
    owner_role: cleanOptionalText(input.body.ownerRole, 100),
    introduced_by_mega_zip: Number.isInteger(Number(input.body.introducedByMegaZip))
      ? Math.min(20, Math.max(1, Number(input.body.introducedByMegaZip)))
      : 1,
    version: 1,
    created_by: input.context.actor.id,
    updated_by: input.context.actor.id,
  }

  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('angelcare_marketplace_modules')
    .insert(record)
    .select('*')
    .single()

  if (error?.code === '23505') {
    throw new MarketplaceError('CONFLICT', 'Cette clé module existe déjà.')
  }
  if (error) throw databaseFailure(error, 'création du module')

  await writeMarketplaceAudit({
    context: input.context,
    requestId: input.requestId,
    request: input.request,
    action: 'marketplace.module.registered',
    objectType: 'marketplace_module',
    objectId: String(data.id),
    afterValue: data,
    reason: cleanOptionalText(input.body.reason, 500),
  })
  return data as MarketplaceModule
}

export async function updateMarketplaceModule(input: {
  moduleKey: string
  body: Record<string, unknown>
  context: MarketplaceRequestContext
  requestId: string
  request?: Request
}): Promise<MarketplaceModule> {
  const before = await getMarketplaceModule(input.moduleKey)
  const changes: Record<string, unknown> = {
    updated_by: input.context.actor.id,
    version: before.version + 1,
  }

  if ('name' in input.body) changes.name = requireText(input.body.name, 'name', 'Le nom du module', 160)
  if ('description' in input.body) changes.description = cleanOptionalText(input.body.description, 1000)
  if ('routePrefix' in input.body) {
    const route = requireText(input.body.routePrefix, 'routePrefix', 'La route du module', 240)
    if (!route.startsWith('/angelcare-marketplace')) {
      throw new MarketplaceError('VALIDATION_ERROR', 'La route doit rester dans /angelcare-marketplace.')
    }
    changes.route_prefix = route
  }
  if ('audience' in input.body) changes.audience = asAudienceArray(input.body.audience)
  if ('requiredPermissions' in input.body) {
    changes.required_permissions = asStringArray(input.body.requiredPermissions)
  }
  if ('requiredDependencies' in input.body) {
    changes.required_dependencies = asStringArray(input.body.requiredDependencies)
  }
  if ('navigationOrder' in input.body) changes.navigation_order = Number(input.body.navigationOrder)
  if ('ownerRole' in input.body) changes.owner_role = cleanOptionalText(input.body.ownerRole, 100)
  if ('territoryAware' in input.body) changes.territory_aware = asBoolean(input.body.territoryAware)
  if ('tenantAware' in input.body) changes.tenant_aware = asBoolean(input.body.tenantAware)
  if ('localeAware' in input.body) changes.locale_aware = asBoolean(input.body.localeAware)
  if ('featureFlagKey' in input.body) {
    changes.feature_flag_key = cleanOptionalText(input.body.featureFlagKey, 120)
  }

  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('angelcare_marketplace_modules')
    .update(changes)
    .eq('module_key', input.moduleKey)
    .select('*')
    .single()

  if (error) throw databaseFailure(error, 'mise à jour du module')

  await writeMarketplaceAudit({
    context: input.context,
    requestId: input.requestId,
    request: input.request,
    action: 'marketplace.module.updated',
    objectType: 'marketplace_module',
    objectId: String(data.id),
    beforeValue: before,
    afterValue: data,
    reason: cleanOptionalText(input.body.reason, 500),
  })
  return data as MarketplaceModule
}

export async function transitionMarketplaceModule(input: {
  moduleKey: string
  targetStatus: MarketplaceModuleStatus
  reason: string
  context: MarketplaceRequestContext
  requestId: string
  request?: Request
}): Promise<MarketplaceModule> {
  const before = await getMarketplaceModule(input.moduleKey)
  if (!MODULE_TRANSITIONS[before.status].includes(input.targetStatus)) {
    throw new MarketplaceError(
      'INVALID_STATE_TRANSITION',
      `Le module ne peut pas passer de « ${before.status} » à « ${input.targetStatus} ».`,
    )
  }
  if (!input.reason.trim()) {
    throw new MarketplaceError('VALIDATION_ERROR', 'Une raison est requise pour cette transition.', {
      fieldErrors: { reason: ['Expliquez la décision et son impact.'] },
    })
  }

  if (input.targetStatus === 'enabled' && before.required_dependencies.length) {
    const supabase = await createServiceClient()
    const { data, error } = await supabase
      .from('angelcare_marketplace_modules')
      .select('module_key, status')
      .in('module_key', before.required_dependencies)
    if (error) throw databaseFailure(error, 'contrôle des dépendances')
    const enabled = new Set((data || []).filter((row: { status: string; module_key: string }) => row.status === 'enabled').map((row: { status: string; module_key: string }) => row.module_key))
    const missing = before.required_dependencies.filter((dependency) => !enabled.has(dependency))
    if (missing.length) {
      throw new MarketplaceError(
        'DEPENDENCY_BLOCKED',
        `Activation bloquée. Dépendances non actives : ${missing.join(', ')}.`,
      )
    }
  }

  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('angelcare_marketplace_modules')
    .update({
      status: input.targetStatus,
      enabled: input.targetStatus === 'enabled',
      updated_by: input.context.actor.id,
      version: before.version + 1,
      health_status: input.targetStatus === 'enabled' ? 'healthy' : before.health_status,
    })
    .eq('module_key', input.moduleKey)
    .select('*')
    .single()

  if (error) throw databaseFailure(error, 'transition du module')

  await writeMarketplaceAudit({
    context: input.context,
    requestId: input.requestId,
    request: input.request,
    action: `marketplace.module.${input.targetStatus}`,
    objectType: 'marketplace_module',
    objectId: String(data.id),
    beforeValue: before,
    afterValue: data,
    reason: input.reason,
    severity: input.targetStatus === 'archived' || input.targetStatus === 'blocked' ? 'warning' : 'info',
  })
  return data as MarketplaceModule
}

export async function listMarketplaceFeatureFlags(): Promise<MarketplaceFeatureFlag[]> {
  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('angelcare_marketplace_feature_flags')
    .select('*')
    .order('flag_key', { ascending: true })
  if (error) throw databaseFailure(error, 'liste des feature flags')
  return (data || []) as MarketplaceFeatureFlag[]
}

export async function createMarketplaceFeatureFlag(input: {
  body: Record<string, unknown>
  context: MarketplaceRequestContext
  requestId: string
  request?: Request
}): Promise<MarketplaceFeatureFlag> {
  const flagKey = requireText(input.body.flagKey, 'flagKey', 'La clé du feature flag', 120)
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
  const name = requireText(input.body.name, 'name', 'Le nom du feature flag', 160)
  const scopeType = cleanText(input.body.scopeType || 'global', 40)
  if (!['global', 'territory', 'tenant'].includes(scopeType)) {
    throw new MarketplaceError('VALIDATION_ERROR', 'Le type de périmètre est invalide.')
  }
  const supabase = await createServiceClient()
  const record = {
    flag_key: flagKey,
    name,
    description: cleanOptionalText(input.body.description, 1000),
    enabled: asBoolean(input.body.enabled),
    scope_type: scopeType,
    scope_id: cleanOptionalText(input.body.scopeId, 120),
    rollout_rule:
      input.body.rolloutRule && typeof input.body.rolloutRule === 'object' && !Array.isArray(input.body.rolloutRule)
        ? input.body.rolloutRule
        : {},
    starts_at: cleanOptionalText(input.body.startsAt, 60),
    expires_at: cleanOptionalText(input.body.expiresAt, 60),
    owner_id: input.context.actor.id,
    reason: cleanOptionalText(input.body.reason, 500),
    status: asBoolean(input.body.enabled) ? 'active' : 'draft',
    version: 1,
  }

  const { data, error } = await supabase
    .from('angelcare_marketplace_feature_flags')
    .insert(record)
    .select('*')
    .single()
  if (error?.code === '23505') throw new MarketplaceError('CONFLICT', 'Cette clé existe déjà.')
  if (error) throw databaseFailure(error, 'création du feature flag')

  await writeMarketplaceAudit({
    context: input.context,
    requestId: input.requestId,
    request: input.request,
    action: 'marketplace.feature_flag.created',
    objectType: 'marketplace_feature_flag',
    objectId: String(data.id),
    afterValue: data,
    reason: record.reason,
  })
  return data as MarketplaceFeatureFlag
}

export async function updateMarketplaceFeatureFlag(input: {
  flagKey: string
  body: Record<string, unknown>
  context: MarketplaceRequestContext
  requestId: string
  request?: Request
}): Promise<MarketplaceFeatureFlag> {
  const supabase = await createServiceClient()
  const { data: before, error: readError } = await supabase
    .from('angelcare_marketplace_feature_flags')
    .select('*')
    .eq('flag_key', input.flagKey)
    .maybeSingle()
  if (readError) throw databaseFailure(readError, 'lecture du feature flag')
  if (!before) throw new MarketplaceError('NOT_FOUND', 'Feature flag introuvable.')

  const changes: Record<string, unknown> = {
    version: Number(before.version || 1) + 1,
    owner_id: input.context.actor.id,
  }
  if ('name' in input.body) changes.name = requireText(input.body.name, 'name', 'Le nom', 160)
  if ('description' in input.body) changes.description = cleanOptionalText(input.body.description, 1000)
  if ('enabled' in input.body) {
    changes.enabled = asBoolean(input.body.enabled)
    changes.status = asBoolean(input.body.enabled) ? 'active' : 'inactive'
  }
  if ('reason' in input.body) changes.reason = cleanOptionalText(input.body.reason, 500)
  if ('startsAt' in input.body) changes.starts_at = cleanOptionalText(input.body.startsAt, 60)
  if ('expiresAt' in input.body) changes.expires_at = cleanOptionalText(input.body.expiresAt, 60)

  const { data, error } = await supabase
    .from('angelcare_marketplace_feature_flags')
    .update(changes)
    .eq('flag_key', input.flagKey)
    .select('*')
    .single()
  if (error) throw databaseFailure(error, 'mise à jour du feature flag')

  await writeMarketplaceAudit({
    context: input.context,
    requestId: input.requestId,
    request: input.request,
    action: 'marketplace.feature_flag.updated',
    objectType: 'marketplace_feature_flag',
    objectId: String(data.id),
    beforeValue: before,
    afterValue: data,
    reason: cleanOptionalText(input.body.reason, 500),
  })
  return data as MarketplaceFeatureFlag
}

export async function listMarketplaceConfigurations(): Promise<MarketplaceConfiguration[]> {
  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('angelcare_marketplace_configurations')
    .select('*')
    .order('category')
    .order('config_key')
  if (error) throw databaseFailure(error, 'liste de configuration')
  return (data || []) as MarketplaceConfiguration[]
}

export async function updateMarketplaceConfiguration(input: {
  configKey: string
  body: Record<string, unknown>
  context: MarketplaceRequestContext
  requestId: string
  request?: Request
}): Promise<MarketplaceConfiguration> {
  const supabase = await createServiceClient()
  const { data: before, error: readError } = await supabase
    .from('angelcare_marketplace_configurations')
    .select('*')
    .eq('config_key', input.configKey)
    .is('territory_id', null)
    .is('tenant_id', null)
    .maybeSingle()
  if (readError) throw databaseFailure(readError, 'lecture de configuration')
  if (!before) throw new MarketplaceError('NOT_FOUND', 'Clé de configuration introuvable.')
  if (!before.editable || before.sensitive) {
    throw new MarketplaceError(
      'PERMISSION_DENIED',
      'Cette configuration est gérée côté serveur et ne peut pas être modifiée ici.',
    )
  }
  const reason = requireText(input.body.reason, 'reason', 'La raison du changement', 500)
  const value = input.body.value

  const { data, error } = await supabase
    .from('angelcare_marketplace_configurations')
    .update({
      value,
      version: Number(before.version || 1) + 1,
      updated_by: input.context.actor.id,
    })
    .eq('id', before.id)
    .select('*')
    .single()
  if (error) throw databaseFailure(error, 'mise à jour de configuration')

  await writeMarketplaceAudit({
    context: input.context,
    requestId: input.requestId,
    request: input.request,
    action: 'marketplace.configuration.updated',
    objectType: 'marketplace_configuration',
    objectId: String(data.id),
    beforeValue: before.sensitive ? { redacted: true } : before,
    afterValue: data.sensitive ? { redacted: true } : data,
    reason,
    severity: 'warning',
  })
  return data as MarketplaceConfiguration
}

export interface AuditFilters {
  q?: string
  result?: string
  severity?: string
  limit?: number
}

export async function listMarketplaceAuditEvents(
  filters: AuditFilters = {},
): Promise<MarketplaceAuditEvent[]> {
  const supabase = await createServiceClient()
  let query = supabase
    .from('angelcare_marketplace_audit_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(Math.min(500, Math.max(1, filters.limit || 100)))

  if (filters.result) query = query.eq('result', filters.result)
  if (filters.severity) query = query.eq('severity', filters.severity)
  if (filters.q) {
    const escaped = filters.q.replaceAll(',', ' ')
    query = query.or(`action.ilike.%${escaped}%,object_type.ilike.%${escaped}%,actor_role.ilike.%${escaped}%`)
  }

  const { data, error } = await query
  if (error) throw databaseFailure(error, 'lecture des preuves d’audit')
  return (data || []) as MarketplaceAuditEvent[]
}

export async function listMarketplaceReadiness(): Promise<MarketplaceReadinessCheck[]> {
  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('angelcare_marketplace_readiness_checks')
    .select('*')
    .order('sort_order')
  if (error) throw databaseFailure(error, 'liste de préparation')
  return (data || []) as MarketplaceReadinessCheck[]
}

export async function updateMarketplaceReadiness(input: {
  checkKey: string
  body: Record<string, unknown>
  context: MarketplaceRequestContext
  requestId: string
  request?: Request
}): Promise<MarketplaceReadinessCheck> {
  const supabase = await createServiceClient()
  const { data: before, error: readError } = await supabase
    .from('angelcare_marketplace_readiness_checks')
    .select('*')
    .eq('check_key', input.checkKey)
    .maybeSingle()
  if (readError) throw databaseFailure(readError, 'lecture du contrôle')
  if (!before) throw new MarketplaceError('NOT_FOUND', 'Contrôle de préparation introuvable.')

  const targetStatus = cleanText(input.body.status, 40) as MarketplaceReadinessStatus
  if (!READINESS_TRANSITIONS[before.status as MarketplaceReadinessStatus]?.includes(targetStatus)) {
    throw new MarketplaceError(
      'INVALID_STATE_TRANSITION',
      `Le contrôle ne peut pas passer de « ${before.status} » à « ${targetStatus} ».`,
    )
  }
  const evidence =
    input.body.evidence && typeof input.body.evidence === 'object' && !Array.isArray(input.body.evidence)
      ? input.body.evidence
      : before.evidence || {}

  const { data, error } = await supabase
    .from('angelcare_marketplace_readiness_checks')
    .update({
      status: targetStatus,
      evidence,
      blocker: cleanOptionalText(input.body.blocker, 1000),
      notes: cleanOptionalText(input.body.notes, 2000),
      next_action: cleanOptionalText(input.body.nextAction, 1000),
      owner_role: cleanOptionalText(input.body.ownerRole, 120) || before.owner_role,
      last_verified_at: targetStatus === 'ready' ? new Date().toISOString() : before.last_verified_at,
      verified_by: targetStatus === 'ready' ? input.context.actor.id : before.verified_by,
    })
    .eq('id', before.id)
    .select('*')
    .single()
  if (error) throw databaseFailure(error, 'mise à jour du contrôle')

  await writeMarketplaceAudit({
    context: input.context,
    requestId: input.requestId,
    request: input.request,
    action: 'marketplace.readiness.updated',
    objectType: 'marketplace_readiness_check',
    objectId: String(data.id),
    beforeValue: before,
    afterValue: data,
    reason: cleanOptionalText(input.body.reason, 500),
    severity: targetStatus === 'blocked' ? 'warning' : 'info',
  })
  return data as MarketplaceReadinessCheck
}

export async function signOffMarketplaceReadiness(input: {
  context: MarketplaceRequestContext
  requestId: string
  request?: Request
  reason: string
}): Promise<{ releaseId: string; status: 'conditionally_accepted' | 'accepted' }> {
  const checks = await listMarketplaceReadiness()
  const blockers = checks.filter((check) => check.required_for_release && check.status !== 'ready')
  const status = blockers.length ? 'conditionally_accepted' : 'accepted'
  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('angelcare_marketplace_release_records')
    .insert({
      mega_zip: 1,
      release_key: `mega-zip-01-${new Date().toISOString()}`,
      version: '1.0.0',
      status,
      signed_by: input.context.actor.id,
      signed_at: new Date().toISOString(),
      notes: input.reason,
      evidence_summary: {
        requiredChecks: checks.filter((check) => check.required_for_release).length,
        blockers: blockers.map((check) => check.check_key),
      },
    })
    .select('id')
    .single()
  if (error) throw databaseFailure(error, 'signature de préparation')

  await writeMarketplaceAudit({
    context: input.context,
    requestId: input.requestId,
    request: input.request,
    action: 'marketplace.readiness.signed_off',
    objectType: 'marketplace_release_record',
    objectId: String(data.id),
    afterValue: { status, blockers: blockers.map((check) => check.check_key) },
    reason: input.reason,
    severity: blockers.length ? 'warning' : 'info',
  })
  return { releaseId: String(data.id), status }
}

export async function marketplaceFoundationHealth(): Promise<{
  status: 'healthy' | 'degraded'
  database: 'connected' | 'migration_required'
  audit: 'ready' | 'unavailable'
  moduleRegistry: 'ready' | 'unavailable'
  readiness: 'ready' | 'unavailable'
  checkedAt: string
}> {
  try {
    const supabase = await createServiceClient()
    const [modules, audit, readiness] = await Promise.all([
      supabase.from('angelcare_marketplace_modules').select('id', { count: 'exact', head: true }),
      supabase.from('angelcare_marketplace_audit_events').select('id', { count: 'exact', head: true }),
      supabase.from('angelcare_marketplace_readiness_checks').select('id', { count: 'exact', head: true }),
    ])
    const moduleRegistry = modules.error ? 'unavailable' : 'ready'
    const auditStatus = audit.error ? 'unavailable' : 'ready'
    const readinessStatus = readiness.error ? 'unavailable' : 'ready'
    const healthy = moduleRegistry === 'ready' && auditStatus === 'ready' && readinessStatus === 'ready'
    return {
      status: healthy ? 'healthy' : 'degraded',
      database: healthy ? 'connected' : 'migration_required',
      audit: auditStatus,
      moduleRegistry,
      readiness: readinessStatus,
      checkedAt: new Date().toISOString(),
    }
  } catch {
    return {
      status: 'degraded',
      database: 'migration_required',
      audit: 'unavailable',
      moduleRegistry: 'unavailable',
      readiness: 'unavailable',
      checkedAt: new Date().toISOString(),
    }
  }
}
