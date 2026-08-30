import { createHmac } from 'node:crypto'
import sharp from 'sharp'
import { MarketplaceError } from '../server/errors'

const DEFAULT_MAX_BYTES = 40 * 1024 * 1024

export interface MarketplaceGatewayAsset {
  assetId: string
  storageKey: string
  safeFilename: string
  mimeType: string
  sizeBytes: number
  sha256: string
  createdAt: string
}

export type MarketplaceImageVariant = 'desktop' | 'tablet' | 'mobile' | 'square'
export type MarketplaceImageDerivatives = Record<MarketplaceImageVariant, MarketplaceGatewayAsset>

function gatewayBaseUrl(): string {
  return String(process.env.MARKETPLACE_MEDIA_GATEWAY_PUBLIC_URL || '').trim().replace(/\/+$/, '')
}

function gatewayAdminToken(): string {
  return String(process.env.MARKETPLACE_MEDIA_GATEWAY_ADMIN_TOKEN || '').trim()
}

function signingSecret(): string {
  return String(process.env.MARKETPLACE_MEDIA_SIGNING_SECRET || '').trim()
}

function signCompact(payload: Record<string, unknown>): string {
  const secret = signingSecret()
  if (!secret) throw new MarketplaceError('CONFIGURATION_ERROR', 'La signature du stockage média Marketplace n’est pas configurée.')
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = createHmac('sha256', secret).update(body).digest('base64url')
  return `${body}.${signature}`
}

export function marketplaceMediaStorageConfiguration() {
  const root = gatewayBaseUrl()
  return {
    backend: 'windows_self_hosted' as const,
    configured: Boolean(root && gatewayAdminToken() && signingSecret()),
    gatewayUrlPresent: Boolean(root),
    adminTokenPresent: Boolean(gatewayAdminToken()),
    signingSecretPresent: Boolean(signingSecret()),
    publicServingPresent: Boolean(root && signingSecret()),
    logicalRoot: 'Marketplace/assets',
    maxUploadBytes: Number(process.env.MARKETPLACE_MEDIA_MAX_BYTES || DEFAULT_MAX_BYTES),
    acceptedMimeFamilies: String(process.env.MARKETPLACE_MEDIA_ALLOWED_MIME || 'image/jpeg,image/png,image/webp,image/avif,image/svg+xml,video/mp4,video/webm,application/pdf').split(',').map(value => value.trim()).filter(Boolean),
  }
}

export function createMarketplaceMediaUploadSession(input: {
  assetId: string
  filename: string
  mimeType: string
  maxBytes: number
  actorUserId: string
}) {
  const root = gatewayBaseUrl()
  if (!marketplaceMediaStorageConfiguration().configured || !root) {
    throw new MarketplaceError('CONFIGURATION_ERROR', 'Le stockage média Windows Marketplace n’est pas entièrement configuré.')
  }
  const expiresAt = Date.now() + 30 * 60 * 1000
  const token = signCompact({
    kind: 'upload',
    assetId: input.assetId,
    filename: input.filename,
    mimeType: input.mimeType,
    maxBytes: Math.min(input.maxBytes, marketplaceMediaStorageConfiguration().maxUploadBytes),
    actorUserId: input.actorUserId,
    namespace: 'marketplace',
    exp: expiresAt,
  })
  return {
    uploadUrl: `${root}/upload/${encodeURIComponent(input.assetId)}?token=${encodeURIComponent(token)}`,
    expiresAt: new Date(expiresAt).toISOString(),
  }
}

export function createMarketplaceMediaDeliveryUrl(assetId: string, ttlMs = 6 * 60 * 60 * 1000): string {
  const root = gatewayBaseUrl()
  if (!root) throw new MarketplaceError('CONFIGURATION_ERROR', 'Le point de livraison média Marketplace n’est pas configuré.')
  const token = signCompact({ kind: 'delivery', assetId, namespace: 'marketplace', exp: Date.now() + ttlMs })
  return `${root}/media/${encodeURIComponent(assetId)}?token=${encodeURIComponent(token)}`
}

async function gatewayAdmin(pathname: string, init?: RequestInit): Promise<unknown> {
  const root = gatewayBaseUrl()
  const adminToken = gatewayAdminToken()
  if (!root || !adminToken) throw new MarketplaceError('CONFIGURATION_ERROR', 'Le stockage média Windows Marketplace n’est pas configuré.')
  const headers = new Headers(init?.headers)
  headers.set('x-marketplace-media-admin-token', adminToken)
  const response = await fetch(`${root}${pathname}`, { ...init, headers, cache: 'no-store' })
  const payload = await response.json().catch(() => null) as { ok?: boolean; data?: unknown; error?: string } | null
  if (!response.ok || payload?.ok === false) {
    throw new MarketplaceError('INTERNAL_ERROR', payload?.error || `Stockage média indisponible (HTTP ${response.status}).`, { retryable: response.status >= 500 })
  }
  return payload?.data ?? payload
}

export async function fetchMarketplaceGatewayAsset(assetId: string): Promise<MarketplaceGatewayAsset> {
  return gatewayAdmin(`/admin/assets/${encodeURIComponent(assetId)}`) as Promise<MarketplaceGatewayAsset>
}

export async function deleteMarketplaceGatewayAsset(assetId: string): Promise<void> {
  await gatewayAdmin(`/admin/assets/${encodeURIComponent(assetId)}`, { method: 'DELETE' })
}

export async function uploadMarketplaceGatewayBytes(input: {
  assetId: string
  filename: string
  mimeType: string
  bytes: Uint8Array
  actorUserId: string
}): Promise<MarketplaceGatewayAsset> {
  const session = createMarketplaceMediaUploadSession({
    assetId: input.assetId,
    filename: input.filename,
    mimeType: input.mimeType,
    maxBytes: input.bytes.byteLength,
    actorUserId: input.actorUserId,
  })
  const response = await fetch(session.uploadUrl, {
    method: 'PUT',
    headers: { 'content-type': input.mimeType, 'content-length': String(input.bytes.byteLength) },
    body: input.bytes,
  })
  const payload = await response.json().catch(() => null) as { ok?: boolean; error?: string } | null
  if (!response.ok || payload?.ok === false) throw new MarketplaceError('INTERNAL_ERROR', payload?.error || 'Le stockage média a refusé le fichier.')
  return fetchMarketplaceGatewayAsset(input.assetId)
}

export async function imageDerivatives(input: {
  assetId: string
  bytes: Uint8Array
  actorUserId: string
}): Promise<MarketplaceImageDerivatives> {
  const specifications = {
    desktop: { width: 1800, height: 1200, fit: 'inside' as const },
    tablet: { width: 1200, height: 1000, fit: 'inside' as const },
    mobile: { width: 768, height: 960, fit: 'inside' as const },
    square: { width: 900, height: 900, fit: 'cover' as const },
  }
  const records = {} as MarketplaceImageDerivatives
  for (const [variant, specification] of Object.entries(specifications) as [MarketplaceImageVariant, typeof specifications.desktop][]) {
    const bytes = await sharp(input.bytes, { failOn: 'warning' })
      .rotate()
      .resize({ ...specification, withoutEnlargement: true, position: 'centre' })
      .webp({ quality: 88, effort: 4 })
      .toBuffer()
    records[variant] = await uploadMarketplaceGatewayBytes({
      assetId: `${input.assetId}--${variant}`,
      filename: `${variant}.webp`,
      mimeType: 'image/webp',
      bytes: new Uint8Array(bytes),
      actorUserId: input.actorUserId,
    })
  }
  return records
}

export async function marketplaceMediaStorageHealth() {
  const configuration = marketplaceMediaStorageConfiguration()
  const root = gatewayBaseUrl()
  if (!root) return { ...configuration, reachable: false, healthy: false, error: 'MARKETPLACE_MEDIA_GATEWAY_PUBLIC_URL absent' }
  try {
    const response = await fetch(`${root}/health`, { cache: 'no-store' })
    const payload = await response.json().catch(() => null) as { ok?: boolean; data?: Record<string, unknown>; error?: string } | null
    const data = payload?.data || {}
    return {
      ...configuration,
      reachable: response.ok,
      healthy: response.ok && payload?.ok !== false && data.healthy !== false,
      rootLabel: data.rootLabel || null,
      freeBytes: data.freeBytes ?? null,
      totalBytes: data.totalBytes ?? null,
      usedBytes: data.usedBytes ?? null,
      minFreeBytes: data.minFreeBytes ?? null,
      temporaryFiles: data.temporaryFiles ?? null,
      warnings: Array.isArray(data.warnings) ? data.warnings.map(String) : [],
      serverTime: data.serverTime || null,
      error: response.ok ? null : payload?.error || `HTTP ${response.status}`,
    }
  } catch (error) {
    return { ...configuration, reachable: false, healthy: false, error: error instanceof Error ? error.message : String(error) }
  }
}
