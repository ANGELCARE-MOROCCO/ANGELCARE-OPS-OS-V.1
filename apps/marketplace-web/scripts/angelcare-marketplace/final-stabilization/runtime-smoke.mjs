import { projectRoot, writeEvidence, markdownTable } from './lib.mjs'

const root = projectRoot()
const startedAt = new Date().toISOString()
const full = process.argv.includes('--full')
const strict = process.argv.includes('--strict')
const baseUrl = (process.env.MARKETPLACE_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const cookie = process.env.MARKETPLACE_COOKIE || ''
const timeoutMs = Number(process.env.MARKETPLACE_RUNTIME_TIMEOUT_MS || 20_000)

const publicRoutes = [
  '/angelcare-marketplace/fr',
  '/angelcare-marketplace/en',
  '/angelcare-marketplace/ar',
  '/angelcare-marketplace/fr/marketplace',
  '/angelcare-marketplace/en/marketplace',
  '/angelcare-marketplace/ar/marketplace',
  '/angelcare-marketplace/fr/marketplace/search',
  '/angelcare-marketplace/fr/marketplace/category/families',
  '/angelcare-marketplace/fr/marketplace/category/academy',
  '/angelcare-marketplace/fr/marketplace/category/kits',
  '/angelcare-marketplace/fr/academy',
  '/angelcare-marketplace/fr/establishments',
  '/angelcare-marketplace/fr/hospitality',
  '/angelcare-marketplace/fr/health-partners',
  '/angelcare-marketplace/fr/corporates',
  '/angelcare-marketplace/fr/partner-os',
  '/angelcare-marketplace/fr/trust',
  '/angelcare-marketplace/fr/basket',
  '/angelcare-marketplace/fr/quote-basket',
  '/angelcare-marketplace/fr/checkout',
]

if (full) {
  publicRoutes.push(
    '/angelcare-marketplace/en/academy',
    '/angelcare-marketplace/ar/academy',
    '/angelcare-marketplace/en/establishments',
    '/angelcare-marketplace/ar/establishments',
    '/angelcare-marketplace/en/hospitality',
    '/angelcare-marketplace/ar/hospitality',
    '/angelcare-marketplace/en/health-partners',
    '/angelcare-marketplace/ar/health-partners',
    '/angelcare-marketplace/en/corporates',
    '/angelcare-marketplace/ar/corporates',
    '/angelcare-marketplace/en/partner-os',
    '/angelcare-marketplace/ar/partner-os',
    '/angelcare-marketplace/en/trust',
    '/angelcare-marketplace/ar/trust',
  )
}

const protectedRoutes = [
  '/angelcare-marketplace/admin',
  '/angelcare-marketplace/admin/catalog',
  '/angelcare-marketplace/admin/conversion',
  '/angelcare-marketplace/admin/journeys',
  '/angelcare-marketplace/admin/operations',
  '/angelcare-marketplace/admin/vendors',
  '/angelcare-marketplace/admin/providers/commerce',
  '/angelcare-marketplace/admin/intelligence',
  '/angelcare-marketplace/admin/growth',
  '/angelcare-marketplace/admin/platform-performance',
  '/angelcare-marketplace/admin/security',
  '/angelcare-marketplace/admin/qa',
  '/angelcare-marketplace/admin/launch',
  '/angelcare-marketplace/fr/account',
]

const apiRoutes = [
  '/api/angelcare-marketplace/foundation/health',
  '/api/angelcare-marketplace/discovery/search?locale=fr&limit=1',
  '/api/angelcare-marketplace/homepage/campaigns?locale=fr',
  '/api/angelcare-marketplace/catalog/summary',
  '/api/angelcare-marketplace/conversion/admin/summary',
  '/api/angelcare-marketplace/journeys/admin/summary',
  '/api/angelcare-marketplace/operations/summary',
  '/api/angelcare-marketplace/intelligence/executive',
  '/api/angelcare-marketplace/security/summary',
  '/api/angelcare-marketplace/qa/summary',
  '/api/angelcare-marketplace/launch/summary',
]

function acceptedStatus(kind, status) {
  if (kind === 'public') return status >= 200 && status < 400
  if (kind === 'protected') return [200, 302, 303, 307, 308, 401, 403].includes(status)
  return status >= 200 && status < 500 && status !== 404
}

async function requestRoute(route, kind) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  const started = performance.now()
  try {
    const response = await fetch(`${baseUrl}${route}`, {
      redirect: 'manual',
      headers: cookie ? { cookie } : {},
      signal: controller.signal,
    })
    const body = await response.text()
    const durationMs = Number((performance.now() - started).toFixed(1))
    const contentType = response.headers.get('content-type') || ''
    const isHtml = contentType.includes('text/html') || body.trimStart().startsWith('<!DOCTYPE') || body.trimStart().startsWith('<html')
    const nextError = /This page could not be found|Application error|Internal Server Error|__next_error__|NEXT_NOT_FOUND/i.test(body)
    const blank = isHtml && body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().length < 40
    const locale = route.match(/^\/angelcare-marketplace\/(fr|en|ar)(?:\/|$)/)?.[1] || null
    const rtlPresent = locale !== 'ar' || /dir=["']rtl["']/i.test(body)
    const passed = acceptedStatus(kind, response.status) && !nextError && !blank && rtlPresent
    return {
      route,
      kind,
      status: response.status,
      passed,
      durationMs,
      contentType,
      location: response.headers.get('location'),
      bodyBytes: Buffer.byteLength(body),
      nextError,
      blank,
      rtlPresent,
      error: null,
      bodyPreview: passed ? null : body.replace(/\s+/g, ' ').slice(0, 500),
    }
  } catch (error) {
    return {
      route,
      kind,
      status: null,
      passed: false,
      durationMs: Number((performance.now() - started).toFixed(1)),
      contentType: null,
      location: null,
      bodyBytes: 0,
      nextError: false,
      blank: false,
      rtlPresent: null,
      error: error instanceof Error ? error.message : String(error),
      bodyPreview: null,
    }
  } finally {
    clearTimeout(timeout)
  }
}

console.log('ANGELCARE Marketplace — Runtime Smoke Authority')
console.log(`Base URL: ${baseUrl}`)
console.log(`Mode: ${full ? 'full' : 'critical'}`)
console.log(`Authenticated cookie: ${cookie ? 'provided' : 'not provided'}`)

const results = []
for (const [kind, routes] of [
  ['public', publicRoutes],
  ['protected', protectedRoutes],
  ['api', apiRoutes],
]) {
  for (const route of routes) {
    const result = await requestRoute(route, kind)
    results.push(result)
    console.log(`${result.passed ? 'PASS' : 'FAIL'} ${String(result.status ?? 'ERR').padEnd(3)} ${result.durationMs.toFixed(0).padStart(6)}ms ${route}${result.error ? ` — ${result.error}` : ''}`)
  }
}

// Derive one real item route from the published discovery authority when available.
let derivedItem = null
try {
  const response = await fetch(`${baseUrl}/api/angelcare-marketplace/discovery/search?locale=fr&limit=1`, { headers: cookie ? { cookie } : {} })
  const payload = await response.json()
  const candidates = payload?.data?.items || payload?.data || payload?.items || []
  const item = Array.isArray(candidates) ? candidates[0] : null
  const slug = item?.slug || item?.item_slug || null
  if (slug) {
    derivedItem = await requestRoute(`/angelcare-marketplace/fr/marketplace/${encodeURIComponent(slug)}`, 'public')
    results.push(derivedItem)
    console.log(`${derivedItem.passed ? 'PASS' : 'FAIL'} ${String(derivedItem.status ?? 'ERR').padEnd(3)} ${derivedItem.durationMs.toFixed(0).padStart(6)}ms ${derivedItem.route} — derived published item`)
  }
} catch {
  // The regular API result already records any discovery failure.
}

const failures = results.filter((entry) => !entry.passed)
const serverErrors = results.filter((entry) => entry.status != null && entry.status >= 500)
const missingRoutes = results.filter((entry) => entry.status === 404)
const status = failures.length === 0 ? 'PASS' : strict || serverErrors.length || missingRoutes.length ? 'FAIL' : 'CONDITIONAL'
const completedAt = new Date().toISOString()
const evidence = {
  programme: 'ANGELCARE Marketplace Runtime Smoke Authority',
  root,
  baseUrl,
  startedAt,
  completedAt,
  status,
  full,
  strict,
  authenticated: Boolean(cookie),
  summary: {
    total: results.length,
    passed: results.filter((entry) => entry.passed).length,
    failed: failures.length,
    serverErrors: serverErrors.length,
    missingRoutes: missingRoutes.length,
    derivedItemTested: Boolean(derivedItem),
  },
  results,
}
const markdown = `# ANGELCARE Marketplace Runtime Smoke Authority

**Status:** ${status}
**Base URL:** ${baseUrl}
**Authenticated session supplied:** ${cookie ? 'Yes' : 'No'}
**Mode:** ${full ? 'Full' : 'Critical'}

${markdownTable(['Route', 'Kind', 'HTTP', 'Result', 'Duration', 'Evidence'], results.map((entry) => [
  entry.route,
  entry.kind,
  entry.status ?? 'ERR',
  entry.passed ? 'PASS' : 'FAIL',
  `${entry.durationMs} ms`,
  entry.error || entry.location || (entry.nextError ? 'Next.js error marker' : entry.blank ? 'Blank HTML' : entry.rtlPresent === false ? 'Arabic RTL missing' : ''),
]))}

## Boundary

This read-only smoke gate does not create orders, bookings, enrollments, quotations, refunds, settlements, or production data. Authenticated domain workflows require a controlled test account and test records.
`
const paths = writeEvidence('RUNTIME_SMOKE', evidence, markdown)
console.log(`\nRESULT: ${status}`)
console.log(`Evidence: ${paths.latestMarkdown}`)
process.exitCode = status === 'FAIL' ? 1 : 0
