import crypto from 'crypto'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAngelcare360OperatorPermission } from '@/lib/angelcare360/operator/access'
import { getCurrentAppUser } from '@/lib/auth/session'
import {
  downloadStorageFileFromBridge,
  getStorageHealthFromBridge,
  readStorageBridgeConfig,
  recordStorageEvent,
  uploadStorageFileToBridge,
  upsertStorageFileMetadata,
} from '@/lib/email-os-core/storage-gateway'
import type {
  BrandDisplayMode,
  BrandGovernanceSnapshot,
  BrandRuntime,
  OperatorBrandAsset,
  OperatorBrandProfile,
} from '@/types/angelcare360/operator/branding'

export const BRAND_MAX_ASSET_BYTES = 500_000
export const BRAND_MAX_DIMENSION = 1600
export const BRAND_ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const
export const ANGELCARE_OFFICIAL_LOGO_URL = '/brand/angelcare-official.webp'
export const ANGELCARE_OFFICIAL_LOGO_PNG_URL = '/logo.png'

const PROFILE_TABLE = 'angelcare360_operator_brand_profiles'
const ASSET_TABLE = 'angelcare360_operator_brand_assets'
const VERSION_TABLE = 'angelcare360_operator_brand_versions'
const EVENT_TABLE = 'angelcare360_operator_brand_events'
const RUNTIME_TABLE = 'angelcare360_operator_brand_runtime_snapshots'

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function stringArray(value: unknown) {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean)
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean)
  return []
}

function validHex(value: unknown, fallback: string) {
  const text = clean(value)
  return /^#[0-9a-f]{6}$/i.test(text) ? text : fallback
}

function safeMode(value: unknown): BrandDisplayMode {
  const mode = clean(value) as BrandDisplayMode
  return ['angelcare_only', 'cobrand', 'customer_primary', 'white_label'].includes(mode) ? mode : 'angelcare_only'
}

function officialRuntime(reason: string | null = null): BrandRuntime {
  return {
    source: 'official',
    requestedMode: 'angelcare_only',
    resolvedMode: 'angelcare_only',
    clientId: null,
    tenantId: null,
    profileId: null,
    brandName: 'AngelCare',
    portalTitle: 'AngelCare 360 Command Center',
    emailFromName: 'AngelCare',
    footerText: 'Powered and operated by AngelCare.',
    primaryColor: '#0b1f4d',
    secondaryColor: '#ffffff',
    accentColor: '#e31c4b',
    logoUrl: ANGELCARE_OFFICIAL_LOGO_URL,
    faviconUrl: null,
    officialLogoUrl: ANGELCARE_OFFICIAL_LOGO_URL,
    entitlementOk: true,
    assetOk: true,
    storageOk: true,
    fallbackReason: reason,
    scopes: ['operator', 'customer_portal', 'login', 'email', 'documents'],
  }
}

async function writeBrandEvent(input: {
  profileId?: string | null
  assetId?: string | null
  clientId?: string | null
  tenantId?: string | null
  actorUserId?: string | null
  eventType: string
  severity?: 'info' | 'notice' | 'warning' | 'critical'
  summary: string
  metadata?: Record<string, unknown>
}) {
  const db = await createServiceClient()
  await db.from(EVENT_TABLE).insert({
    profile_id: input.profileId || null,
    asset_id: input.assetId || null,
    client_id: input.clientId || null,
    tenant_id: input.tenantId || null,
    actor_user_id: input.actorUserId || null,
    event_type: input.eventType,
    severity: input.severity || 'info',
    summary: input.summary,
    metadata: input.metadata || {},
  }).then(() => null, () => null)
}

async function tenantHasBrandEntitlement(db: Awaited<ReturnType<typeof createServiceClient>>, tenantId: string | null, keys: string[]) {
  if (!tenantId || !keys.length) return false
  const { data: snapshot } = await db
    .from('angelcare360_operator_tenant_entitlement_snapshots')
    .select('id')
    .eq('tenant_id', tenantId)
    .in('status', ['active', 'compiled'])
    .order('activated_at', { ascending: false, nullsFirst: false })
    .order('compiled_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()
  if (!snapshot?.id) return false
  const { data } = await db
    .from('angelcare360_operator_tenant_entitlement_items')
    .select('item_key,module_key,effective_state')
    .eq('snapshot_id', snapshot.id)
    .in('effective_state', ['enabled', 'requires_configuration'])
  return (data || []).some((item: any) => keys.includes(String(item.item_key)) || keys.includes(String(item.module_key)))
}

export async function resolveBrandRuntime(input: {
  clientId?: string | null
  tenantId?: string | null
  appUserId?: string | null
  includeUnpublished?: boolean
  recordSnapshot?: boolean
} = {}): Promise<BrandRuntime> {
  const db = await createServiceClient()
  let clientId = clean(input.clientId) || null
  let tenantId = clean(input.tenantId) || null

  if ((!clientId || !tenantId) && input.appUserId) {
    const { data: access } = await db
      .from('angelcare360_operator_tenant_access_accounts')
      .select('client_id,tenant_id')
      .eq('app_user_id', input.appUserId)
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    clientId ||= access?.client_id || null
    tenantId ||= access?.tenant_id || null
  }

  if (!clientId) return officialRuntime('Aucun client résolu pour le contexte courant.')

  let query = db.from(PROFILE_TABLE).select('*').eq('client_id', clientId)
  if (tenantId) query = query.or(`tenant_id.eq.${tenantId},tenant_id.is.null`)
  else query = query.is('tenant_id', null)
  if (!input.includeUnpublished) query = query.eq('status', 'published')
  else query = query.in('status', ['draft', 'review', 'approved', 'published', 'paused'])

  const { data: profiles } = await query.order('tenant_id', { ascending: false, nullsFirst: false }).order('published_at', { ascending: false, nullsFirst: false }).order('updated_at', { ascending: false }).limit(5)
  const profile = (profiles || []).find((item: any) => !tenantId || item.tenant_id === tenantId) || (profiles || [])[0]
  if (!profile) return { ...officialRuntime('Aucun profil client publié.'), clientId, tenantId }

  const requestedMode = safeMode(profile.display_mode)
  const entitlementKeys = stringArray(profile.entitlement_keys)
  const entitlementRequired = Boolean(profile.requires_entitlement) || requestedMode === 'white_label'
  const entitlementOk = !entitlementRequired || await tenantHasBrandEntitlement(db, tenantId || profile.tenant_id, entitlementKeys)

  const { data: assets } = await db
    .from(ASSET_TABLE)
    .select('*')
    .eq('profile_id', profile.id)
    .in('status', input.includeUnpublished ? ['active', 'review', 'published'] : ['published'])
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('updated_at', { ascending: false })

  const logo = (assets || []).find((asset: any) => asset.asset_type === 'logo') || null
  const favicon = (assets || []).find((asset: any) => asset.asset_type === 'favicon') || null
  const storageConfig = readStorageBridgeConfig()
  const storageOk = Boolean(storageConfig.hasBridgeUrl && storageConfig.hasBridgeToken)
  const assetOk = Boolean(logo?.id)

  let resolvedMode = requestedMode
  let fallbackReason: string | null = null
  if (!entitlementOk) {
    resolvedMode = 'angelcare_only'
    fallbackReason = 'Le tenant ne dispose pas de l’entitlement branding requis.'
  } else if (requestedMode !== 'angelcare_only' && !assetOk) {
    resolvedMode = 'angelcare_only'
    fallbackReason = 'Aucun logo client publié et valide.'
  } else if (requestedMode === 'white_label' && !storageOk) {
    resolvedMode = 'cobrand'
    fallbackReason = 'Le stockage Windows est indisponible; fallback co-branding sécurisé.'
  }

  const runtime: BrandRuntime = {
    source: resolvedMode === 'angelcare_only' ? 'official' : 'customer',
    requestedMode,
    resolvedMode,
    clientId,
    tenantId: tenantId || profile.tenant_id || null,
    profileId: profile.id,
    brandName: clean(profile.brand_name) || 'Votre établissement',
    portalTitle: clean(profile.portal_title) || 'AngelCare 360 Command Center',
    emailFromName: clean(profile.email_from_name) || clean(profile.brand_name) || 'AngelCare',
    footerText: clean(profile.footer_text) || 'Powered and operated by AngelCare.',
    primaryColor: validHex(profile.primary_color, '#0b1f4d'),
    secondaryColor: validHex(profile.secondary_color, '#ffffff'),
    accentColor: validHex(profile.accent_color, '#e31c4b'),
    logoUrl: resolvedMode === 'angelcare_only' ? ANGELCARE_OFFICIAL_LOGO_URL : `/api/angelcare360/branding/assets/${logo.id}${input.includeUnpublished ? '' : `?token=${logo.public_token}`}`,
    faviconUrl: favicon?.id ? `/api/angelcare360/branding/assets/${favicon.id}${input.includeUnpublished ? '' : `?token=${favicon.public_token}`}` : null,
    officialLogoUrl: ANGELCARE_OFFICIAL_LOGO_URL,
    entitlementOk,
    assetOk,
    storageOk,
    fallbackReason,
    scopes: stringArray(profile.activation_scopes),
  }

  if (input.recordSnapshot) {
    await db.from(RUNTIME_TABLE).insert({
      profile_id: profile.id,
      client_id: clientId,
      tenant_id: runtime.tenantId,
      requested_mode: requestedMode,
      resolved_mode: resolvedMode,
      entitlement_ok: entitlementOk,
      asset_ok: assetOk,
      storage_ok: storageOk,
      fallback_reason: fallbackReason,
      runtime_payload: runtime,
    }).then(() => null, () => null)
  }

  return runtime
}

export async function resolveCurrentUserBrandRuntime() {
  const user = await getCurrentAppUser().catch(() => null)
  if (!user?.id) return officialRuntime('Session utilisateur absente.')
  return resolveBrandRuntime({ appUserId: String(user.id) })
}

export async function loadBrandGovernanceSnapshot(input: { clientId?: string | null } = {}): Promise<BrandGovernanceSnapshot> {
  await requireAngelcare360OperatorPermission('operator.settings.manage')
  const db = await createServiceClient()
  const clientId = clean(input.clientId)
  const [clientsResult, tenantsResult, profilesResult, assetsResult, versionsResult, eventsResult, officialResult] = await Promise.all([
    db.from('angelcare360_operator_clients').select('id,client_code,display_name,legal_name,status,city').order('display_name'),
    db.from('angelcare360_operator_tenants').select('id,client_id,school_id,tenant_slug,status,environment,provisioning_status').order('tenant_slug'),
    clientId
      ? db.from(PROFILE_TABLE).select('*, client:angelcare360_operator_clients(id,display_name,legal_name), tenant:angelcare360_operator_tenants(id,tenant_slug,status,school_id)').eq('client_id', clientId).order('updated_at', { ascending: false })
      : db.from(PROFILE_TABLE).select('*, client:angelcare360_operator_clients(id,display_name,legal_name), tenant:angelcare360_operator_tenants(id,tenant_slug,status,school_id)').order('updated_at', { ascending: false }).limit(300),
    clientId ? db.from(ASSET_TABLE).select('*').eq('client_id', clientId).order('updated_at', { ascending: false }) : db.from(ASSET_TABLE).select('*').order('updated_at', { ascending: false }).limit(500),
    db.from(VERSION_TABLE).select('*').order('created_at', { ascending: false }).limit(200),
    clientId ? db.from(EVENT_TABLE).select('*').eq('client_id', clientId).order('created_at', { ascending: false }).limit(200) : db.from(EVENT_TABLE).select('*').order('created_at', { ascending: false }).limit(300),
    db.from('angelcare360_official_brand_assets').select('*').eq('status', 'active').order('asset_key'),
  ])

  const config = readStorageBridgeConfig()
  let storageHealth: Record<string, unknown> | null = null
  let storageError: string | null = null
  if (config.hasBridgeUrl && config.hasBridgeToken) {
    try { storageHealth = record(await getStorageHealthFromBridge()) } catch (error) { storageError = error instanceof Error ? error.message : String(error) }
  } else storageError = 'Bridge de stockage Windows non configuré.'

  const profiles = (profilesResult.data || []) as OperatorBrandProfile[]
  const assets = (assetsResult.data || []) as OperatorBrandAsset[]
  const totalBytes = assets.reduce((sum, asset) => sum + Number(asset.size_bytes || 0), 0)
  let fallbackProfiles = 0
  for (const profile of profiles.filter((item) => item.status === 'published')) {
    const runtime = await resolveBrandRuntime({ clientId: profile.client_id, tenantId: profile.tenant_id, includeUnpublished: true })
    if (runtime.fallbackReason) fallbackProfiles += 1
  }

  return {
    generatedAt: new Date().toISOString(),
    limits: { maxAssetBytes: BRAND_MAX_ASSET_BYTES, maxDimensions: BRAND_MAX_DIMENSION, allowedMimeTypes: [...BRAND_ALLOWED_MIME_TYPES] },
    official: { logoUrl: ANGELCARE_OFFICIAL_LOGO_URL, pngUrl: ANGELCARE_OFFICIAL_LOGO_PNG_URL, assets: officialResult.data || [] },
    clients: clientsResult.data || [],
    tenants: tenantsResult.data || [],
    profiles,
    assets,
    versions: versionsResult.data || [],
    events: eventsResult.data || [],
    storage: { configured: config.hasBridgeUrl && config.hasBridgeToken, host: config.bridgeUrlHost, health: storageHealth, error: storageError },
    metrics: {
      totalProfiles: profiles.length,
      publishedProfiles: profiles.filter((item) => item.status === 'published').length,
      customerAssets: assets.filter((item) => item.status !== 'archived').length,
      whiteLabelProfiles: profiles.filter((item) => item.display_mode === 'white_label' && item.status === 'published').length,
      storageFiles: assets.length,
      totalBytes,
      fallbackProfiles,
    },
  }
}

function imageDimensions(buffer: Buffer, mimeType: string) {
  if (mimeType === 'image/png' && buffer.length >= 24 && buffer.subarray(1, 4).toString() === 'PNG') {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
  }
  if (mimeType === 'image/jpeg' && buffer.length >= 4) {
    let offset = 2
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) { offset += 1; continue }
      const marker = buffer[offset + 1]
      const length = buffer.readUInt16BE(offset + 2)
      if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) {
        return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) }
      }
      if (length < 2) break
      offset += 2 + length
    }
  }
  if (mimeType === 'image/webp' && buffer.length >= 30 && buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP') {
    const kind = buffer.subarray(12, 16).toString()
    if (kind === 'VP8X') return { width: 1 + buffer.readUIntLE(24, 3), height: 1 + buffer.readUIntLE(27, 3) }
    if (kind === 'VP8 ' && buffer.length >= 30) return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff }
    if (kind === 'VP8L' && buffer.length >= 25) {
      const bits = buffer.readUInt32LE(21)
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 }
    }
  }
  throw new Error('Dimensions image impossibles à valider.')
}

function validateImageSignature(buffer: Buffer, mimeType: string) {
  if (mimeType === 'image/png') return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
  if (mimeType === 'image/jpeg') return buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[buffer.length - 2] === 0xff && buffer[buffer.length - 1] === 0xd9
  if (mimeType === 'image/webp') return buffer.length >= 16 && buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP'
  return false
}

export async function upsertBrandProfile(input: Record<string, unknown>) {
  const actor = await requireAngelcare360OperatorPermission('operator.settings.manage')
  const db = await createServiceClient()
  const id = clean(input.id)
  const clientId = clean(input.clientId || input.client_id)
  if (!clientId) return { ok: false, error: 'Client obligatoire.' }
  const tenantId = clean(input.tenantId || input.tenant_id) || null
  const displayMode = safeMode(input.displayMode || input.display_mode)
  const payload = {
    client_id: clientId,
    tenant_id: tenantId,
    school_id: clean(input.schoolId || input.school_id) || null,
    profile_key: clean(input.profileKey || input.profile_key) || 'default',
    label: clean(input.label) || 'Identité client',
    brand_name: clean(input.brandName || input.brand_name) || null,
    legal_name: clean(input.legalName || input.legal_name) || null,
    display_mode: displayMode,
    portal_title: clean(input.portalTitle || input.portal_title) || null,
    email_from_name: clean(input.emailFromName || input.email_from_name) || null,
    footer_text: clean(input.footerText || input.footer_text) || null,
    primary_color: validHex(input.primaryColor || input.primary_color, '#0b1f4d'),
    secondary_color: validHex(input.secondaryColor || input.secondary_color, '#ffffff'),
    accent_color: validHex(input.accentColor || input.accent_color, '#e31c4b'),
    font_family: clean(input.fontFamily || input.font_family) || 'Inter',
    language_default: ['fr','ar','en','mixed'].includes(clean(input.languageDefault || input.language_default)) ? clean(input.languageDefault || input.language_default) : 'fr',
    activation_scopes: stringArray(input.activationScopes || input.activation_scopes),
    entitlement_keys: stringArray(input.entitlementKeys || input.entitlement_keys),
    requires_entitlement: Boolean(input.requiresEntitlement ?? input.requires_entitlement ?? displayMode === 'white_label'),
    effective_at: clean(input.effectiveAt || input.effective_at) || null,
    expires_at: clean(input.expiresAt || input.expires_at) || null,
    settings: record(input.settings),
    metadata: record(input.metadata),
    updated_by: actor.user.id,
  }
  const previous = id ? (await db.from(PROFILE_TABLE).select('*').eq('id', id).maybeSingle()).data : null
  const result = id
    ? await db.from(PROFILE_TABLE).update(payload).eq('id', id).select('*').single()
    : await db.from(PROFILE_TABLE).insert({ ...payload, created_by: actor.user.id, status: 'draft' }).select('*').single()
  if (result.error || !result.data) return { ok: false, error: result.error?.message || 'Profil branding impossible à enregistrer.' }
  const version = Number((await db.from(VERSION_TABLE).select('version_number').eq('profile_id', result.data.id).order('version_number', { ascending: false }).limit(1).maybeSingle()).data?.version_number || 0) + 1
  await db.from(VERSION_TABLE).insert({ profile_id: result.data.id, version_number: version, snapshot: result.data, reason: clean(input.reason) || (id ? 'Mise à jour du profil' : 'Création du profil'), status: 'created', created_by: actor.user.id })
  await writeBrandEvent({ profileId: result.data.id, clientId, tenantId, actorUserId: actor.user.id, eventType: id ? 'profile.updated' : 'profile.created', severity: 'notice', summary: id ? 'Profil de marque client mis à jour.' : 'Profil de marque client créé.', metadata: { before: previous, after: result.data } })
  return { ok: true, profile: result.data }
}

export async function transitionBrandProfile(input: Record<string, unknown>) {
  const actor = await requireAngelcare360OperatorPermission('operator.settings.manage')
  const db = await createServiceClient()
  const id = clean(input.id)
  const action = clean(input.action)
  const { data: profile } = await db.from(PROFILE_TABLE).select('*').eq('id', id).maybeSingle()
  if (!profile) return { ok: false, error: 'Profil introuvable.' }
  const statusMap: Record<string, string> = { review: 'review', approve: 'approved', publish: 'published', pause: 'paused', archive: 'archived', restore: 'draft' }
  const nextStatus = statusMap[action]
  if (!nextStatus) return { ok: false, error: 'Transition de marque inconnue.' }
  if (nextStatus === 'published') {
    const { data: logo } = await db.from(ASSET_TABLE).select('id').eq('profile_id', id).eq('asset_type', 'logo').in('status', ['active','review','published']).limit(1).maybeSingle()
    if (profile.display_mode !== 'angelcare_only' && !logo) return { ok: false, error: 'Un logo client valide est requis avant publication.' }
    const publishedScope = db.from(PROFILE_TABLE).update({ status: 'paused', paused_at: new Date().toISOString() }).eq('client_id', profile.client_id).eq('status', 'published').neq('id', id)
    if (profile.tenant_id) await publishedScope.eq('tenant_id', profile.tenant_id)
    else await publishedScope.is('tenant_id', null)
    await db.from(ASSET_TABLE).update({ status: 'published', published_at: new Date().toISOString(), approved_by: actor.user.id, approved_at: new Date().toISOString() }).eq('profile_id', id).in('status', ['active','review'])
  }
  const now = new Date().toISOString()
  const update: Record<string, unknown> = { status: nextStatus, updated_by: actor.user.id }
  if (nextStatus === 'approved') Object.assign(update, { approved_by: actor.user.id, approved_at: now })
  if (nextStatus === 'published') Object.assign(update, { published_by: actor.user.id, published_at: now, paused_at: null })
  if (nextStatus === 'paused') update.paused_at = now
  if (nextStatus === 'archived') update.archived_at = now
  const { data, error } = await db.from(PROFILE_TABLE).update(update).eq('id', id).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeBrandEvent({ profileId: id, clientId: profile.client_id, tenantId: profile.tenant_id, actorUserId: actor.user.id, eventType: `profile.${action}`, severity: action === 'publish' ? 'notice' : 'info', summary: `Profil branding: ${action}.`, metadata: { previous_status: profile.status, next_status: nextStatus, reason: clean(input.reason) } })
  if (nextStatus === 'published') {
    const version = Number((await db.from(VERSION_TABLE).select('version_number').eq('profile_id', id).order('version_number', { ascending: false }).limit(1).maybeSingle()).data?.version_number || 0) + 1
    await db.from(VERSION_TABLE).insert({ profile_id: id, version_number: version, snapshot: data, reason: clean(input.reason) || 'Publication', status: 'published', created_by: actor.user.id })
    await resolveBrandRuntime({ clientId: profile.client_id, tenantId: profile.tenant_id, includeUnpublished: true, recordSnapshot: true })
  }
  return { ok: true, profile: data }
}

export async function uploadBrandAsset(input: {
  profileId: string
  assetType: string
  fileName: string
  mimeType: string
  buffer: Buffer
}) {
  const actor = await requireAngelcare360OperatorPermission('operator.settings.manage')
  const db = await createServiceClient()
  const { data: profile } = await db.from(PROFILE_TABLE).select('*').eq('id', input.profileId).maybeSingle()
  if (!profile) return { ok: false, error: 'Profil branding introuvable.' }
  if (!BRAND_ALLOWED_MIME_TYPES.includes(input.mimeType as typeof BRAND_ALLOWED_MIME_TYPES[number])) return { ok: false, error: 'Format autorisé: PNG, JPEG ou WebP.' }
  if (!input.buffer.length || input.buffer.length > BRAND_MAX_ASSET_BYTES) return { ok: false, error: `Le fichier doit être inférieur ou égal à ${BRAND_MAX_ASSET_BYTES} octets.` }
  if (!validateImageSignature(input.buffer, input.mimeType)) return { ok: false, error: 'Signature MIME incohérente ou fichier image invalide.' }
  const dimensions = imageDimensions(input.buffer, input.mimeType)
  if (dimensions.width > BRAND_MAX_DIMENSION || dimensions.height > BRAND_MAX_DIMENSION) return { ok: false, error: `Dimensions maximales: ${BRAND_MAX_DIMENSION} × ${BRAND_MAX_DIMENSION}px.` }
  const assetType = ['logo','favicon','email_header','pdf_header','portal_banner','login_background','signature','other'].includes(input.assetType) ? input.assetType : 'logo'
  const sha256 = crypto.createHash('sha256').update(input.buffer).digest('hex')
  const upload = await uploadStorageFileToBridge({
    moduleKey: 'angelcare_brand_assets',
    entityType: 'brand_asset',
    entityId: profile.id,
    originalFilename: input.fileName,
    contentType: input.mimeType,
    contentBase64: input.buffer.toString('base64'),
    createdBy: String(actor.user.id),
    direction: 'archive',
    metadata: { namespace: 'branding/customers', clientId: profile.client_id, tenantId: profile.tenant_id, profileId: profile.id, assetType, maxBytes: BRAND_MAX_ASSET_BYTES, width: dimensions.width, height: dimensions.height },
  })
  if (!upload?.id) return { ok: false, error: 'Le Windows Storage Bridge n’a retourné aucun identifiant de fichier.' }
  await upsertStorageFileMetadata(db as never, { ...upload, id: upload.id, module_key: 'angelcare_brand_assets', entity_type: 'brand_asset', entity_id: profile.id, storage_bucket: upload.storage_bucket || 'angelcare-brand-assets', metadata: { ...(upload.metadata || {}), namespace: 'branding/customers' } })
  const assetKey = `${assetType}-${profile.profile_key}`
  const { data: existing } = await db.from(ASSET_TABLE).select('*').eq('profile_id', profile.id).eq('asset_key', assetKey).maybeSingle()
  if (existing?.storage_file_id && existing.storage_file_id !== upload.id) {
    await db.from(ASSET_TABLE).update({ status: 'archived', archived_at: new Date().toISOString() }).eq('id', existing.id)
  }
  const payload = {
    profile_id: profile.id,
    client_id: profile.client_id,
    tenant_id: profile.tenant_id,
    school_id: profile.school_id,
    storage_file_id: upload.id,
    asset_key: assetKey,
    asset_type: assetType,
    file_name: input.fileName,
    mime_type: input.mimeType,
    size_bytes: input.buffer.length,
    width_px: dimensions.width,
    height_px: dimensions.height,
    sha256_hash: sha256,
    status: 'active',
    metadata: { storage_bucket: upload.storage_bucket, storage_key: upload.storage_key, storage_node: upload.storage_node, namespace: 'branding/customers', shared_source: true, strict_max_bytes: BRAND_MAX_ASSET_BYTES },
    created_by: actor.user.id,
  }
  const { data, error } = await db.from(ASSET_TABLE).upsert(payload, { onConflict: 'profile_id,asset_key' }).select('*').single()
  if (error || !data) return { ok: false, error: error?.message || 'Enregistrement de l’asset impossible.' }
  await recordStorageEvent(db as never, { fileId: upload.id, action: 'brand_asset_uploaded', moduleKey: 'angelcare_brand_assets', actorUserId: String(actor.user.id), metadata: { profileId: profile.id, clientId: profile.client_id, assetId: data.id, assetType, sizeBytes: input.buffer.length, sha256 } })
  await writeBrandEvent({ profileId: profile.id, assetId: data.id, clientId: profile.client_id, tenantId: profile.tenant_id, actorUserId: actor.user.id, eventType: 'asset.uploaded', severity: 'notice', summary: `Asset ${assetType} stocké sur le Windows Node.`, metadata: { storage_file_id: upload.id, dimensions, size_bytes: input.buffer.length, sha256 } })
  return { ok: true, asset: data, storage: { id: upload.id, bucket: upload.storage_bucket, key: upload.storage_key, node: upload.storage_node } }
}

export async function archiveBrandAsset(input: Record<string, unknown>) {
  const actor = await requireAngelcare360OperatorPermission('operator.settings.manage')
  const db = await createServiceClient()
  const id = clean(input.id)
  const { data: asset } = await db.from(ASSET_TABLE).select('*').eq('id', id).maybeSingle()
  if (!asset) return { ok: false, error: 'Asset introuvable.' }
  const { data, error } = await db.from(ASSET_TABLE).update({ status: 'archived', archived_at: new Date().toISOString() }).eq('id', id).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeBrandEvent({ profileId: asset.profile_id, assetId: id, clientId: asset.client_id, tenantId: asset.tenant_id, actorUserId: actor.user.id, eventType: 'asset.archived', severity: 'warning', summary: 'Asset branding archivé.', metadata: { reason: clean(input.reason), storage_file_id: asset.storage_file_id } })
  return { ok: true, asset: data }
}

export async function getBrandAssetResponse(assetId: string, publicToken?: string | null) {
  const db = await createServiceClient()
  let query = db.from(ASSET_TABLE).select('*').eq('id', assetId)
  if (publicToken) query = query.eq('public_token', publicToken).eq('status', 'published')
  else {
    const user = await getCurrentAppUser().catch(() => null)
    if (!user?.id) throw new Error('Accès branding non autorisé.')
    query = query.in('status', ['active','review','published'])
  }
  const { data: asset } = await query.maybeSingle()
  if (!asset?.storage_file_id) throw new Error('Asset branding introuvable.')
  const response = await downloadStorageFileFromBridge(asset.storage_file_id)
  const bytes = await response.arrayBuffer()
  return { asset, bytes }
}

export async function executeBrandOperation(operation: string, payload: Record<string, unknown>) {
  if (operation === 'profile.upsert') return upsertBrandProfile(payload)
  if (operation === 'profile.transition') return transitionBrandProfile(payload)
  if (operation === 'asset.archive') return archiveBrandAsset(payload)
  if (operation === 'runtime.test') {
    await requireAngelcare360OperatorPermission('operator.settings.manage')
    return { ok: true, runtime: await resolveBrandRuntime({ clientId: clean(payload.clientId), tenantId: clean(payload.tenantId), includeUnpublished: true, recordSnapshot: true }) }
  }
  return { ok: false, error: 'Opération Brand Governance inconnue.' }
}
