import { createServiceClient } from '@/lib/supabase/server'
import type {
  MarketplaceAuditResult,
  MarketplaceRequestContext,
} from '../domain/types'
import { MarketplaceError } from '../server/errors'

export interface WriteMarketplaceAuditInput {
  context: MarketplaceRequestContext
  requestId: string
  action: string
  objectType: string
  objectId?: string | null
  territoryId?: string | null
  tenantId?: string | null
  beforeValue?: unknown
  afterValue?: unknown
  reason?: string | null
  result?: MarketplaceAuditResult
  severity?: 'info' | 'warning' | 'critical'
  source?: string
  request?: Request
}

function requestNetworkContext(request?: Request): {
  ipAddress: string | null
  deviceContext: Record<string, unknown>
} {
  if (!request) return { ipAddress: null, deviceContext: {} }
  const forwarded = request.headers.get('x-forwarded-for')
  return {
    ipAddress: forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null,
    deviceContext: {
      userAgent: request.headers.get('user-agent') || null,
      referer: request.headers.get('referer') || null,
    },
  }
}

export async function writeMarketplaceAudit(input: WriteMarketplaceAuditInput): Promise<void> {
  const supabase = await createServiceClient()
  const network = requestNetworkContext(input.request)
  const { error } = await supabase.from('angelcare_marketplace_audit_events').insert({
    request_id: input.requestId,
    actor_id: input.context.actor.id,
    actor_role: input.context.roleKeys[0] || input.context.actor.sourceRole || null,
    action: input.action,
    object_type: input.objectType,
    object_id: input.objectId || null,
    territory_id: input.territoryId ?? input.context.territoryId,
    tenant_id: input.tenantId ?? input.context.tenantId,
    before_value: input.beforeValue ?? null,
    after_value: input.afterValue ?? null,
    reason: input.reason || null,
    result: input.result || 'success',
    severity: input.severity || 'info',
    source: input.source || 'angelcare-marketplace',
    ip_address: network.ipAddress,
    device_context: network.deviceContext,
  })

  if (error) {
    throw new MarketplaceError(
      'INTERNAL_ERROR',
      'L’action a été enregistrée, mais sa preuve d’audit n’a pas pu être confirmée. Une correction technique est requise.',
      { cause: error, retryable: true },
    )
  }
}
