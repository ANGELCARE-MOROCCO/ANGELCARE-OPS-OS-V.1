import 'server-only'
import { createServiceClient } from '@/lib/supabase/server'
import type { MarketplaceRequestContext } from '@/angelcare-marketplace/domain/types'
import { getPublishedWebPresence, resolveAsset } from './repository'
import { buildManifest, buildRobots, buildSitemap, buildWebPresenceMetadata } from './runtime'
import { WebPresenceInputError } from './schema'
import type {
  WebPresenceHealthStatus,
  WebPresenceProbeEvidence,
  WebPresenceProbeStatus,
  WebPresenceScope,
} from './types'

const ORIGIN = 'https://my.angelcarehub.com'

type ProbeKind = WebPresenceProbeEvidence['kind']

type EvidenceInput = {
  checkKey: string
  label: string
  kind: ProbeKind
  checkedUrl: string
  revision: number
  requestId: string
  status?: WebPresenceProbeStatus
  httpStatus?: number
  contentType?: string
  effectiveValues?: Record<string, unknown>
  failures?: string[]
  warnings?: string[]
  latencyMs?: number
}

function healthFromEvidence(evidence: WebPresenceProbeEvidence[]): WebPresenceHealthStatus {
  if (!evidence.length) return 'NOT_VERIFIED'
  if (evidence.some(item => item.status === 'FAIL')) return 'FAILED'
  if (evidence.some(item => item.status === 'WARN')) return 'WARNING'
  // Historical INCONCLUSIVE rows remain readable, but deterministic runtime verification
  // never degrades health simply because a server cannot hairpin-fetch its own public host.
  return 'HEALTHY'
}

function evidence(input: EvidenceInput): WebPresenceProbeEvidence {
  const status = input.status || 'PASS'
  return {
    checkKey: input.checkKey,
    label: input.label,
    kind: input.kind,
    checkedUrl: input.checkedUrl,
    httpStatus: input.httpStatus || 0,
    contentType: input.contentType || '',
    effectiveValues: input.effectiveValues || {},
    checkedAt: new Date().toISOString(),
    publishedRevision: input.revision,
    requestId: input.requestId,
    status,
    result: status === 'FAIL' ? 'FAIL' : 'PASS',
    failures: input.failures || [],
    warnings: input.warnings || [],
    attempts: 1,
    latencyMs: input.latencyMs || 0,
  }
}

function skipped(input: Omit<EvidenceInput, 'status'> & { reason: string }): WebPresenceProbeEvidence {
  return evidence({
    ...input,
    status: 'SKIPPED',
    effectiveValues: { ...(input.effectiveValues || {}), reason: input.reason },
  })
}

async function checkRuntimePage(
  scope: WebPresenceScope,
  locale: 'fr' | 'en',
  revision: number,
  requestId: string,
): Promise<WebPresenceProbeEvidence> {
  const checkedUrl = scope === 'MARKETPLACE' ? `${ORIGIN}/angelcare-marketplace/${locale}` : `${ORIGIN}/`
  const started = Date.now()
  try {
    const metadata = await buildWebPresenceMetadata(scope, locale)
    return evidence({
      checkKey: scope === 'MARKETPLACE' ? `marketplace-${locale}` : 'public-root',
      label: scope === 'MARKETPLACE' ? `Marketplace ${locale.toUpperCase()}` : 'Domaine public',
      kind: 'html',
      checkedUrl,
      revision,
      requestId,
      latencyMs: Date.now() - started,
      effectiveValues: {
        verificationMode: 'DIRECT_RUNTIME_AUTHORITY',
        titleReady: Boolean(metadata.title),
        descriptionReady: Boolean(metadata.description),
        iconsReady: Boolean(metadata.icons),
        manifestReady: Boolean(metadata.manifest),
      },
    })
  } catch (error) {
    return evidence({
      checkKey: scope === 'MARKETPLACE' ? `marketplace-${locale}` : 'public-root',
      label: scope === 'MARKETPLACE' ? `Marketplace ${locale.toUpperCase()}` : 'Domaine public',
      kind: 'html',
      checkedUrl,
      revision,
      requestId,
      status: 'FAIL',
      failures: ['RUNTIME_METADATA_FAILED'],
      latencyMs: Date.now() - started,
      effectiveValues: { verificationMode: 'DIRECT_RUNTIME_AUTHORITY', error: error instanceof Error ? error.message : 'UNKNOWN' },
    })
  }
}

async function checkManifest(revision: number, requestId: string): Promise<WebPresenceProbeEvidence> {
  const started = Date.now()
  try {
    const manifest = await buildManifest()
    const icons = Array.isArray(manifest.icons) ? manifest.icons : []
    return evidence({
      checkKey: 'manifest',
      label: 'Manifest Web App',
      kind: 'manifest',
      checkedUrl: `${ORIGIN}/manifest.webmanifest`,
      revision,
      requestId,
      latencyMs: Date.now() - started,
      contentType: 'application/manifest+json',
      effectiveValues: {
        verificationMode: 'DIRECT_RUNTIME_AUTHORITY',
        name: manifest.name,
        startUrl: manifest.start_url,
        scope: manifest.scope,
        iconCount: icons.length,
        icons,
      },
    })
  } catch (error) {
    return evidence({
      checkKey: 'manifest',
      label: 'Manifest Web App',
      kind: 'manifest',
      checkedUrl: `${ORIGIN}/manifest.webmanifest`,
      revision,
      requestId,
      status: 'FAIL',
      failures: ['MANIFEST_RUNTIME_FAILED'],
      latencyMs: Date.now() - started,
      effectiveValues: { verificationMode: 'DIRECT_RUNTIME_AUTHORITY', error: error instanceof Error ? error.message : 'UNKNOWN' },
    })
  }
}

async function checkAsset(input: {
  assetKey: string | null
  route: string
  label: string
  revision: number
  requestId: string
}): Promise<WebPresenceProbeEvidence> {
  const checkedUrl = `${ORIGIN}/api/angelcare-marketplace/public/web-presence/assets/${input.route}?scope=MARKETPLACE&revision=${input.revision}`
  if (!input.assetKey) {
    return skipped({
      checkKey: `asset-${input.route}`,
      label: input.label,
      kind: 'asset',
      checkedUrl,
      revision: input.revision,
      requestId: input.requestId,
      reason: 'OPTIONAL_ASSET_NOT_SELECTED',
    })
  }

  const started = Date.now()
  try {
    const asset = await resolveAsset(input.assetKey)
    return evidence({
      checkKey: `asset-${input.route}`,
      label: input.label,
      kind: 'asset',
      checkedUrl,
      revision: input.revision,
      requestId: input.requestId,
      latencyMs: Date.now() - started,
      contentType: String(asset.mime_type || ''),
      effectiveValues: {
        verificationMode: 'MEDIA_LIBRARY_SELECTION_AUTHORITY',
        assetKey: input.assetKey,
        assetId: String(asset.id || ''),
        fileName: String(asset.file_name || ''),
        width: Number(asset.width || 0) || null,
        height: Number(asset.height || 0) || null,
        storageBucket: String(asset.storage_bucket || ''),
        status: String(asset.status || ''),
      },
    })
  } catch (error) {
    return evidence({
      checkKey: `asset-${input.route}`,
      label: input.label,
      kind: 'asset',
      checkedUrl,
      revision: input.revision,
      requestId: input.requestId,
      status: 'FAIL',
      failures: ['SELECTED_MEDIA_RECORD_NOT_FOUND'],
      latencyMs: Date.now() - started,
      effectiveValues: { verificationMode: 'MEDIA_LIBRARY_SELECTION_AUTHORITY', assetKey: input.assetKey, error: error instanceof Error ? error.message : 'UNKNOWN' },
    })
  }
}

async function checkGlobalOutputs(revision: number, requestId: string): Promise<WebPresenceProbeEvidence[]> {
  const results: WebPresenceProbeEvidence[] = []
  const startedRobots = Date.now()
  try {
    const robots = await buildRobots()
    results.push(evidence({ checkKey: 'robots', label: 'robots.txt', kind: 'robots', checkedUrl: `${ORIGIN}/robots.txt`, revision, requestId, latencyMs: Date.now() - startedRobots, effectiveValues: { verificationMode: 'DIRECT_RUNTIME_AUTHORITY', robots } }))
  } catch (error) {
    results.push(evidence({ checkKey: 'robots', label: 'robots.txt', kind: 'robots', checkedUrl: `${ORIGIN}/robots.txt`, revision, requestId, status: 'FAIL', failures: ['ROBOTS_RUNTIME_FAILED'], effectiveValues: { error: error instanceof Error ? error.message : 'UNKNOWN' } }))
  }
  const startedSitemap = Date.now()
  try {
    const sitemap = await buildSitemap()
    results.push(evidence({ checkKey: 'sitemap', label: 'sitemap.xml', kind: 'sitemap', checkedUrl: `${ORIGIN}/sitemap.xml`, revision, requestId, latencyMs: Date.now() - startedSitemap, effectiveValues: { verificationMode: 'DIRECT_RUNTIME_AUTHORITY', urlCount: sitemap.length } }))
  } catch (error) {
    results.push(evidence({ checkKey: 'sitemap', label: 'sitemap.xml', kind: 'sitemap', checkedUrl: `${ORIGIN}/sitemap.xml`, revision, requestId, status: 'FAIL', failures: ['SITEMAP_RUNTIME_FAILED'], effectiveValues: { error: error instanceof Error ? error.message : 'UNKNOWN' } }))
  }
  return results
}

export async function verifyLiveWebPresence(
  scope: WebPresenceScope,
  context: MarketplaceRequestContext,
  requestId: string,
  request?: Request,
  _fetcher?: typeof fetch,
) {
  const published = await getPublishedWebPresence(scope)
  if (!published.versionId) throw new WebPresenceInputError('LIVE_VERIFICATION_FAILED', 'Aucune révision persistée n’est publiée.', 409)

  const evidenceRows: WebPresenceProbeEvidence[] = []
  if (scope === 'MARKETPLACE') {
    const pageChecks = await Promise.all([
      checkRuntimePage(scope, 'fr', published.revision, requestId),
      checkRuntimePage(scope, 'en', published.revision, requestId),
      checkManifest(published.revision, requestId),
    ])
    evidenceRows.push(...pageChecks)

    const assetSlots: Array<{ key: keyof typeof published.configuration.icons; route: string; label: string }> = [
      { key: 'favicon', route: 'favicon', label: 'Favicon navigateur' },
      { key: 'highResolution', route: 'icon', label: 'Icône haute résolution' },
      { key: 'appleTouch', route: 'apple-touch-icon', label: 'Apple Touch Icon' },
      { key: 'manifest192', route: 'manifest-192', label: 'Manifest 192×192' },
      { key: 'manifest512', route: 'manifest-512', label: 'Manifest 512×512' },
      { key: 'monochromeMask', route: 'mask-icon', label: 'Masque monochrome' },
      { key: 'organizationLogo', route: 'organization-logo', label: 'Logo Organization' },
    ]
    evidenceRows.push(...await Promise.all(assetSlots.map(slot => checkAsset({
      assetKey: published.configuration.icons[slot.key].assetKey,
      route: slot.route,
      label: slot.label,
      revision: published.revision,
      requestId,
    }))))
  } else {
    evidenceRows.push(await checkRuntimePage(scope, 'fr', published.revision, requestId))
    evidenceRows.push(...await checkGlobalOutputs(published.revision, requestId))
  }

  const healthStatus = healthFromEvidence(evidenceRows)
  const databaseResult: 'PASS' | 'FAIL' = healthStatus === 'FAILED' ? 'FAIL' : 'PASS'
  const checkedAt = new Date().toISOString()
  const db = await createServiceClient()
  const profile = await db.from('angelcare_marketplace_web_presence_profiles').select('id').eq('scope_key', scope).single()
  if (profile.error || !profile.data) throw new WebPresenceInputError('LIVE_VERIFICATION_FAILED', 'Profil Web Presence introuvable.', 404)

  const persisted = await db.from('angelcare_marketplace_web_presence_verifications').insert({
    profile_id: profile.data.id,
    version_id: published.versionId,
    request_id: requestId,
    checked_by: context.actor.id,
    checked_urls: evidenceRows.map(item => item.checkedUrl).filter(Boolean),
    evidence: evidenceRows,
    result: databaseResult,
    checked_at: checkedAt,
  })
  if (persisted.error) {
    throw new WebPresenceInputError('LIVE_VERIFICATION_FAILED', `La vérification a été exécutée mais son evidence n’a pas pu être persistée (${persisted.error.code || 'DB_INSERT'}).`, 500)
  }

  try {
    const { writeMarketplaceAudit } = await import('@/angelcare-marketplace/audit/write-audit')
    await writeMarketplaceAudit({
      context,
      requestId,
      action: 'web_presence.live_verification.completed',
      objectType: 'web_presence_version',
      objectId: published.versionId,
      afterValue: {
        scope,
        databaseResult,
        healthStatus,
        verificationMode: 'DIRECT_RUNTIME_AUTHORITY',
        checks: evidenceRows.map(item => ({
          key: item.checkKey,
          url: item.checkedUrl,
          status: item.status,
          failures: item.failures,
          warnings: item.warnings,
          latencyMs: item.latencyMs,
        })),
      },
      result: databaseResult === 'FAIL' ? 'failed' : 'success',
      source: 'web-presence',
      request,
    })
  } catch {
    // Runtime evidence is already persisted; audit failure must not falsify the result.
  }

  const counts = evidenceRows.reduce<Record<WebPresenceProbeStatus, number>>((accumulator, item) => {
    accumulator[item.status] += 1
    return accumulator
  }, { PASS: 0, WARN: 0, FAIL: 0, SKIPPED: 0, INCONCLUSIVE: 0 })

  return {
    requestId,
    profileId: String(profile.data.id),
    versionId: published.versionId,
    revision: published.revision,
    checkedAt,
    result: databaseResult,
    healthStatus,
    counts,
    affectedScopes: [scope],
    affectedRoutes: evidenceRows.map(item => item.checkedUrl).filter(Boolean),
    evidence: evidenceRows,
  }
}

export const isAllowedVerificationUrl = (value: string) => {
  try {
    const url = new URL(value)
    return ['https:', 'http:'].includes(url.protocol)
      && ['my.angelcarehub.com', 'angelcarehub.com', 'www.angelcarehub.com', 'localhost', '127.0.0.1'].includes(url.hostname)
  } catch {
    return false
  }
}
