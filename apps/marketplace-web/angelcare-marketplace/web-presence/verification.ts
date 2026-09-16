import 'server-only'
import { createServiceClient } from '@/lib/supabase/server'
import type { MarketplaceRequestContext } from '@/angelcare-marketplace/domain/types'
import { getPublishedWebPresence } from './repository'
import { WebPresenceInputError } from './schema'
import type {
  WebPresenceHealthStatus,
  WebPresenceProbeEvidence,
  WebPresenceProbeStatus,
  WebPresenceScope,
} from './types'

const ALLOWED_HOSTS = new Set(['my.angelcarehub.com', 'angelcarehub.com', 'www.angelcarehub.com', 'localhost', '127.0.0.1'])
const MAX_BODY = 2_000_000
const PROBE_TIMEOUT_MS = 12_000
const PROBE_ATTEMPTS = 2

type ProbeKind = WebPresenceProbeEvidence['kind']
type ProbeTarget = {
  checkKey: string
  label: string
  url: string
  kind: ProbeKind
}

function allowed(url: URL) {
  return ALLOWED_HOSTS.has(url.hostname)
    && ['https:', 'http:'].includes(url.protocol)
    && (url.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(url.hostname))
}

function healthFromEvidence(evidence: WebPresenceProbeEvidence[]): WebPresenceHealthStatus {
  if (!evidence.length) return 'NOT_VERIFIED'
  if (evidence.some(item => item.status === 'FAIL')) return 'FAILED'
  if (evidence.some(item => item.status === 'INCONCLUSIVE')) return 'DEGRADED'
  if (evidence.some(item => item.status === 'WARN')) return 'WARNING'
  return 'HEALTHY'
}

function skippedEvidence(input: {
  checkKey: string
  label: string
  revision: number
  requestId: string
  reason: string
}): WebPresenceProbeEvidence {
  return {
    checkKey: input.checkKey,
    label: input.label,
    kind: 'asset',
    checkedUrl: '',
    httpStatus: 0,
    contentType: '',
    effectiveValues: { reason: input.reason },
    checkedAt: new Date().toISOString(),
    publishedRevision: input.revision,
    requestId: input.requestId,
    status: 'SKIPPED',
    result: 'PASS',
    failures: [],
    warnings: [],
    attempts: 0,
    latencyMs: 0,
  }
}

function probeStatus(failures: string[], warnings: string[]): WebPresenceProbeStatus {
  if (failures.length) return 'FAIL'
  if (warnings.length) return 'WARN'
  return 'PASS'
}

async function probe(
  target: ProbeTarget,
  revision: number,
  requestId: string,
  fetcher: typeof fetch,
): Promise<WebPresenceProbeEvidence> {
  const parsed = new URL(target.url)
  if (!allowed(parsed)) {
    throw new WebPresenceInputError('LIVE_VERIFICATION_FAILED', 'La cible de vérification n’est pas autorisée.', 400)
  }

  let totalLatency = 0
  let lastNetworkCode = 'REQUEST_FAILED'
  let lastNetworkError = 'FETCH_ERROR'

  for (let attempt = 1; attempt <= PROBE_ATTEMPTS; attempt += 1) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS)
    const startedAt = Date.now()
    try {
      const response = await fetcher(parsed, {
        redirect: 'follow',
        signal: controller.signal,
        cache: 'no-store',
        headers: { accept: target.kind === 'html' ? 'text/html' : '*/*' },
      })
      totalLatency += Date.now() - startedAt
      const contentType = response.headers.get('content-type') || ''
      const failures: string[] = []
      const warnings: string[] = []
      const values: Record<string, unknown> = {
        cacheControl: response.headers.get('cache-control'),
        attempts: attempt,
        latencyMs: totalLatency,
      }

      if (response.url) {
        try {
          const finalUrl = new URL(response.url)
          values.finalUrl = finalUrl.toString()
          if (!allowed(finalUrl)) failures.push('REDIRECT_OUTSIDE_ALLOWED_HOSTS')
        } catch {
          warnings.push('FINAL_URL_UNREADABLE')
        }
      }

      if (!response.ok) failures.push(`HTTP_${response.status}`)

      if (target.kind === 'asset') {
        const bytes = await response.arrayBuffer()
        values.byteLength = bytes.byteLength
        if (bytes.byteLength === 0) failures.push('EMPTY_BODY')
        if (!contentType.startsWith('image/')) failures.push('INVALID_CONTENT_TYPE')
        if (!response.headers.get('cache-control')) warnings.push('CACHE_HEADER_MISSING')
      } else {
        const body = await response.text()
        if (body.length === 0) failures.push('EMPTY_BODY')
        if (body.length > MAX_BODY) warnings.push('BODY_LARGE')

        if (target.kind === 'html') {
          const count = (pattern: RegExp) => (body.match(pattern) || []).length
          values.title = body.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || null
          values.description = body.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i)?.[1] || null
          values.canonical = body.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)/i)?.[1] || null
          values.favicon = count(/<link[^>]+rel=["'][^"']*icon/gi)
          values.openGraph = count(/<meta[^>]+property=["']og:/gi)
          values.twitter = count(/<meta[^>]+name=["']twitter:/gi)
          values.structuredData = count(/application\/ld\+json/gi)
          if (count(/<title[^>]*>/gi) !== 1) warnings.push('TITLE_COUNT')
          if (!values.description) warnings.push('DESCRIPTION_MISSING')
          if (!values.canonical) warnings.push('CANONICAL_MISSING')
          if (!values.favicon) warnings.push('FAVICON_MISSING')
          if (!values.openGraph) warnings.push('OPEN_GRAPH_MISSING')
          if (!values.twitter) warnings.push('TWITTER_MISSING')
          if (!values.structuredData) warnings.push('STRUCTURED_DATA_MISSING')
        } else if (target.kind === 'sitemap') {
          if (!contentType.includes('xml') || !body.includes('<urlset')) failures.push('INVALID_SITEMAP')
          if (body.includes('/admin/') || body.includes('/api/') || body.includes('/account/')) failures.push('PRIVATE_ROUTE_EXPOSED')
          const locations = [...body.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1])
          for (const location of locations) {
            try {
              if (new URL(location).hostname !== 'my.angelcarehub.com') failures.push('INVALID_CANONICAL_HOST')
            } catch {
              failures.push('INVALID_SITEMAP_URL')
            }
          }
          values.urlCount = locations.length
        } else if (target.kind === 'manifest') {
          try {
            const manifest = JSON.parse(body) as Record<string, unknown>
            values.name = manifest.name
            values.startUrl = manifest.start_url
            values.scope = manifest.scope
            values.iconCount = Array.isArray(manifest.icons) ? manifest.icons.length : 0
            if (!manifest.name || !manifest.start_url || !manifest.scope) failures.push('INVALID_MANIFEST')
            if (!Array.isArray(manifest.icons) || manifest.icons.length === 0) warnings.push('MANIFEST_ICONS_EMPTY')
          } catch {
            failures.push('INVALID_MANIFEST')
          }
        } else if (target.kind === 'robots') {
          values.indexingRule = body.includes('Disallow: /') ? 'noindex' : 'index'
          if (!body.includes('/api/') || !body.includes('/angelcare-marketplace/admin/')) warnings.push('PROTECTED_EXCLUSIONS_MISSING')
        }
      }

      const status = probeStatus(failures, warnings)
      return {
        checkKey: target.checkKey,
        label: target.label,
        kind: target.kind,
        checkedUrl: target.url,
        httpStatus: response.status,
        contentType,
        effectiveValues: values,
        checkedAt: new Date().toISOString(),
        publishedRevision: revision,
        requestId,
        status,
        result: status === 'FAIL' ? 'FAIL' : 'PASS',
        failures,
        warnings,
        attempts: attempt,
        latencyMs: totalLatency,
      }
    } catch (error) {
      totalLatency += Date.now() - startedAt
      lastNetworkError = error instanceof Error ? error.name : 'FETCH_ERROR'
      lastNetworkCode = lastNetworkError === 'AbortError' ? 'TIMEOUT' : 'REQUEST_FAILED'
      if (attempt < PROBE_ATTEMPTS) continue
    } finally {
      clearTimeout(timer)
    }
  }

  return {
    checkKey: target.checkKey,
    label: target.label,
    kind: target.kind,
    checkedUrl: target.url,
    httpStatus: 0,
    contentType: '',
    effectiveValues: { error: lastNetworkError, attempts: PROBE_ATTEMPTS, latencyMs: totalLatency, timeoutMs: PROBE_TIMEOUT_MS },
    checkedAt: new Date().toISOString(),
    publishedRevision: revision,
    requestId,
    status: 'INCONCLUSIVE',
    result: 'PASS',
    failures: [],
    warnings: [lastNetworkCode],
    attempts: PROBE_ATTEMPTS,
    latencyMs: totalLatency,
  }
}

export async function verifyLiveWebPresence(
  scope: WebPresenceScope,
  context: MarketplaceRequestContext,
  requestId: string,
  request?: Request,
  fetcher: typeof fetch = fetch,
) {
  const published = await getPublishedWebPresence(scope)
  if (!published.versionId) throw new WebPresenceInputError('LIVE_VERIFICATION_FAILED', 'Aucune révision persistée n’est publiée.', 409)

  const origin = published.configuration.identity.canonicalOrigin
  const targets: ProbeTarget[] = scope === 'GLOBAL_DOMAIN'
    ? [
        { checkKey: 'public-root', label: 'Domaine public', url: `${origin}/`, kind: 'html' },
        { checkKey: 'robots', label: 'robots.txt', url: `${origin}/robots.txt`, kind: 'robots' },
        { checkKey: 'sitemap', label: 'sitemap.xml', url: `${origin}/sitemap.xml`, kind: 'sitemap' },
      ]
    : [
        { checkKey: 'marketplace-fr', label: 'Marketplace FR', url: `${origin}/angelcare-marketplace/fr`, kind: 'html' },
        { checkKey: 'marketplace-en', label: 'Marketplace EN', url: `${origin}/angelcare-marketplace/en`, kind: 'html' },
        { checkKey: 'manifest', label: 'Manifest Web App', url: `${origin}/manifest.webmanifest`, kind: 'manifest' },
      ]

  const skipped: WebPresenceProbeEvidence[] = []
  if (scope === 'MARKETPLACE') {
    const assetSlots: Array<{ key: keyof typeof published.configuration.icons; route: string; label: string }> = [
      { key: 'favicon', route: 'favicon', label: 'Favicon navigateur' },
      { key: 'highResolution', route: 'icon', label: 'Icône haute résolution' },
      { key: 'appleTouch', route: 'apple-touch-icon', label: 'Apple Touch Icon' },
      { key: 'manifest192', route: 'manifest-192', label: 'Manifest 192×192' },
      { key: 'manifest512', route: 'manifest-512', label: 'Manifest 512×512' },
      { key: 'monochromeMask', route: 'mask-icon', label: 'Masque monochrome' },
      { key: 'organizationLogo', route: 'organization-logo', label: 'Logo Organization' },
    ]
    for (const slot of assetSlots) {
      const assetKey = published.configuration.icons[slot.key].assetKey
      if (!assetKey) {
        skipped.push(skippedEvidence({
          checkKey: `asset-${slot.route}`,
          label: slot.label,
          revision: published.revision,
          requestId,
          reason: 'OPTIONAL_ASSET_NOT_CONFIGURED',
        }))
        continue
      }
      targets.push({
        checkKey: `asset-${slot.route}`,
        label: slot.label,
        url: `${origin}/api/angelcare-marketplace/public/web-presence/assets/${slot.route}?scope=${scope}&revision=${published.revision}`,
        kind: 'asset',
      })
    }
  }

  const probed = await Promise.all(targets.map(target => probe(target, published.revision, requestId, fetcher)))
  const evidence = [...probed, ...skipped]
  const healthStatus = healthFromEvidence(evidence)
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
    checked_urls: targets.map(target => target.url),
    evidence,
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
        checks: evidence.map(item => ({
          key: item.checkKey,
          url: item.checkedUrl,
          status: item.status,
          failures: item.failures,
          warnings: item.warnings,
          httpStatus: item.httpStatus,
          latencyMs: item.latencyMs,
        })),
      },
      result: databaseResult === 'FAIL' ? 'failed' : 'success',
      source: 'web-presence',
      request,
    })
  } catch {
    // Verification evidence is already persisted; audit failure must not falsify the probe result.
  }

  const counts = evidence.reduce<Record<WebPresenceProbeStatus, number>>((accumulator, item) => {
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
    affectedRoutes: targets.map(target => target.url),
    evidence,
  }
}

export const isAllowedVerificationUrl = (value: string) => {
  try { return allowed(new URL(value)) } catch { return false }
}
