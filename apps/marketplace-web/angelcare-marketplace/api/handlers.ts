import { NextResponse } from 'next/server'
import {
  getMarketplaceContext,
  requireMarketplaceApiContext,
} from '../auth/context'
import type {
  MarketplaceModuleStatus,
  MarketplacePermission,
} from '../domain/types'
import {
  createMarketplaceFeatureFlag,
  createMarketplaceModule,
  getMarketplaceModule,
  listMarketplaceAuditEvents,
  listMarketplaceConfigurations,
  listMarketplaceFeatureFlags,
  listMarketplaceModules,
  listMarketplaceReadiness,
  marketplaceFoundationHealth,
  signOffMarketplaceReadiness,
  transitionMarketplaceModule,
  updateMarketplaceConfiguration,
  updateMarketplaceFeatureFlag,
  updateMarketplaceModule,
  updateMarketplaceReadiness,
} from '../server/repository'
import { MarketplaceError } from '../server/errors'
import {
  apiFailure,
  apiSuccess,
  cleanText,
  parseJsonObject,
  requestId,
  requireText,
} from '../server/request'
import { writeMarketplaceAudit } from '../audit/write-audit'
import { getMarketplaceRuntimeConfig } from '../config/runtime'

function queryValue(request: Request, key: string): string {
  return new URL(request.url).searchParams.get(key)?.trim() || ''
}

export async function handleContextGet(request: Request): Promise<NextResponse> {
  const id = requestId(request)
  try {
    const context = await getMarketplaceContext()
    return apiSuccess(
      context
        ? {
            authenticated: true,
            actor: context.actor,
            roleKeys: context.roleKeys,
            permissions: context.permissions,
            territoryId: context.territoryId,
            tenantId: context.tenantId,
            locale: context.locale,
          }
        : { authenticated: false },
      { requestId: id },
    )
  } catch (error) {
    return apiFailure(error, id)
  }
}

export async function handleHealthGet(request: Request): Promise<NextResponse> {
  const id = requestId(request)
  try {
    const runtime = getMarketplaceRuntimeConfig()
    const health = await marketplaceFoundationHealth()
    return apiSuccess(
      {
        ...health,
        releaseVersion: runtime.releaseVersion,
        environment: runtime.environment,
      },
      { requestId: id, status: health.status === 'healthy' ? 200 : 503 },
    )
  } catch (error) {
    return apiFailure(error, id)
  }
}

export async function handleModulesGet(request: Request): Promise<NextResponse> {
  const id = requestId(request)
  try {
    await requireMarketplaceApiContext('marketplace.modules.view')
    const data = await listMarketplaceModules({
      q: queryValue(request, 'q'),
      status: queryValue(request, 'status'),
      audience: queryValue(request, 'audience'),
    })
    return apiSuccess(data, { requestId: id, meta: { total: data.length } })
  } catch (error) {
    return apiFailure(error, id)
  }
}

export async function handleModulesPost(request: Request): Promise<NextResponse> {
  const id = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.modules.create')
    const body = await parseJsonObject(request)
    const data = await createMarketplaceModule({ body, context, requestId: id, request })
    return apiSuccess(data, { requestId: id, status: 201 })
  } catch (error) {
    return apiFailure(error, id)
  }
}

export async function handleModuleGet(
  request: Request,
  params: Promise<{ moduleKey: string }>,
): Promise<NextResponse> {
  const id = requestId(request)
  try {
    await requireMarketplaceApiContext('marketplace.modules.view')
    const { moduleKey } = await params
    return apiSuccess(await getMarketplaceModule(moduleKey), { requestId: id })
  } catch (error) {
    return apiFailure(error, id)
  }
}

export async function handleModulePatch(
  request: Request,
  params: Promise<{ moduleKey: string }>,
): Promise<NextResponse> {
  const id = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.modules.update')
    const { moduleKey } = await params
    const body = await parseJsonObject(request)
    return apiSuccess(
      await updateMarketplaceModule({ moduleKey, body, context, requestId: id, request }),
      { requestId: id },
    )
  } catch (error) {
    return apiFailure(error, id)
  }
}

function transitionPermission(target: MarketplaceModuleStatus): MarketplacePermission {
  if (target === 'enabled') return 'marketplace.modules.enable'
  if (target === 'disabled') return 'marketplace.modules.disable'
  if (target === 'archived') return 'marketplace.modules.archive'
  return 'marketplace.modules.update'
}

export async function handleModuleTransitionPost(
  request: Request,
  params: Promise<{ moduleKey: string }>,
): Promise<NextResponse> {
  const id = requestId(request)
  try {
    const body = await parseJsonObject(request)
    const targetStatus = cleanText(body.targetStatus, 40) as MarketplaceModuleStatus
    const allowed: MarketplaceModuleStatus[] = [
      'registered',
      'not_installed',
      'disabled',
      'enabled',
      'blocked',
      'degraded',
      'deprecated',
      'archived',
    ]
    if (!allowed.includes(targetStatus)) {
      throw new MarketplaceError('VALIDATION_ERROR', 'Le statut cible est invalide.', {
        fieldErrors: { targetStatus: ['Sélectionnez un statut autorisé.'] },
      })
    }
    const context = await requireMarketplaceApiContext(transitionPermission(targetStatus))
    const { moduleKey } = await params
    const reason = requireText(body.reason, 'reason', 'La raison', 500)
    return apiSuccess(
      await transitionMarketplaceModule({
        moduleKey,
        targetStatus,
        reason,
        context,
        requestId: id,
        request,
      }),
      { requestId: id },
    )
  } catch (error) {
    return apiFailure(error, id)
  }
}

export async function handleFeatureFlagsGet(request: Request): Promise<NextResponse> {
  const id = requestId(request)
  try {
    await requireMarketplaceApiContext('marketplace.feature_flags.view')
    const data = await listMarketplaceFeatureFlags()
    return apiSuccess(data, { requestId: id, meta: { total: data.length } })
  } catch (error) {
    return apiFailure(error, id)
  }
}

export async function handleFeatureFlagsPost(request: Request): Promise<NextResponse> {
  const id = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.feature_flags.manage')
    const body = await parseJsonObject(request)
    return apiSuccess(
      await createMarketplaceFeatureFlag({ body, context, requestId: id, request }),
      { requestId: id, status: 201 },
    )
  } catch (error) {
    return apiFailure(error, id)
  }
}

export async function handleFeatureFlagPatch(
  request: Request,
  params: Promise<{ flagKey: string }>,
): Promise<NextResponse> {
  const id = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.feature_flags.manage')
    const body = await parseJsonObject(request)
    const { flagKey } = await params
    return apiSuccess(
      await updateMarketplaceFeatureFlag({ flagKey, body, context, requestId: id, request }),
      { requestId: id },
    )
  } catch (error) {
    return apiFailure(error, id)
  }
}

export async function handleConfigurationsGet(request: Request): Promise<NextResponse> {
  const id = requestId(request)
  try {
    await requireMarketplaceApiContext('marketplace.configuration.view')
    const data = (await listMarketplaceConfigurations()).map((configuration) => ({
      ...configuration,
      value: configuration.sensitive ? { redacted: true } : configuration.value,
    }))
    return apiSuccess(data, { requestId: id, meta: { total: data.length } })
  } catch (error) {
    return apiFailure(error, id)
  }
}

export async function handleConfigurationPatch(
  request: Request,
  params: Promise<{ key: string }>,
): Promise<NextResponse> {
  const id = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.configuration.manage')
    const body = await parseJsonObject(request)
    const { key } = await params
    return apiSuccess(
      await updateMarketplaceConfiguration({
        configKey: key,
        body,
        context,
        requestId: id,
        request,
      }),
      { requestId: id },
    )
  } catch (error) {
    return apiFailure(error, id)
  }
}

export async function handleAuditGet(request: Request): Promise<NextResponse> {
  const id = requestId(request)
  try {
    await requireMarketplaceApiContext('marketplace.audit.view')
    const data = await listMarketplaceAuditEvents({
      q: queryValue(request, 'q'),
      result: queryValue(request, 'result'),
      severity: queryValue(request, 'severity'),
      limit: Number(queryValue(request, 'limit') || 100),
    })
    return apiSuccess(data, { requestId: id, meta: { total: data.length } })
  } catch (error) {
    return apiFailure(error, id)
  }
}

function csvCell(value: unknown): string {
  const normalized =
    value == null ? '' : typeof value === 'string' ? value : JSON.stringify(value)
  return `"${normalized.replaceAll('"', '""')}"`
}

export async function handleAuditExportGet(request: Request): Promise<Response> {
  const id = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.audit.export')
    const data = await listMarketplaceAuditEvents({
      q: queryValue(request, 'q'),
      result: queryValue(request, 'result'),
      severity: queryValue(request, 'severity'),
      limit: 500,
    })
    const headers = [
      'created_at',
      'actor_id',
      'actor_role',
      'action',
      'object_type',
      'object_id',
      'result',
      'severity',
      'request_id',
      'reason',
    ]
    const csv = [
      headers.join(','),
      ...data.map((row) => headers.map((header) => csvCell(row[header as keyof typeof row])).join(',')),
    ].join('\n')

    await writeMarketplaceAudit({
      context,
      requestId: id,
      request,
      action: 'marketplace.audit.exported',
      objectType: 'marketplace_audit_export',
      afterValue: { rowCount: data.length },
      reason: 'Export autorisé depuis le Master Backoffice.',
    })

    return new Response(csv, {
      status: 200,
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="angelcare-marketplace-audit-${new Date()
          .toISOString()
          .slice(0, 10)}.csv"`,
        'x-request-id': id,
      },
    })
  } catch (error) {
    return apiFailure(error, id)
  }
}

export async function handleReadinessGet(request: Request): Promise<NextResponse> {
  const id = requestId(request)
  try {
    await requireMarketplaceApiContext('marketplace.readiness.view')
    const data = await listMarketplaceReadiness()
    return apiSuccess(data, { requestId: id, meta: { total: data.length } })
  } catch (error) {
    return apiFailure(error, id)
  }
}

export async function handleReadinessPatch(
  request: Request,
  params: Promise<{ checkKey: string }>,
): Promise<NextResponse> {
  const id = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.readiness.update')
    const body = await parseJsonObject(request)
    const { checkKey } = await params
    return apiSuccess(
      await updateMarketplaceReadiness({
        checkKey,
        body,
        context,
        requestId: id,
        request,
      }),
      { requestId: id },
    )
  } catch (error) {
    return apiFailure(error, id)
  }
}

export async function handleReadinessSignOffPost(request: Request): Promise<NextResponse> {
  const id = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.readiness.sign_off')
    const body = await parseJsonObject(request)
    const reason = requireText(body.reason, 'reason', 'La note de signature', 1000)
    return apiSuccess(
      await signOffMarketplaceReadiness({ context, requestId: id, request, reason }),
      { requestId: id, status: 201 },
    )
  } catch (error) {
    return apiFailure(error, id)
  }
}
