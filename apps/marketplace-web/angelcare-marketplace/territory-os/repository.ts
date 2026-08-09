import { createServiceClient } from '@/lib/supabase/server'
import { writeMarketplaceAudit } from '../audit/write-audit'
import type { MarketplaceRequestContext } from '../domain/types'
import { MarketplaceError } from '../server/errors'
import { cleanOptionalText, cleanText, requireText } from '../server/request'
import {
  TERRITORY_STATUS_TRANSITIONS,
} from './constants'
import { allowedTerritoryIds, assertTerritoryScope, hasGlobalTerritoryScope } from './scope'
import { calculateTerritoryReadiness, isTerritoryGatePassed } from './readiness'
import type {
  Territory,
  TerritoryAssignment,
  TerritoryCityZone,
  TerritoryDetailBundle,
  TerritoryFilters,
  TerritoryGateStatus,
  TerritoryHealthEvent,
  TerritoryLaunchApproval,
  TerritoryLaunchCheck,
  TerritoryOverride,
  TerritoryPortfolioSummary,
  TerritoryReadinessSummary,
  TerritorySetting,
  TerritoryStatus,
  TerritorySupportContact,
  TerritoryTemplate,
} from './types'
import {
  asGateStatus,
  asLocale,
  asLocaleArray,
  asNumber,
  asRecord,
  asStringArray,
  asTerritoryStatus,
  asTerritoryType,
  optionalIsoDate,
  requireCountryCode,
  requireTerritoryCode,
  requireTimezone,
} from './validation'

function databaseFailure(error: { message?: string; code?: string } | null, operation: string): MarketplaceError {
  const message = String(error?.message || '')
  const missingTerritory = error?.code === '42P01' ||
    (message.includes('angelcare_marketplace_territor') && message.toLowerCase().includes('does not exist'))
  return new MarketplaceError(
    missingTerritory ? 'CONFIGURATION_ERROR' : 'INTERNAL_ERROR',
    missingTerritory
      ? 'La migration ANGELCARE Marketplace Mega ZIP 02 doit être appliquée avant cette opération.'
      : `Territory OS n’a pas pu exécuter l’opération « ${operation} ».`,
    { cause: error, retryable: true },
  )
}


export async function listTerritories(
  context: MarketplaceRequestContext,
  filters: TerritoryFilters = {},
): Promise<Territory[]> {
  const supabase = await createServiceClient()
  let query = supabase
    .from('angelcare_marketplace_territories')
    .select('*')
    .order('updated_at', { ascending: false })

  if (!hasGlobalTerritoryScope(context)) {
    const allowed = allowedTerritoryIds(context)
    if (!allowed.length) return []
    query = query.in('id', allowed)
  }
  if (filters.status) query = query.eq('status', filters.status)
  if (filters.health) query = query.eq('health_status', filters.health)
  if (filters.country) query = query.eq('country_code', filters.country.toUpperCase())
  if (filters.ownerId) query = query.eq('owner_id', filters.ownerId)
  if (typeof filters.minReadiness === 'number') query = query.gte('readiness_score', filters.minReadiness)
  if (filters.q) {
    const q = cleanText(filters.q, 120).replaceAll(',', ' ')
    query = query.or(`name.ilike.%${q}%,territory_code.ilike.%${q}%,country_code.ilike.%${q}%,public_reference.ilike.%${q}%`)
  }

  const { data, error } = await query
  if (error) throw databaseFailure(error, 'liste des territoires')
  return (data || []) as Territory[]
}

export function summarizeTerritories(territories: Territory[], openCriticalEvents = 0): TerritoryPortfolioSummary {
  const total = territories.length
  return {
    total,
    live: territories.filter((territory) => territory.status === 'live').length,
    configuring: territories.filter((territory) => ['draft', 'configuring'].includes(territory.status)).length,
    review: territories.filter((territory) => territory.status === 'review').length,
    paused: territories.filter((territory) => territory.status === 'paused').length,
    criticalBlockers: openCriticalEvents,
    averageReadiness: total ? Math.round(territories.reduce((sum, territory) => sum + territory.readiness_score, 0) / total) : 0,
    unhealthy: territories.filter((territory) => ['at_risk', 'critical', 'attention_required'].includes(territory.health_status)).length,
  }
}

export async function getTerritoryByCode(
  context: MarketplaceRequestContext,
  territoryCode: string,
): Promise<Territory> {
  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('angelcare_marketplace_territories')
    .select('*')
    .eq('territory_code', territoryCode.toUpperCase())
    .maybeSingle()
  if (error) throw databaseFailure(error, 'lecture du territoire')
  if (!data) throw new MarketplaceError('NOT_FOUND', 'Le territoire demandé est introuvable.')
  assertTerritoryScope(context, String(data.id))
  return data as Territory
}

export async function listTerritoryTemplates(): Promise<TerritoryTemplate[]> {
  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('angelcare_marketplace_territory_templates')
    .select('*')
    .eq('active', true)
    .order('name', { ascending: true })
  if (error) throw databaseFailure(error, 'liste des modèles territoire')
  return (data || []) as TerritoryTemplate[]
}

export async function createTerritory(input: {
  body: Record<string, unknown>
  context: MarketplaceRequestContext
  requestId: string
  request?: Request
}): Promise<Territory> {
  const territoryCode = requireTerritoryCode(input.body.territoryCode)
  const name = requireText(input.body.name, 'name', 'Le nom du territoire', 160)
  const countryCode = requireCountryCode(input.body.countryCode)
  const timezone = requireTimezone(input.body.timezone || 'Africa/Casablanca')
  const currencyLabel = requireText(input.body.currencyLabel || 'Dh', 'currencyLabel', 'Le libellé devise', 12)
  const defaultLocale = asLocale(input.body.defaultLocale)
  const activeLocales = asLocaleArray(input.body.activeLocales)
  const locales = activeLocales.length ? activeLocales : [defaultLocale]
  if (!locales.includes(defaultLocale)) locales.unshift(defaultLocale)
  const cityNames = asStringArray(input.body.cityNames, 100)
  const support = asRecord(input.body.support)
  const activationStrategy = cleanText(input.body.activationStrategy || 'configuration_only', 60)
  const targetLaunchAt = optionalIsoDate(input.body.targetLaunchAt, 'targetLaunchAt')

  const supabase = await createServiceClient()
  const { data, error } = await supabase.rpc('angelcare_marketplace_create_territory', {
    p_territory_code: territoryCode,
    p_name: name,
    p_country_code: countryCode,
    p_territory_type: asTerritoryType(input.body.territoryType),
    p_timezone: timezone,
    p_currency_label: currencyLabel,
    p_default_locale: defaultLocale,
    p_active_locales: locales,
    p_owner_id: cleanOptionalText(input.body.ownerId, 64) || input.context.actor.id,
    p_executive_sponsor_id: cleanOptionalText(input.body.executiveSponsorId, 64),
    p_source_template_id: cleanOptionalText(input.body.sourceTemplateId, 64),
    p_target_launch_at: targetLaunchAt,
    p_city_names: cityNames,
    p_support: support,
    p_activation_strategy: activationStrategy,
    p_actor_id: input.context.actor.id,
    p_request_id: input.requestId,
  })
  if (error?.code === '23505' || String(error?.message || '').includes('territory_code')) {
    throw new MarketplaceError('CONFLICT', 'Ce code territoire existe déjà.')
  }
  if (error) throw databaseFailure(error, 'création du territoire')
  const createdId = String(data)
  const created = await getTerritoryById(createdId)

  await writeMarketplaceAudit({
    context: input.context,
    requestId: input.requestId,
    request: input.request,
    action: 'territory.created',
    objectType: 'marketplace_territory',
    objectId: created.id,
    territoryId: created.id,
    afterValue: created,
    reason: cleanOptionalText(input.body.reason, 600) || 'Création Territory OS.',
  })
  return created
}

async function getTerritoryById(territoryId: string): Promise<Territory> {
  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('angelcare_marketplace_territories')
    .select('*')
    .eq('id', territoryId)
    .single()
  if (error) throw databaseFailure(error, 'relecture du territoire')
  return data as Territory
}

export async function updateTerritory(input: {
  territoryCode: string
  body: Record<string, unknown>
  context: MarketplaceRequestContext
  requestId: string
  request?: Request
}): Promise<Territory> {
  const before = await getTerritoryByCode(input.context, input.territoryCode)
  if (before.status === 'archived') throw new MarketplaceError('INVALID_STATE_TRANSITION', 'Un territoire archivé ne peut plus être modifié.')
  const changes: Record<string, unknown> = { updated_by: input.context.actor.id, version: before.version + 1 }
  if ('name' in input.body) changes.name = requireText(input.body.name, 'name', 'Le nom du territoire', 160)
  if ('timezone' in input.body) changes.timezone = requireTimezone(input.body.timezone)
  if ('currencyLabel' in input.body) changes.currency_label = requireText(input.body.currencyLabel, 'currencyLabel', 'Le libellé devise', 12)
  if ('defaultLocale' in input.body) changes.default_locale = asLocale(input.body.defaultLocale)
  if ('activeLocales' in input.body) {
    const locales = asLocaleArray(input.body.activeLocales)
    if (!locales.length) throw new MarketplaceError('VALIDATION_ERROR', 'Au moins une langue active est requise.')
    changes.active_locales = locales
  }
  if ('ownerId' in input.body) changes.owner_id = cleanOptionalText(input.body.ownerId, 64)
  if ('executiveSponsorId' in input.body) changes.executive_sponsor_id = cleanOptionalText(input.body.executiveSponsorId, 64)
  if ('targetLaunchAt' in input.body) changes.target_launch_at = optionalIsoDate(input.body.targetLaunchAt, 'targetLaunchAt')
  if ('metadata' in input.body) changes.metadata = asRecord(input.body.metadata)

  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('angelcare_marketplace_territories')
    .update(changes)
    .eq('id', before.id)
    .eq('version', before.version)
    .select('*')
    .maybeSingle()
  if (error) throw databaseFailure(error, 'mise à jour du territoire')
  if (!data) throw new MarketplaceError('CONFLICT', 'Le territoire a été modifié par un autre utilisateur. Rechargez la page.')

  await writeMarketplaceAudit({
    context: input.context,
    requestId: input.requestId,
    request: input.request,
    action: 'territory.updated',
    objectType: 'marketplace_territory',
    objectId: before.id,
    territoryId: before.id,
    beforeValue: before,
    afterValue: data,
    reason: cleanOptionalText(input.body.reason, 600) || 'Mise à jour Territory OS.',
  })
  return data as Territory
}

export async function cloneTerritory(input: {
  body: Record<string, unknown>
  context: MarketplaceRequestContext
  requestId: string
  request?: Request
}): Promise<Territory> {
  const sourceCode = requireText(input.body.sourceTerritoryCode, 'sourceTerritoryCode', 'Le territoire source', 32)
  const source = await getTerritoryByCode(input.context, sourceCode)
  const territoryCode = requireTerritoryCode(input.body.territoryCode)
  const name = requireText(input.body.name, 'name', 'Le nom du nouveau territoire', 160)
  const activeLocales = asLocaleArray(input.body.activeLocales)
  const inheritedDomains = asStringArray(input.body.inheritedDomains, 30)
  const allowedOverrideCategories = asStringArray(input.body.allowedOverrideCategories, 30)
  const idempotencyKey = cleanText(input.body.idempotencyKey || input.requestId, 160)

  const supabase = await createServiceClient()
  const { data, error } = await supabase.rpc('angelcare_marketplace_clone_territory', {
    p_source_territory_id: source.id,
    p_territory_code: territoryCode,
    p_name: name,
    p_country_code: requireCountryCode(input.body.countryCode),
    p_timezone: requireTimezone(input.body.timezone || source.timezone),
    p_currency_label: requireText(input.body.currencyLabel || source.currency_label, 'currencyLabel', 'Le libellé devise', 12),
    p_default_locale: asLocale(input.body.defaultLocale, source.default_locale),
    p_active_locales: activeLocales.length ? activeLocales : source.active_locales,
    p_owner_id: cleanOptionalText(input.body.ownerId, 64) || input.context.actor.id,
    p_executive_sponsor_id: cleanOptionalText(input.body.executiveSponsorId, 64),
    p_inherited_domains: inheritedDomains,
    p_allowed_override_categories: allowedOverrideCategories,
    p_idempotency_key: idempotencyKey,
    p_actor_id: input.context.actor.id,
    p_request_id: input.requestId,
  })
  if (error?.code === '23505') throw new MarketplaceError('CONFLICT', 'Ce code territoire ou cette opération de clonage existe déjà.')
  if (error) throw databaseFailure(error, 'clonage du territoire')
  const created = await getTerritoryById(String(data))

  await writeMarketplaceAudit({
    context: input.context,
    requestId: input.requestId,
    request: input.request,
    action: 'territory.cloned',
    objectType: 'marketplace_territory',
    objectId: created.id,
    territoryId: created.id,
    beforeValue: { sourceTerritoryId: source.id, sourceTerritoryCode: source.territory_code },
    afterValue: { territory: created, inheritedDomains, allowedOverrideCategories },
    reason: requireText(input.body.reason, 'reason', 'La raison du clonage', 800),
  })
  return created
}

export async function transitionTerritory(input: {
  territoryCode: string
  targetStatus: TerritoryStatus
  reason: string
  comments?: string
  context: MarketplaceRequestContext
  requestId: string
  request?: Request
}): Promise<Territory> {
  const before = await getTerritoryByCode(input.context, input.territoryCode)
  const targetStatus = asTerritoryStatus(input.targetStatus)
  if (!TERRITORY_STATUS_TRANSITIONS[before.status].includes(targetStatus)) {
    throw new MarketplaceError('INVALID_STATE_TRANSITION', `Transition interdite : ${before.status} → ${targetStatus}.`)
  }
  if (!input.reason.trim()) throw new MarketplaceError('VALIDATION_ERROR', 'Une raison de transition est obligatoire.')

  const checks = await listTerritoryLaunchChecks(input.context, before.id)
  const readiness = calculateTerritoryReadiness(checks)
  if (targetStatus === 'live' && !readiness.launchEligible) {
    throw new MarketplaceError('DEPENDENCY_BLOCKED', `Mise en service bloquée : ${readiness.blocking} gate(s) obligatoire(s) restent ouvertes.`)
  }
  if (targetStatus === 'soft_launch' && !readiness.softLaunchEligible) {
    throw new MarketplaceError('DEPENDENCY_BLOCKED', 'Soft launch bloqué : les gates minimales sécurité, opérations, support et continuité ne sont pas prêtes.')
  }

  const now = new Date().toISOString()
  const changes: Record<string, unknown> = {
    status: targetStatus,
    updated_by: input.context.actor.id,
    version: before.version + 1,
    readiness_score: readiness.score,
  }
  if (targetStatus === 'soft_launch') changes.soft_launched_at = now
  if (targetStatus === 'live') changes.launched_at = now
  if (targetStatus === 'paused') {
    changes.paused_at = now
    changes.health_status = 'paused'
  }
  if (targetStatus === 'archived') changes.archived_at = now
  if (before.status === 'paused' && ['soft_launch', 'live'].includes(targetStatus)) {
    changes.paused_at = null
    changes.health_status = readiness.blocking ? 'at_risk' : 'healthy'
  }

  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('angelcare_marketplace_territories')
    .update(changes)
    .eq('id', before.id)
    .eq('version', before.version)
    .select('*')
    .maybeSingle()
  if (error) throw databaseFailure(error, 'transition du territoire')
  if (!data) throw new MarketplaceError('CONFLICT', 'Le territoire a changé. Rechargez avant de réessayer.')

  if (['soft_launch', 'live'].includes(targetStatus) || (before.status === 'paused' && targetStatus === 'live')) {
    const approvalType = before.status === 'paused' ? 'resume' : targetStatus === 'live' ? 'live_launch' : 'soft_launch'
    const { error: approvalError } = await supabase.from('angelcare_marketplace_territory_launch_approvals').insert({
      territory_id: before.id,
      approval_type: approvalType,
      readiness_score: readiness.score,
      blocking_gate_count: readiness.blocking,
      reviewer_id: input.context.actor.id,
      decision: 'approved',
      comments: input.comments || input.reason,
      evidence_summary: { readiness, checkCount: checks.length },
    })
    if (approvalError) throw databaseFailure(approvalError, 'enregistrement de la décision de lancement')
  }

  await writeMarketplaceAudit({
    context: input.context,
    requestId: input.requestId,
    request: input.request,
    action: `territory.${targetStatus}`,
    objectType: 'marketplace_territory',
    objectId: before.id,
    territoryId: before.id,
    beforeValue: before,
    afterValue: data,
    reason: input.reason,
    severity: ['paused', 'archived'].includes(targetStatus) ? 'warning' : 'info',
  })
  return data as Territory
}

export async function listTerritorySettings(context: MarketplaceRequestContext, territoryId: string): Promise<TerritorySetting[]> {
  assertTerritoryScope(context, territoryId)
  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('angelcare_marketplace_territory_settings')
    .select('*')
    .eq('territory_id', territoryId)
    .order('category', { ascending: true })
    .order('setting_key', { ascending: true })
  if (error) throw databaseFailure(error, 'paramètres du territoire')
  return (data || []) as TerritorySetting[]
}

export async function updateTerritorySetting(input: {
  territoryCode: string
  settingKey: string
  body: Record<string, unknown>
  context: MarketplaceRequestContext
  requestId: string
  request?: Request
}): Promise<TerritorySetting> {
  const territory = await getTerritoryByCode(input.context, input.territoryCode)
  const supabase = await createServiceClient()
  const { data: before, error: beforeError } = await supabase
    .from('angelcare_marketplace_territory_settings')
    .select('*')
    .eq('territory_id', territory.id)
    .eq('setting_key', input.settingKey)
    .maybeSingle()
  if (beforeError) throw databaseFailure(beforeError, 'lecture du paramètre territoire')
  if (!before) throw new MarketplaceError('NOT_FOUND', 'Le paramètre territoire est introuvable.')
  if (before.is_locked || !before.local_override_allowed) {
    throw new MarketplaceError('PERMISSION_DENIED', 'Ce standard global est verrouillé. Utilisez le workflow de dérogation autorisé.')
  }
  const changes = {
    effective_value: 'value' in input.body ? input.body.value : before.effective_value,
    owner_id: cleanOptionalText(input.body.ownerId, 64) || before.owner_id,
    updated_by: input.context.actor.id,
    inheritance_mode: before.inheritance_mode === 'local_default' ? 'local_default' : 'local_override',
  }
  const { data, error } = await supabase
    .from('angelcare_marketplace_territory_settings')
    .update(changes)
    .eq('id', before.id)
    .select('*')
    .single()
  if (error) throw databaseFailure(error, 'mise à jour du paramètre territoire')
  await writeMarketplaceAudit({
    context: input.context, requestId: input.requestId, request: input.request,
    action: 'territory.setting_changed', objectType: 'marketplace_territory_setting', objectId: String(data.id),
    territoryId: territory.id, beforeValue: before, afterValue: data,
    reason: requireText(input.body.reason, 'reason', 'La raison du changement', 800),
  })
  return data as TerritorySetting
}

export async function listTerritoryOverrides(context: MarketplaceRequestContext, territoryId: string): Promise<TerritoryOverride[]> {
  assertTerritoryScope(context, territoryId)
  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('angelcare_marketplace_territory_overrides')
    .select('*')
    .eq('territory_id', territoryId)
    .order('created_at', { ascending: false })
  if (error) throw databaseFailure(error, 'dérogations territoriales')
  return (data || []) as TerritoryOverride[]
}

export async function createTerritoryOverride(input: {
  territoryCode: string
  body: Record<string, unknown>
  context: MarketplaceRequestContext
  requestId: string
  request?: Request
}): Promise<TerritoryOverride> {
  const territory = await getTerritoryByCode(input.context, input.territoryCode)
  const settingKey = requireText(input.body.settingKey, 'settingKey', 'La clé du paramètre', 180)
  const supabase = await createServiceClient()
  const { data: setting, error: settingError } = await supabase
    .from('angelcare_marketplace_territory_settings')
    .select('*')
    .eq('territory_id', territory.id)
    .eq('setting_key', settingKey)
    .maybeSingle()
  if (settingError) throw databaseFailure(settingError, 'lecture du standard source')
  if (!setting) throw new MarketplaceError('NOT_FOUND', 'Le standard source est introuvable.')
  if (!setting.local_override_allowed) throw new MarketplaceError('PERMISSION_DENIED', 'Aucune dérogation locale n’est autorisée pour ce standard.')
  const businessReason = requireText(input.body.businessReason, 'businessReason', 'La justification métier', 1200)
  const riskLevel = cleanText(input.body.riskLevel || 'medium', 20)
  if (!['low', 'medium', 'high', 'critical'].includes(riskLevel)) throw new MarketplaceError('VALIDATION_ERROR', 'Le niveau de risque est invalide.')
  const record = {
    territory_id: territory.id,
    setting_key: settingKey,
    source_value: setting.effective_value,
    proposed_value: input.body.proposedValue ?? null,
    business_reason: businessReason,
    risk_level: riskLevel,
    status: 'submitted',
    requested_by: input.context.actor.id,
    owner_id: cleanOptionalText(input.body.ownerId, 64) || input.context.actor.id,
    version: 1,
  }
  const { data, error } = await supabase
    .from('angelcare_marketplace_territory_overrides')
    .insert(record)
    .select('*')
    .single()
  if (error) throw databaseFailure(error, 'création de la dérogation')
  await supabase.from('angelcare_marketplace_territory_settings').update({
    override_value: record.proposed_value,
    override_status: 'submitted',
    updated_by: input.context.actor.id,
  }).eq('id', setting.id)
  await writeMarketplaceAudit({
    context: input.context, requestId: input.requestId, request: input.request,
    action: 'territory.override_submitted', objectType: 'marketplace_territory_override', objectId: String(data.id),
    territoryId: territory.id, beforeValue: { setting }, afterValue: data, reason: businessReason,
    severity: riskLevel === 'critical' ? 'critical' : riskLevel === 'high' ? 'warning' : 'info',
  })
  return data as TerritoryOverride
}

export async function getTerritoryOverride(context: MarketplaceRequestContext, overrideId: string): Promise<TerritoryOverride> {
  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('angelcare_marketplace_territory_overrides')
    .select('*')
    .eq('id', overrideId)
    .maybeSingle()
  if (error) throw databaseFailure(error, 'lecture de la dérogation')
  if (!data) throw new MarketplaceError('NOT_FOUND', 'La dérogation est introuvable.')
  assertTerritoryScope(context, String(data.territory_id))
  return data as TerritoryOverride
}

export async function reviewTerritoryOverride(input: {
  overrideId: string
  decision: 'approve' | 'reject'
  reason: string
  context: MarketplaceRequestContext
  requestId: string
  request?: Request
}): Promise<TerritoryOverride> {
  const before = await getTerritoryOverride(input.context, input.overrideId)
  if (!['submitted', 'in_review'].includes(before.status)) throw new MarketplaceError('INVALID_STATE_TRANSITION', 'Cette dérogation ne peut plus être révisée.')
  const reason = requireText(input.reason, 'reason', 'Le commentaire de décision', 1200)
  const now = new Date().toISOString()
  const targetStatus = input.decision === 'approve' ? 'effective' : 'rejected'
  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('angelcare_marketplace_territory_overrides')
    .update({
      status: targetStatus,
      reviewer_id: input.context.actor.id,
      decision_reason: reason,
      reviewed_at: now,
      effective_at: input.decision === 'approve' ? now : null,
      effective_value: input.decision === 'approve' ? before.proposed_value : null,
      version: before.version + 1,
    })
    .eq('id', before.id)
    .eq('version', before.version)
    .select('*')
    .maybeSingle()
  if (error) throw databaseFailure(error, 'décision de dérogation')
  if (!data) throw new MarketplaceError('CONFLICT', 'Cette dérogation a déjà été modifiée.')
  await supabase.from('angelcare_marketplace_territory_override_reviews').insert({
    override_id: before.id,
    reviewer_id: input.context.actor.id,
    decision: input.decision === 'approve' ? 'approved' : 'rejected',
    comments: reason,
    before_value: before,
    after_value: data,
  })
  const { data: setting } = await supabase
    .from('angelcare_marketplace_territory_settings')
    .select('*')
    .eq('territory_id', before.territory_id)
    .eq('setting_key', before.setting_key)
    .maybeSingle()
  if (setting) {
    await supabase.from('angelcare_marketplace_territory_settings').update({
      effective_value: input.decision === 'approve' ? before.proposed_value : setting.effective_value,
      override_value: input.decision === 'approve' ? before.proposed_value : null,
      override_status: targetStatus,
      inheritance_mode: input.decision === 'approve' ? 'local_override' : setting.inheritance_mode,
      updated_by: input.context.actor.id,
    }).eq('id', setting.id)
  }
  await writeMarketplaceAudit({
    context: input.context, requestId: input.requestId, request: input.request,
    action: input.decision === 'approve' ? 'territory.override_approved' : 'territory.override_rejected',
    objectType: 'marketplace_territory_override', objectId: before.id, territoryId: before.territory_id,
    beforeValue: before, afterValue: data, reason, severity: before.risk_level === 'critical' ? 'critical' : 'warning',
  })
  return data as TerritoryOverride
}

export async function rollbackTerritoryOverride(input: {
  overrideId: string
  reason: string
  context: MarketplaceRequestContext
  requestId: string
  request?: Request
}): Promise<TerritoryOverride> {
  const before = await getTerritoryOverride(input.context, input.overrideId)
  if (before.status !== 'effective') throw new MarketplaceError('INVALID_STATE_TRANSITION', 'Seule une dérogation effective peut être annulée.')
  const reason = requireText(input.reason, 'reason', 'La justification du rollback', 1200)
  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('angelcare_marketplace_territory_overrides')
    .update({ status: 'rolled_back', rolled_back_at: new Date().toISOString(), decision_reason: reason, version: before.version + 1 })
    .eq('id', before.id)
    .eq('version', before.version)
    .select('*')
    .maybeSingle()
  if (error) throw databaseFailure(error, 'rollback de la dérogation')
  if (!data) throw new MarketplaceError('CONFLICT', 'La dérogation a été modifiée avant le rollback.')
  await supabase.from('angelcare_marketplace_territory_settings').update({
    effective_value: before.source_value,
    override_value: null,
    override_status: 'rolled_back',
    inheritance_mode: 'inherited_snapshot',
    updated_by: input.context.actor.id,
  }).eq('territory_id', before.territory_id).eq('setting_key', before.setting_key)
  await writeMarketplaceAudit({
    context: input.context, requestId: input.requestId, request: input.request,
    action: 'territory.override_rolled_back', objectType: 'marketplace_territory_override', objectId: before.id,
    territoryId: before.territory_id, beforeValue: before, afterValue: data, reason, severity: 'warning',
  })
  return data as TerritoryOverride
}

export async function listTerritoryLaunchChecks(context: MarketplaceRequestContext, territoryId: string): Promise<TerritoryLaunchCheck[]> {
  assertTerritoryScope(context, territoryId)
  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('angelcare_marketplace_territory_launch_checks')
    .select('*')
    .eq('territory_id', territoryId)
    .order('sort_order', { ascending: true })
  if (error) throw databaseFailure(error, 'gates de lancement')
  return (data || []) as TerritoryLaunchCheck[]
}

export async function updateTerritoryLaunchCheck(input: {
  territoryCode: string
  gateKey: string
  body: Record<string, unknown>
  context: MarketplaceRequestContext
  requestId: string
  request?: Request
}): Promise<TerritoryLaunchCheck> {
  const territory = await getTerritoryByCode(input.context, input.territoryCode)
  const supabase = await createServiceClient()
  const { data: before, error: beforeError } = await supabase
    .from('angelcare_marketplace_territory_launch_checks')
    .select('*')
    .eq('territory_id', territory.id)
    .eq('gate_key', input.gateKey)
    .maybeSingle()
  if (beforeError) throw databaseFailure(beforeError, 'lecture de la gate')
  if (!before) throw new MarketplaceError('NOT_FOUND', 'La gate demandée est introuvable.')
  const status = 'status' in input.body ? asGateStatus(input.body.status) : before.status as TerritoryGateStatus
  const evidenceReference = cleanOptionalText(input.body.evidenceReference, 600)
  if (status === 'passed' && before.evidence_required && !evidenceReference && !before.evidence_reference) {
    throw new MarketplaceError('VALIDATION_ERROR', 'Une référence de preuve est requise avant de valider cette gate.', {
      fieldErrors: { evidenceReference: ['Ajoutez une URL, un document ou une référence de preuve.'] },
    })
  }
  const changes = {
    status,
    owner_id: cleanOptionalText(input.body.ownerId, 64) || before.owner_id,
    reviewer_id: cleanOptionalText(input.body.reviewerId, 64) || before.reviewer_id,
    due_at: 'dueAt' in input.body ? optionalIsoDate(input.body.dueAt, 'dueAt') : before.due_at,
    evidence_reference: evidenceReference || before.evidence_reference,
    evidence: 'evidence' in input.body ? asRecord(input.body.evidence) : before.evidence,
    blocker_reason: cleanOptionalText(input.body.blockerReason, 1000),
    warning_reason: cleanOptionalText(input.body.warningReason, 1000),
    next_action: cleanOptionalText(input.body.nextAction, 800) || before.next_action,
    score: isTerritoryGatePassed(status) ? 100 : status === 'in_progress' || status === 'submitted' ? 50 : 0,
    last_validated_at: ['passed', 'failed', 'waiver_approved', 'not_applicable'].includes(status) ? new Date().toISOString() : before.last_validated_at,
    validated_by: ['passed', 'failed', 'waiver_approved', 'not_applicable'].includes(status) ? input.context.actor.id : before.validated_by,
  }
  const { data, error } = await supabase
    .from('angelcare_marketplace_territory_launch_checks')
    .update(changes)
    .eq('id', before.id)
    .select('*')
    .single()
  if (error) throw databaseFailure(error, 'mise à jour de la gate')
  await recalculateTerritoryState(territory.id)
  await writeMarketplaceAudit({
    context: input.context, requestId: input.requestId, request: input.request,
    action: status === 'failed' ? 'territory.launch_gate_failed' : 'territory.launch_check_updated',
    objectType: 'marketplace_territory_launch_check', objectId: String(data.id), territoryId: territory.id,
    beforeValue: before, afterValue: data,
    reason: cleanOptionalText(input.body.reason, 800) || `Mise à jour de la gate ${input.gateKey}.`,
    severity: status === 'failed' && before.requirement_level === 'mandatory_blocking' ? 'critical' : 'info',
  })
  return data as TerritoryLaunchCheck
}

async function recalculateTerritoryState(territoryId: string): Promise<TerritoryReadinessSummary> {
  const supabase = await createServiceClient()
  const { data: checks, error } = await supabase
    .from('angelcare_marketplace_territory_launch_checks')
    .select('*')
    .eq('territory_id', territoryId)
  if (error) throw databaseFailure(error, 'calcul de préparation')
  const readiness = calculateTerritoryReadiness((checks || []) as TerritoryLaunchCheck[])
  const healthStatus = readiness.blocking >= 4 ? 'critical' : readiness.blocking > 0 ? 'at_risk' : readiness.warnings || readiness.overdue ? 'attention_required' : 'healthy'
  await supabase.from('angelcare_marketplace_territories').update({
    readiness_score: readiness.score,
    health_status: healthStatus,
  }).eq('id', territoryId).neq('status', 'paused')
  return readiness
}

export async function validateTerritoryReadiness(input: {
  territoryCode: string
  context: MarketplaceRequestContext
  requestId: string
  request?: Request
}): Promise<TerritoryReadinessSummary> {
  const territory = await getTerritoryByCode(input.context, input.territoryCode)
  const readiness = await recalculateTerritoryState(territory.id)
  await writeMarketplaceAudit({
    context: input.context, requestId: input.requestId, request: input.request,
    action: readiness.blocking ? 'territory.launch_blocked' : 'territory.readiness_validated',
    objectType: 'marketplace_territory', objectId: territory.id, territoryId: territory.id,
    afterValue: readiness,
    reason: readiness.blocking ? `${readiness.blocking} gate(s) bloquante(s).` : 'Validation de préparation réussie.',
    severity: readiness.blocking ? 'warning' : 'info',
  })
  return readiness
}

export async function signOffTerritoryReadiness(input: {
  territoryCode: string
  approvalType: 'soft_launch' | 'live_launch' | 'resume'
  comments: string
  context: MarketplaceRequestContext
  requestId: string
  request?: Request
}): Promise<TerritoryLaunchApproval> {
  const territory = await getTerritoryByCode(input.context, input.territoryCode)
  const checks = await listTerritoryLaunchChecks(input.context, territory.id)
  const readiness = calculateTerritoryReadiness(checks)
  if (input.approvalType === 'live_launch' && !readiness.launchEligible) throw new MarketplaceError('DEPENDENCY_BLOCKED', 'Le sign-off live est bloqué par des gates obligatoires.')
  if (input.approvalType === 'soft_launch' && !readiness.softLaunchEligible) throw new MarketplaceError('DEPENDENCY_BLOCKED', 'Le sign-off soft launch est bloqué par les gates minimales.')
  const comments = requireText(input.comments, 'comments', 'Le commentaire de sign-off', 1400)
  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('angelcare_marketplace_territory_launch_approvals')
    .insert({
      territory_id: territory.id,
      approval_type: input.approvalType,
      readiness_score: readiness.score,
      blocking_gate_count: readiness.blocking,
      reviewer_id: input.context.actor.id,
      decision: 'approved',
      comments,
      evidence_summary: { readiness, gateStatuses: checks.map((check) => ({ key: check.gate_key, status: check.status })) },
    })
    .select('*')
    .single()
  if (error) throw databaseFailure(error, 'sign-off territoire')
  await writeMarketplaceAudit({
    context: input.context, requestId: input.requestId, request: input.request,
    action: 'territory.launch_sign_off_recorded', objectType: 'marketplace_territory_launch_approval', objectId: String(data.id),
    territoryId: territory.id, afterValue: data, reason: comments,
  })
  return data as TerritoryLaunchApproval
}

export async function listTerritoryHealthEvents(context: MarketplaceRequestContext, territoryId: string): Promise<TerritoryHealthEvent[]> {
  assertTerritoryScope(context, territoryId)
  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('angelcare_marketplace_territory_health_events')
    .select('*')
    .eq('territory_id', territoryId)
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) throw databaseFailure(error, 'journal de santé territoire')
  return (data || []) as TerritoryHealthEvent[]
}

export async function createTerritoryHealthEvent(input: {
  territoryCode: string
  body: Record<string, unknown>
  context: MarketplaceRequestContext
  requestId: string
  request?: Request
}): Promise<TerritoryHealthEvent> {
  const territory = await getTerritoryByCode(input.context, input.territoryCode)
  const severity = cleanText(input.body.severity || 'warning', 20)
  if (!['info', 'warning', 'critical'].includes(severity)) throw new MarketplaceError('VALIDATION_ERROR', 'La sévérité est invalide.')
  const status = cleanText(input.body.status || 'open', 30)
  if (!['open', 'acknowledged', 'resolved', 'dismissed'].includes(status)) throw new MarketplaceError('VALIDATION_ERROR', 'Le statut de l’événement est invalide.')
  const supabase = await createServiceClient()
  const record = {
    territory_id: territory.id,
    event_key: requireText(input.body.eventKey || `manual.${Date.now()}`, 'eventKey', 'La clé événement', 160),
    category: requireText(input.body.category, 'category', 'La catégorie', 100),
    severity,
    title: requireText(input.body.title, 'title', 'Le titre', 240),
    description: cleanOptionalText(input.body.description, 1600),
    status,
    source: cleanText(input.body.source || 'territory-command', 120),
    owner_id: cleanOptionalText(input.body.ownerId, 64) || input.context.actor.id,
    due_at: optionalIsoDate(input.body.dueAt, 'dueAt'),
    metadata: asRecord(input.body.metadata),
    created_by: input.context.actor.id,
  }
  const { data, error } = await supabase
    .from('angelcare_marketplace_territory_health_events')
    .insert(record)
    .select('*')
    .single()
  if (error) throw databaseFailure(error, 'création de l’événement santé')
  if (severity === 'critical' && status !== 'resolved') {
    await supabase.from('angelcare_marketplace_territories').update({ health_status: 'critical' }).eq('id', territory.id)
  }
  await writeMarketplaceAudit({
    context: input.context, requestId: input.requestId, request: input.request,
    action: 'territory.health_event_created', objectType: 'marketplace_territory_health_event', objectId: String(data.id),
    territoryId: territory.id, afterValue: data, reason: record.description, severity: severity === 'critical' ? 'critical' : 'info',
  })
  return data as TerritoryHealthEvent
}

async function listTerritoryCityZones(context: MarketplaceRequestContext, territoryId: string): Promise<TerritoryCityZone[]> {
  assertTerritoryScope(context, territoryId)
  const supabase = await createServiceClient()
  const { data, error } = await supabase.from('angelcare_marketplace_territory_city_zones').select('*').eq('territory_id', territoryId).order('city_name')
  if (error) throw databaseFailure(error, 'zones territoire')
  return (data || []) as TerritoryCityZone[]
}

async function listTerritorySupportContacts(context: MarketplaceRequestContext, territoryId: string): Promise<TerritorySupportContact[]> {
  assertTerritoryScope(context, territoryId)
  const supabase = await createServiceClient()
  const { data, error } = await supabase.from('angelcare_marketplace_territory_support_contacts').select('*').eq('territory_id', territoryId).order('contact_type')
  if (error) throw databaseFailure(error, 'contacts territoire')
  return (data || []) as TerritorySupportContact[]
}

async function listTerritoryAssignments(context: MarketplaceRequestContext, territoryId: string): Promise<TerritoryAssignment[]> {
  assertTerritoryScope(context, territoryId)
  const supabase = await createServiceClient()
  const { data, error } = await supabase.from('angelcare_marketplace_territory_assignments').select('*').eq('territory_id', territoryId).eq('active', true).order('assignment_role')
  if (error) throw databaseFailure(error, 'assignations territoire')
  return (data || []) as TerritoryAssignment[]
}

async function listTerritoryApprovals(context: MarketplaceRequestContext, territoryId: string): Promise<TerritoryLaunchApproval[]> {
  assertTerritoryScope(context, territoryId)
  const supabase = await createServiceClient()
  const { data, error } = await supabase.from('angelcare_marketplace_territory_launch_approvals').select('*').eq('territory_id', territoryId).order('created_at', { ascending: false })
  if (error) throw databaseFailure(error, 'approbations territoire')
  return (data || []) as TerritoryLaunchApproval[]
}

export async function getTerritoryDetailBundle(context: MarketplaceRequestContext, territoryCode: string): Promise<TerritoryDetailBundle> {
  const territory = await getTerritoryByCode(context, territoryCode)
  const [settings, overrides, launchChecks, healthEvents, cityZones, supportContacts, assignments, approvals] = await Promise.all([
    listTerritorySettings(context, territory.id),
    listTerritoryOverrides(context, territory.id),
    listTerritoryLaunchChecks(context, territory.id),
    listTerritoryHealthEvents(context, territory.id),
    listTerritoryCityZones(context, territory.id),
    listTerritorySupportContacts(context, territory.id),
    listTerritoryAssignments(context, territory.id),
    listTerritoryApprovals(context, territory.id),
  ])
  return {
    territory,
    settings,
    overrides,
    launchChecks,
    healthEvents,
    cityZones,
    supportContacts,
    assignments,
    approvals,
    readiness: calculateTerritoryReadiness(launchChecks),
  }
}

export async function listRecentTerritoryHealthEvents(
  context: MarketplaceRequestContext,
  limit = 12,
): Promise<TerritoryHealthEvent[]> {
  const supabase = await createServiceClient()
  let query = supabase
    .from('angelcare_marketplace_territory_health_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(Math.max(1, Math.min(50, limit)))
  if (!hasGlobalTerritoryScope(context)) {
    const allowed = allowedTerritoryIds(context)
    if (!allowed.length) return []
    query = query.in('territory_id', allowed)
  }
  const { data, error } = await query
  if (error) throw databaseFailure(error, 'journal de santé global')
  return (data || []) as TerritoryHealthEvent[]
}

export async function countOpenCriticalTerritoryEvents(context: MarketplaceRequestContext): Promise<number> {
  const territories = await listTerritories(context)
  if (!territories.length) return 0
  const supabase = await createServiceClient()
  const { count, error } = await supabase
    .from('angelcare_marketplace_territory_health_events')
    .select('id', { count: 'exact', head: true })
    .in('territory_id', territories.map((territory) => territory.id))
    .eq('severity', 'critical')
    .in('status', ['open', 'acknowledged'])
  if (error) throw databaseFailure(error, 'compte des événements critiques')
  return count || 0
}
