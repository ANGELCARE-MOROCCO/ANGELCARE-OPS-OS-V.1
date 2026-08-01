import { NextResponse } from 'next/server'
import { requireMarketplaceApiContext } from '../auth/context'
import type { MarketplacePermission } from '../domain/types'
import { apiFailure, apiSuccess, parseJsonObject, requestId } from '../server/request'
import { requireText } from '../server/request'
import {
  cloneTerritory,
  countOpenCriticalTerritoryEvents,
  createTerritory,
  createTerritoryHealthEvent,
  createTerritoryOverride,
  getTerritoryByCode,
  getTerritoryDetailBundle,
  getTerritoryOverride,
  listTerritories,
  listTerritoryHealthEvents,
  listTerritoryLaunchChecks,
  listTerritoryOverrides,
  listTerritorySettings,
  listTerritoryTemplates,
  reviewTerritoryOverride,
  rollbackTerritoryOverride,
  signOffTerritoryReadiness,
  summarizeTerritories,
  transitionTerritory,
  updateTerritory,
  updateTerritoryLaunchCheck,
  updateTerritorySetting,
  validateTerritoryReadiness,
} from './repository'
import type { TerritoryHealthStatus, TerritoryStatus } from './types'

function queryValue(request: Request, key: string): string {
  return new URL(request.url).searchParams.get(key)?.trim() || ''
}

function permissionForTransition(target: TerritoryStatus): MarketplacePermission {
  if (target === 'review') return 'marketplace.territories.submit_review'
  if (target === 'soft_launch') return 'marketplace.territories.approve_soft_launch'
  if (target === 'live') return 'marketplace.territories.approve_live'
  if (target === 'paused') return 'marketplace.territories.pause'
  if (target === 'archived') return 'marketplace.territories.archive'
  if (target === 'configuring') return 'marketplace.territories.update'
  return 'marketplace.territories.resume'
}

export async function handleTerritoriesGet(request: Request): Promise<NextResponse> {
  const id = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.territories.view')
    const status = queryValue(request, 'status') as TerritoryStatus | ''
    const health = queryValue(request, 'health') as TerritoryHealthStatus | ''
    const data = await listTerritories(context, {
      q: queryValue(request, 'q') || undefined,
      status: status || undefined,
      health: health || undefined,
      country: queryValue(request, 'country') || undefined,
      ownerId: queryValue(request, 'ownerId') || undefined,
      minReadiness: queryValue(request, 'minReadiness') ? Number(queryValue(request, 'minReadiness')) : undefined,
    })
    const critical = await countOpenCriticalTerritoryEvents(context)
    return apiSuccess({ items: data, summary: summarizeTerritories(data, critical) }, { requestId: id, meta: { total: data.length } })
  } catch (error) {
    return apiFailure(error, id)
  }
}

export async function handleTerritoriesPost(request: Request): Promise<NextResponse> {
  const id = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.territories.create')
    const body = await parseJsonObject(request)
    return apiSuccess(await createTerritory({ body, context, requestId: id, request }), { requestId: id, status: 201 })
  } catch (error) {
    return apiFailure(error, id)
  }
}

export async function handleTerritoryGet(request: Request, params: Promise<{ territoryCode: string }>): Promise<NextResponse> {
  const id = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.territories.view')
    const { territoryCode } = await params
    return apiSuccess(await getTerritoryDetailBundle(context, territoryCode), { requestId: id })
  } catch (error) {
    return apiFailure(error, id)
  }
}

export async function handleTerritoryPatch(request: Request, params: Promise<{ territoryCode: string }>): Promise<NextResponse> {
  const id = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.territories.update')
    const body = await parseJsonObject(request)
    const { territoryCode } = await params
    return apiSuccess(await updateTerritory({ territoryCode, body, context, requestId: id, request }), { requestId: id })
  } catch (error) {
    return apiFailure(error, id)
  }
}

export async function handleTerritoryClonePost(request: Request): Promise<NextResponse> {
  const id = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.territories.clone')
    const body = await parseJsonObject(request)
    return apiSuccess(await cloneTerritory({ body, context, requestId: id, request }), { requestId: id, status: 201 })
  } catch (error) {
    return apiFailure(error, id)
  }
}

export async function handleTerritoryTransitionPost(request: Request, params: Promise<{ territoryCode: string }>): Promise<NextResponse> {
  const id = requestId(request)
  try {
    const body = await parseJsonObject(request)
    const targetStatus = requireText(body.targetStatus, 'targetStatus', 'Le statut cible', 40) as TerritoryStatus
    const context = await requireMarketplaceApiContext(permissionForTransition(targetStatus))
    const { territoryCode } = await params
    return apiSuccess(await transitionTerritory({
      territoryCode,
      targetStatus,
      reason: requireText(body.reason, 'reason', 'La raison', 1000),
      comments: typeof body.comments === 'string' ? body.comments : undefined,
      context,
      requestId: id,
      request,
    }), { requestId: id })
  } catch (error) {
    return apiFailure(error, id)
  }
}

export async function handleTerritoryTemplatesGet(request: Request): Promise<NextResponse> {
  const id = requestId(request)
  try {
    await requireMarketplaceApiContext('marketplace.territories.view')
    const data = await listTerritoryTemplates()
    return apiSuccess(data, { requestId: id, meta: { total: data.length } })
  } catch (error) {
    return apiFailure(error, id)
  }
}

export async function handleTerritorySettingsGet(request: Request, params: Promise<{ territoryCode: string }>): Promise<NextResponse> {
  const id = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.territory_settings.view')
    const { territoryCode } = await params
    const territory = await getTerritoryByCode(context, territoryCode)
    const data = await listTerritorySettings(context, territory.id)
    return apiSuccess(data, { requestId: id, meta: { total: data.length } })
  } catch (error) {
    return apiFailure(error, id)
  }
}

export async function handleTerritorySettingPatch(
  request: Request,
  params: Promise<{ territoryCode: string; settingKey: string }>,
): Promise<NextResponse> {
  const id = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.territory_settings.manage')
    const body = await parseJsonObject(request)
    const { territoryCode, settingKey } = await params
    return apiSuccess(await updateTerritorySetting({ territoryCode, settingKey, body, context, requestId: id, request }), { requestId: id })
  } catch (error) {
    return apiFailure(error, id)
  }
}

export async function handleTerritoryOverridesGet(request: Request, params: Promise<{ territoryCode: string }>): Promise<NextResponse> {
  const id = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.territory_overrides.view')
    const { territoryCode } = await params
    const territory = await getTerritoryByCode(context, territoryCode)
    const data = await listTerritoryOverrides(context, territory.id)
    return apiSuccess(data, { requestId: id, meta: { total: data.length } })
  } catch (error) {
    return apiFailure(error, id)
  }
}

export async function handleTerritoryOverridesPost(request: Request, params: Promise<{ territoryCode: string }>): Promise<NextResponse> {
  const id = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.territory_overrides.create')
    const body = await parseJsonObject(request)
    const { territoryCode } = await params
    return apiSuccess(await createTerritoryOverride({ territoryCode, body, context, requestId: id, request }), { requestId: id, status: 201 })
  } catch (error) {
    return apiFailure(error, id)
  }
}

export async function handleTerritoryOverrideGet(request: Request, params: Promise<{ overrideId: string }>): Promise<NextResponse> {
  const id = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.territory_overrides.view')
    const { overrideId } = await params
    return apiSuccess(await getTerritoryOverride(context, overrideId), { requestId: id })
  } catch (error) {
    return apiFailure(error, id)
  }
}

export async function handleTerritoryOverrideReviewPost(request: Request, params: Promise<{ overrideId: string }>): Promise<NextResponse> {
  const id = requestId(request)
  try {
    const body = await parseJsonObject(request)
    const decision = body.decision === 'reject' ? 'reject' : 'approve'
    const permission: MarketplacePermission = decision === 'approve'
      ? 'marketplace.territory_overrides.approve'
      : 'marketplace.territory_overrides.reject'
    const context = await requireMarketplaceApiContext(permission)
    const { overrideId } = await params
    return apiSuccess(await reviewTerritoryOverride({
      overrideId,
      decision,
      reason: requireText(body.reason, 'reason', 'Le commentaire de décision', 1200),
      context,
      requestId: id,
      request,
    }), { requestId: id })
  } catch (error) {
    return apiFailure(error, id)
  }
}

export async function handleTerritoryOverrideRollbackPost(request: Request, params: Promise<{ overrideId: string }>): Promise<NextResponse> {
  const id = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.territory_overrides.rollback')
    const body = await parseJsonObject(request)
    const { overrideId } = await params
    return apiSuccess(await rollbackTerritoryOverride({
      overrideId,
      reason: requireText(body.reason, 'reason', 'La justification du rollback', 1200),
      context,
      requestId: id,
      request,
    }), { requestId: id })
  } catch (error) {
    return apiFailure(error, id)
  }
}

export async function handleTerritoryReadinessGet(request: Request, params: Promise<{ territoryCode: string }>): Promise<NextResponse> {
  const id = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.territory_readiness.view')
    const { territoryCode } = await params
    const territory = await getTerritoryByCode(context, territoryCode)
    const data = await listTerritoryLaunchChecks(context, territory.id)
    return apiSuccess(data, { requestId: id, meta: { total: data.length } })
  } catch (error) {
    return apiFailure(error, id)
  }
}

export async function handleTerritoryReadinessPatch(
  request: Request,
  params: Promise<{ territoryCode: string; gateKey: string }>,
): Promise<NextResponse> {
  const id = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.territory_readiness.manage')
    const body = await parseJsonObject(request)
    const { territoryCode, gateKey } = await params
    return apiSuccess(await updateTerritoryLaunchCheck({ territoryCode, gateKey, body, context, requestId: id, request }), { requestId: id })
  } catch (error) {
    return apiFailure(error, id)
  }
}

export async function handleTerritoryReadinessValidatePost(request: Request, params: Promise<{ territoryCode: string }>): Promise<NextResponse> {
  const id = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.territory_readiness.review')
    const { territoryCode } = await params
    return apiSuccess(await validateTerritoryReadiness({ territoryCode, context, requestId: id, request }), { requestId: id })
  } catch (error) {
    return apiFailure(error, id)
  }
}

export async function handleTerritoryReadinessSignOffPost(request: Request, params: Promise<{ territoryCode: string }>): Promise<NextResponse> {
  const id = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.territory_readiness.sign_off')
    const body = await parseJsonObject(request)
    const approvalType = body.approvalType === 'soft_launch' || body.approvalType === 'resume' ? body.approvalType : 'live_launch'
    const { territoryCode } = await params
    return apiSuccess(await signOffTerritoryReadiness({
      territoryCode,
      approvalType,
      comments: requireText(body.comments, 'comments', 'Le commentaire de sign-off', 1400),
      context,
      requestId: id,
      request,
    }), { requestId: id, status: 201 })
  } catch (error) {
    return apiFailure(error, id)
  }
}

export async function handleTerritoryHealthGet(request: Request, params: Promise<{ territoryCode: string }>): Promise<NextResponse> {
  const id = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.territory_health.view')
    const { territoryCode } = await params
    const territory = await getTerritoryByCode(context, territoryCode)
    const data = await listTerritoryHealthEvents(context, territory.id)
    return apiSuccess(data, { requestId: id, meta: { total: data.length } })
  } catch (error) {
    return apiFailure(error, id)
  }
}

export async function handleTerritoryHealthPost(request: Request, params: Promise<{ territoryCode: string }>): Promise<NextResponse> {
  const id = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.territory_health.manage')
    const body = await parseJsonObject(request)
    const { territoryCode } = await params
    return apiSuccess(await createTerritoryHealthEvent({ territoryCode, body, context, requestId: id, request }), { requestId: id, status: 201 })
  } catch (error) {
    return apiFailure(error, id)
  }
}

export async function handleTerritoryPreviewGet(request: Request, params: Promise<{ territoryCode: string }>): Promise<NextResponse> {
  const id = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.territories.preview')
    const { territoryCode } = await params
    const bundle = await getTerritoryDetailBundle(context, territoryCode)
    return apiSuccess({
      territory: bundle.territory,
      availability: {
        publicShell: true,
        marketplace: false,
        partnerOs: false,
        workspaces: false,
      },
      readiness: bundle.readiness,
      activeLocales: bundle.territory.active_locales,
      currencyLabel: bundle.territory.currency_label,
      timezone: bundle.territory.timezone,
      unpublishedOverrides: bundle.overrides.filter((item) => !['effective', 'rolled_back', 'rejected', 'archived'].includes(item.status)).length,
      disclosure: 'Mega ZIPs futurs non installés : aucune fonctionnalité commerciale n’est simulée dans cette prévisualisation.',
    }, { requestId: id })
  } catch (error) {
    return apiFailure(error, id)
  }
}

function csvCell(value: unknown): string {
  const normalized = value == null ? '' : typeof value === 'string' ? value : JSON.stringify(value)
  return `"${normalized.replaceAll('"', '""')}"`
}

export async function handleTerritoryExportGet(request: Request): Promise<NextResponse> {
  const id = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.territories.export')
    const rows = await listTerritories(context)
    const headers = ['territory_code', 'name', 'country_code', 'status', 'active_locales', 'currency_label', 'timezone', 'readiness_score', 'health_status', 'owner_id', 'updated_at']
    const csv = [headers.join(','), ...rows.map((row) => headers.map((header) => csvCell(row[header as keyof typeof row])).join(','))].join('\n')
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="angelcare-territories-${new Date().toISOString().slice(0, 10)}.csv"`,
        'x-request-id': id,
      },
    })
  } catch (error) {
    return apiFailure(error, id)
  }
}
