import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'
import { buildAc360IdempotencyKey, runAc360WiredAction } from './action-wiring'
import { resolveAc360SchoolOpsContext } from './school-ops'

export type Ac360SchoolBrandingPayload = Record<string, unknown>

type BrandingWiringKey =
  | 'ac360.school_branding.profile.upsert'
  | 'ac360.school_branding.asset.register'
  | 'ac360.school_branding.domain.request'
  | 'ac360.school_branding.domain.verify'
  | 'ac360.school_branding.integration_connector.upsert'
  | 'ac360.school_branding.api_key.issue'
  | 'ac360.school_branding.api_key.revoke'
  | 'ac360.school_branding.webhook.upsert'
  | 'ac360.school_branding.webhook_delivery.record'
  | 'ac360.school_branding.integration_event.record'
  | 'ac360.school_branding.reconcile'
  | 'ac360.school_branding.alert.resolve'

function cleanMetadata(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function text(value: unknown, fallback = '') {
  const normalized = String(value ?? '').trim()
  return normalized || fallback
}

function list(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : []
}

async function currentActorId() {
  const user = await getCurrentUser().catch(() => null) as any
  return user?.id || null
}

async function executeBrandingRpc(
  wiringKey: BrandingWiringKey,
  body: Ac360SchoolBrandingPayload,
  rpcName: string,
  rpcArgs: Record<string, unknown>,
  metadata: Record<string, unknown> = {},
  quantity = 1,
) {
  const resolved = await resolveAc360SchoolOpsContext(String(body.orgId || body.org_id || '') || undefined)
  if (!resolved.ok) return resolved

  const idSeed = body.idempotencyKey || body.idempotency_key || `${resolved.orgId}:${wiringKey}:${body.brandProfileId || body.brand_profile_id || body.domainId || body.domain_id || body.connectorId || body.connector_id || body.apiKeyId || body.api_key_id || body.webhookId || body.webhook_id || body.deliveryId || body.delivery_id || body.alertId || body.alert_id || Date.now()}`

  const guarded = await runAc360WiredAction(wiringKey as any, async () => {
    const db = await createClient()
    const { data, error } = await db.rpc(rpcName, { ...rpcArgs, p_org_id: resolved.orgId } as any)
    if (error) return { ok: false, status: 500, error: error.message || `AC360 branding/integration RPC failed: ${rpcName}` }
    return { ok: true, status: 200, data }
  }, {
    orgId: resolved.orgId,
    quantity: Math.max(1, Math.ceil(quantity || 1)),
    idempotencyKey: buildAc360IdempotencyKey(wiringKey, idSeed),
    metadata: {
      source: 'lib.ac360.school-branding',
      phase: 'phase_2p_branding_domains_integrations_api',
      uiBuildAllowed: false,
      secretsPolicy: 'no_plaintext_secrets',
      rpcName,
      ...metadata,
    },
  })

  if (!guarded.ok) {
    return { ok: false, status: 402, error: guarded.error || guarded.guard.reason || 'AC360 guard blocked branding/integration action.', ac360: { guard: guarded.guard, blocked: true } }
  }

  return { ...(guarded.data as any), ac360: { guard: guarded.guard, usage: guarded.usage } }
}

export async function getAc360SchoolBrandingDashboard(orgId?: string, asOfDate?: string | null) {
  const resolved = await resolveAc360SchoolOpsContext(orgId)
  if (!resolved.ok) return resolved
  const db = await createClient()
  const { data, error } = await db.rpc('ac360_school_branding_integrations_dashboard', { p_org_id: resolved.orgId, p_as_of_date: asOfDate || null } as any)
  if (error) return { ok: false as const, status: 500, error: error.message || 'Unable to load AC360 branding/integrations dashboard.' }
  return { ok: true as const, context: resolved.context, dashboard: data }
}

export async function upsertAc360BrandProfile(body: Ac360SchoolBrandingPayload) {
  const actorId = await currentActorId()
  return executeBrandingRpc('ac360.school_branding.profile.upsert', body, 'ac360_school_upsert_brand_profile', {
    p_brand_profile_id: body.brandProfileId || body.brand_profile_id || null,
    p_profile_key: body.profileKey || body.profile_key || null,
    p_label: body.label || null,
    p_brand_name: body.brandName || body.brand_name || null,
    p_primary_color: body.primaryColor || body.primary_color || null,
    p_secondary_color: body.secondaryColor || body.secondary_color || null,
    p_accent_color: body.accentColor || body.accent_color || null,
    p_font_family: body.fontFamily || body.font_family || null,
    p_portal_title: body.portalTitle || body.portal_title || null,
    p_email_from_name: body.emailFromName || body.email_from_name || null,
    p_footer_text: body.footerText || body.footer_text || null,
    p_language_default: text(body.languageDefault || body.language_default, 'fr'),
    p_settings_json: body.settingsJson || body.settings_json || body.settings || {},
    p_status: text(body.status, 'draft'),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { brandingAction: 'profile.upsert' })
}

export async function registerAc360BrandAsset(body: Ac360SchoolBrandingPayload) {
  const actorId = await currentActorId()
  return executeBrandingRpc('ac360.school_branding.asset.register', body, 'ac360_school_register_brand_asset', {
    p_brand_profile_id: body.brandProfileId || body.brand_profile_id || null,
    p_asset_key: body.assetKey || body.asset_key || null,
    p_asset_type: text(body.assetType || body.asset_type, 'logo'),
    p_document_id: body.documentId || body.document_id || null,
    p_public_url: body.publicUrl || body.public_url || null,
    p_file_name: body.fileName || body.file_name || null,
    p_mime_type: body.mimeType || body.mime_type || null,
    p_size_bytes: body.sizeBytes || body.size_bytes || 0,
    p_checksum: body.checksum || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { brandingAction: 'asset.register' })
}

export async function requestAc360CustomDomain(body: Ac360SchoolBrandingPayload) {
  const actorId = await currentActorId()
  return executeBrandingRpc('ac360.school_branding.domain.request', body, 'ac360_school_request_custom_domain', {
    p_brand_profile_id: body.brandProfileId || body.brand_profile_id || null,
    p_domain_name: body.domainName || body.domain_name || null,
    p_domain_type: text(body.domainType || body.domain_type, 'parent_portal'),
    p_dns_target: body.dnsTarget || body.dns_target || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { brandingAction: 'domain.request' })
}

export async function verifyAc360CustomDomain(body: Ac360SchoolBrandingPayload) {
  const actorId = await currentActorId()
  return executeBrandingRpc('ac360.school_branding.domain.verify', body, 'ac360_school_verify_custom_domain', {
    p_domain_id: body.domainId || body.domain_id,
    p_verified: Boolean(body.verified),
    p_ssl_status: text(body.sslStatus || body.ssl_status, 'pending'),
    p_actor_app_user_id: actorId,
    p_dns_result: body.dnsResult || body.dns_result || {},
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { brandingAction: 'domain.verify' })
}

export async function upsertAc360IntegrationConnector(body: Ac360SchoolBrandingPayload) {
  const actorId = await currentActorId()
  return executeBrandingRpc('ac360.school_branding.integration_connector.upsert', body, 'ac360_school_upsert_integration_connector', {
    p_connector_id: body.connectorId || body.connector_id || null,
    p_connector_key: body.connectorKey || body.connector_key || null,
    p_label: body.label || null,
    p_connector_type: text(body.connectorType || body.connector_type, 'generic_api'),
    p_direction: text(body.direction, 'outbound'),
    p_base_url: body.baseUrl || body.base_url || null,
    p_auth_type: text(body.authType || body.auth_type, 'none'),
    p_scopes: list(body.scopes),
    p_settings_json: body.settingsJson || body.settings_json || body.settings || {},
    p_status: text(body.status, 'draft'),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { brandingAction: 'integration_connector.upsert' })
}

export async function issueAc360ApiKey(body: Ac360SchoolBrandingPayload) {
  const actorId = await currentActorId()
  return executeBrandingRpc('ac360.school_branding.api_key.issue', body, 'ac360_school_issue_api_key', {
    p_label: body.label || null,
    p_scopes: list(body.scopes),
    p_expires_at: body.expiresAt || body.expires_at || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { brandingAction: 'api_key.issue' })
}

export async function revokeAc360ApiKey(body: Ac360SchoolBrandingPayload) {
  const actorId = await currentActorId()
  return executeBrandingRpc('ac360.school_branding.api_key.revoke', body, 'ac360_school_revoke_api_key', {
    p_api_key_id: body.apiKeyId || body.api_key_id,
    p_actor_app_user_id: actorId,
    p_reason: body.reason || body.note || null,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { brandingAction: 'api_key.revoke' })
}

export async function upsertAc360Webhook(body: Ac360SchoolBrandingPayload) {
  const actorId = await currentActorId()
  return executeBrandingRpc('ac360.school_branding.webhook.upsert', body, 'ac360_school_upsert_webhook', {
    p_webhook_id: body.webhookId || body.webhook_id || null,
    p_connector_id: body.connectorId || body.connector_id || null,
    p_webhook_key: body.webhookKey || body.webhook_key || null,
    p_label: body.label || null,
    p_endpoint_url: body.endpointUrl || body.endpoint_url || null,
    p_event_types: list(body.eventTypes || body.event_types),
    p_status: text(body.status, 'active'),
    p_retry_policy_json: body.retryPolicyJson || body.retry_policy_json || body.retryPolicy || { max_attempts: 3 },
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { brandingAction: 'webhook.upsert' })
}

export async function recordAc360WebhookDelivery(body: Ac360SchoolBrandingPayload) {
  return executeBrandingRpc('ac360.school_branding.webhook_delivery.record', body, 'ac360_school_record_webhook_delivery', {
    p_webhook_id: body.webhookId || body.webhook_id || null,
    p_delivery_key: body.deliveryKey || body.delivery_key || null,
    p_event_type: body.eventType || body.event_type || null,
    p_status: text(body.status, 'queued'),
    p_attempt_count: body.attemptCount || body.attempt_count || 0,
    p_request_json: body.requestJson || body.request_json || body.request || {},
    p_response_json: body.responseJson || body.response_json || body.response || {},
    p_last_error: body.lastError || body.last_error || null,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { brandingAction: 'webhook_delivery.record' })
}

export async function recordAc360IntegrationEvent(body: Ac360SchoolBrandingPayload) {
  const actorId = await currentActorId()
  return executeBrandingRpc('ac360.school_branding.integration_event.record', body, 'ac360_school_record_integration_event', {
    p_connector_id: body.connectorId || body.connector_id || null,
    p_event_key: body.eventKey || body.event_key || null,
    p_event_type: body.eventType || body.event_type || null,
    p_severity: text(body.severity, 'info'),
    p_status: text(body.status, 'recorded'),
    p_payload_json: body.payloadJson || body.payload_json || body.payload || {},
    p_result_json: body.resultJson || body.result_json || body.result || {},
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { brandingAction: 'integration_event.record' })
}

export async function reconcileAc360BrandingIntegrations(body: Ac360SchoolBrandingPayload) {
  const actorId = await currentActorId()
  return executeBrandingRpc('ac360.school_branding.reconcile', body, 'ac360_school_reconcile_branding_integrations', {
    p_as_of_date: body.asOfDate || body.as_of_date || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { brandingAction: 'reconcile' })
}

export async function resolveAc360IntegrationAlert(body: Ac360SchoolBrandingPayload) {
  const actorId = await currentActorId()
  return executeBrandingRpc('ac360.school_branding.alert.resolve', body, 'ac360_school_resolve_integration_alert', {
    p_alert_id: body.alertId || body.alert_id,
    p_actor_app_user_id: actorId,
    p_resolution_note: body.resolutionNote || body.resolution_note || body.note || null,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { brandingAction: 'alert.resolve' })
}
