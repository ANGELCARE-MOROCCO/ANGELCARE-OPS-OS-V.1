import fs from 'node:fs'
import path from 'node:path'
import { projectRoot, evidenceDirectory, timestamp, writeEvidence, markdownTable, humanBytes } from './lib.mjs'

const root = projectRoot()
const baseUrl = (process.env.MARKETPLACE_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const storageState = process.env.MARKETPLACE_STORAGE_STATE || null
const full = process.argv.includes('--full')
const startedAt = new Date().toISOString()
const outputRoot = path.join(evidenceDirectory(), `visual_${timestamp()}`)
fs.mkdirSync(outputRoot, { recursive: true })

let playwright
try {
  playwright = await import('playwright')
} catch (error) {
  console.error('FAIL: Project-local Playwright is unavailable. Run from apps/ops-web after dependencies are installed.')
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}

const viewports = [
  { key: 'desktop', width: 1440, height: 1000 },
  { key: 'tablet', width: 1024, height: 1366 },
  { key: 'mobile', width: 390, height: 844 },
]

const publicRoutes = [
  { key: 'homepage-fr', path: '/angelcare-marketplace/fr' },
  { key: 'homepage-en', path: '/angelcare-marketplace/en' },
  { key: 'homepage-ar', path: '/angelcare-marketplace/ar' },
  { key: 'marketplace-index', path: '/angelcare-marketplace/fr/marketplace' },
  { key: 'marketplace-search', path: '/angelcare-marketplace/fr/marketplace/search' },
  { key: 'category-families', path: '/angelcare-marketplace/fr/marketplace/category/families' },
  { key: 'category-academy', path: '/angelcare-marketplace/fr/marketplace/category/academy' },
  { key: 'category-partner-os', path: '/angelcare-marketplace/fr/marketplace/category/partner-os' },
  { key: 'academy', path: '/angelcare-marketplace/fr/academy' },
  { key: 'establishments', path: '/angelcare-marketplace/fr/establishments' },
  { key: 'hospitality', path: '/angelcare-marketplace/fr/hospitality' },
  { key: 'health-partners', path: '/angelcare-marketplace/fr/health-partners' },
  { key: 'corporates', path: '/angelcare-marketplace/fr/corporates' },
  { key: 'partner-os', path: '/angelcare-marketplace/fr/partner-os' },
  { key: 'trust', path: '/angelcare-marketplace/fr/trust' },
  { key: 'basket', path: '/angelcare-marketplace/fr/basket' },
  { key: 'quote-basket', path: '/angelcare-marketplace/fr/quote-basket' },
  { key: 'checkout', path: '/angelcare-marketplace/fr/checkout' },
]

if (full) {
  publicRoutes.push(
    { key: 'marketplace-en', path: '/angelcare-marketplace/en/marketplace' },
    { key: 'marketplace-ar', path: '/angelcare-marketplace/ar/marketplace' },
    { key: 'academy-ar', path: '/angelcare-marketplace/ar/academy' },
    { key: 'establishments-ar', path: '/angelcare-marketplace/ar/establishments' },
    { key: 'hospitality-ar', path: '/angelcare-marketplace/ar/hospitality' },
    { key: 'health-ar', path: '/angelcare-marketplace/ar/health-partners' },
    { key: 'corporates-ar', path: '/angelcare-marketplace/ar/corporates' },
    { key: 'partner-os-ar', path: '/angelcare-marketplace/ar/partner-os' },
    { key: 'trust-ar', path: '/angelcare-marketplace/ar/trust' },
  )
}

const protectedRoutes = [
  { key: 'account-command', path: '/angelcare-marketplace/fr/account' },
  { key: 'account-actions', path: '/angelcare-marketplace/fr/account/action-center' },
  { key: 'journey-command', path: '/angelcare-marketplace/admin/journeys' },
  { key: 'operations-command', path: '/angelcare-marketplace/admin/operations' },
  { key: 'vendor-command', path: '/angelcare-marketplace/admin/vendors' },
  { key: 'provider-commerce', path: '/angelcare-marketplace/admin/providers/commerce' },
  { key: 'executive-intelligence', path: '/angelcare-marketplace/admin/intelligence' },
  { key: 'growth-command', path: '/angelcare-marketplace/admin/growth' },
  { key: 'performance-command', path: '/angelcare-marketplace/admin/platform-performance' },
  { key: 'security-command', path: '/angelcare-marketplace/admin/security' },
  { key: 'qa-command', path: '/angelcare-marketplace/admin/qa' },
  { key: 'launch-authority', path: '/angelcare-marketplace/admin/launch' },
]

const browserType = playwright.chromium
const launchOptions = { headless: true }
if (process.env.MARKETPLACE_BROWSER_CHANNEL) launchOptions.channel = process.env.MARKETPLACE_BROWSER_CHANNEL
const browser = await browserType.launch(launchOptions)
const results = []

function safeName(value) {
  return value.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '')
}

async function auditRoute(route, viewport, protectedRoute) {
  const contextOptions = {
    viewport: { width: viewport.width, height: viewport.height },
    locale: route.path.includes('/ar/') || route.path.endsWith('/ar') ? 'ar-MA' : route.path.includes('/en/') || route.path.endsWith('/en') ? 'en-US' : 'fr-MA',
    reducedMotion: 'reduce',
  }
  if (protectedRoute && storageState) contextOptions.storageState = storageState
  const context = await browser.newContext(contextOptions)
  const page = await context.newPage()
  const consoleErrors = []
  const pageErrors = []
  const failedRequests = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('response', (response) => {
    if (response.status() >= 500) failedRequests.push({ url: response.url(), status: response.status() })
  })
  const started = performance.now()
  let response = null
  let navigationError = null
  try {
    response = await page.goto(`${baseUrl}${route.path}`, { waitUntil: 'networkidle', timeout: 45_000 })
  } catch (error) {
    navigationError = error instanceof Error ? error.message : String(error)
  }
  const durationMs = Number((performance.now() - started).toFixed(1))
  const redirectedPath = new URL(page.url()).pathname
  const screenshotFile = path.join(outputRoot, `${safeName(route.key)}__${viewport.key}.png`)
  let dom = null
  if (!navigationError) {
    dom = await page.evaluate(() => {
      const bodyText = document.body?.innerText?.replace(/\s+/g, ' ').trim() || ''
      const documentWidth = Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0)
      const viewportWidth = document.documentElement.clientWidth
      const images = [...document.images]
      const brokenImages = images.filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.currentSrc || image.src)
      const imagesMissingAlt = images.filter((image) => !image.hasAttribute('alt')).map((image) => image.currentSrc || image.src)
      const unnamedButtons = [...document.querySelectorAll('button')].filter((element) => !(element.innerText || element.getAttribute('aria-label') || element.getAttribute('title'))?.trim()).length
      const unnamedLinks = [...document.querySelectorAll('a[href]')].filter((element) => !(element.innerText || element.getAttribute('aria-label') || element.getAttribute('title'))?.trim()).length
      const unlabeledInputs = [...document.querySelectorAll('input:not([type="hidden"]),select,textarea')].filter((element) => {
        if (element.getAttribute('aria-label') || element.getAttribute('aria-labelledby') || element.getAttribute('title')) return false
        if (element.id && document.querySelector(`label[for="${CSS.escape(element.id)}"]`)) return false
        if (element.closest('label')) return false
        return true
      }).length
      const ids = [...document.querySelectorAll('[id]')].map((element) => element.id).filter(Boolean)
      const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))]
      const navigation = performance.getEntriesByType('navigation')[0]
      const resources = performance.getEntriesByType('resource')
      return {
        title: document.title,
        lang: document.documentElement.lang,
        dir: document.documentElement.dir || getComputedStyle(document.documentElement).direction,
        h1Count: document.querySelectorAll('h1').length,
        bodyTextLength: bodyText.length,
        bodyPreview: bodyText.slice(0, 240),
        horizontalOverflow: Math.max(0, documentWidth - viewportWidth),
        documentWidth,
        viewportWidth,
        domNodes: document.getElementsByTagName('*').length,
        imageCount: images.length,
        brokenImages,
        imagesMissingAlt,
        unnamedButtons,
        unnamedLinks,
        unlabeledInputs,
        duplicateIds,
        resourceCount: resources.length,
        transferBytes: resources.reduce((sum, entry) => sum + (entry.transferSize || 0), 0),
        decodedBodyBytes: resources.reduce((sum, entry) => sum + (entry.decodedBodySize || 0), 0),
        navigationDuration: navigation?.duration || null,
        domContentLoaded: navigation?.domContentLoadedEventEnd || null,
        loadEvent: navigation?.loadEventEnd || null,
        nextError: /This page could not be found|Application error|Internal Server Error/i.test(bodyText),
      }
    })
    await page.screenshot({ path: screenshotFile, fullPage: true, animations: 'disabled' })
  }
  const statusCode = response?.status() ?? null
  const authBoundary = protectedRoute && !storageState && [302, 303, 307, 308, 401, 403].includes(statusCode)
  const rtlExpected = /\/ar(?:\/|$)/.test(route.path)
  const criticalIssues = []
  if (navigationError) criticalIssues.push(`Navigation failed: ${navigationError}`)
  if (statusCode === 404) criticalIssues.push('Route returned 404')
  if (statusCode != null && statusCode >= 500) criticalIssues.push(`Route returned ${statusCode}`)
  if (dom?.nextError) criticalIssues.push('Next.js error marker rendered')
  if (dom && dom.bodyTextLength < 40 && !authBoundary) criticalIssues.push('Page appears blank')
  if (dom && dom.horizontalOverflow > 4) criticalIssues.push(`Horizontal overflow ${dom.horizontalOverflow}px`)
  if (dom?.brokenImages.length) criticalIssues.push(`${dom.brokenImages.length} broken images`)
  if (rtlExpected && dom && dom.dir !== 'rtl') criticalIssues.push('Arabic document is not RTL')
  if (pageErrors.length) criticalIssues.push(`${pageErrors.length} page errors`)
  if (failedRequests.length) criticalIssues.push(`${failedRequests.length} server request failures`)
  const accessibilityWarnings = []
  if (dom?.imagesMissingAlt.length) accessibilityWarnings.push(`${dom.imagesMissingAlt.length} images missing alt attribute`)
  if (dom?.unnamedButtons) accessibilityWarnings.push(`${dom.unnamedButtons} unnamed buttons`)
  if (dom?.unnamedLinks) accessibilityWarnings.push(`${dom.unnamedLinks} unnamed links`)
  if (dom?.unlabeledInputs) accessibilityWarnings.push(`${dom.unlabeledInputs} unlabeled controls`)
  if (dom?.duplicateIds.length) accessibilityWarnings.push(`${dom.duplicateIds.length} duplicate IDs`)
  if (dom && dom.h1Count === 0 && !authBoundary) accessibilityWarnings.push('No H1 heading')
  const result = {
    route: route.path,
    key: route.key,
    viewport: viewport.key,
    width: viewport.width,
    height: viewport.height,
    protected: protectedRoute,
    authenticated: protectedRoute ? Boolean(storageState) : null,
    statusCode,
    redirectedPath,
    durationMs,
    screenshot: navigationError ? null : screenshotFile,
    passed: criticalIssues.length === 0,
    authBoundary,
    criticalIssues,
    accessibilityWarnings,
    consoleErrors,
    pageErrors,
    failedRequests,
    dom,
  }
  await context.close()
  return result
}

console.log('ANGELCARE Marketplace — Visual, Responsive & Accessibility Evidence')
console.log(`Base URL: ${baseUrl}`)
console.log(`Output: ${outputRoot}`)
console.log(`Authenticated storage state: ${storageState || 'not supplied'}`)

for (const route of publicRoutes) {
  for (const viewport of viewports) {
    const result = await auditRoute(route, viewport, false)
    results.push(result)
    console.log(`${result.passed ? 'PASS' : 'FAIL'} ${viewport.key.padEnd(7)} ${route.path}${result.criticalIssues.length ? ` — ${result.criticalIssues.join('; ')}` : ''}`)
  }
}

if (storageState) {
  for (const route of protectedRoutes) {
    for (const viewport of viewports) {
      const result = await auditRoute(route, viewport, true)
      results.push(result)
      console.log(`${result.passed ? 'PASS' : 'FAIL'} ${viewport.key.padEnd(7)} ${route.path}${result.criticalIssues.length ? ` — ${result.criticalIssues.join('; ')}` : ''}`)
    }
  }
} else {
  console.log('NOTICE: Protected visual routes were not captured because MARKETPLACE_STORAGE_STATE was not supplied.')
}

await browser.close()

const failures = results.filter((entry) => !entry.passed)
const warnings = results.flatMap((entry) => entry.accessibilityWarnings.map((warning) => ({ route: entry.route, viewport: entry.viewport, warning })))
const status = failures.length === 0 ? storageState ? 'PASS' : 'CONDITIONAL' : 'FAIL'
const completedAt = new Date().toISOString()
const evidence = {
  programme: 'ANGELCARE Marketplace Visual Acceptance',
  baseUrl,
  startedAt,
  completedAt,
  status,
  full,
  storageStateSupplied: Boolean(storageState),
  screenshotDirectory: outputRoot,
  summary: {
    captures: results.length,
    passed: results.filter((entry) => entry.passed).length,
    failed: failures.length,
    accessibilityWarnings: warnings.length,
    protectedRoutesCaptured: storageState ? protectedRoutes.length : 0,
  },
  results,
}
const markdown = `# ANGELCARE Marketplace Visual Acceptance

**Status:** ${status}
**Base URL:** ${baseUrl}
**Authenticated visual session:** ${storageState ? 'Yes' : 'No'}
**Screenshot directory:** ${outputRoot}

${markdownTable(['Route', 'Viewport', 'HTTP', 'Result', 'Overflow', 'Broken media', 'Accessibility warnings', 'Transfer'], results.map((entry) => [
  entry.route,
  entry.viewport,
  entry.statusCode ?? 'ERR',
  entry.passed ? 'PASS' : 'FAIL',
  entry.dom ? `${entry.dom.horizontalOverflow}px` : '—',
  entry.dom ? entry.dom.brokenImages.length : '—',
  entry.accessibilityWarnings.length,
  entry.dom ? humanBytes(entry.dom.transferBytes) : '—',
]))}

## Evidence boundary

Screenshots and DOM checks prove rendered route behavior for the supplied environment and session. Protected workspaces remain unaccepted when no authenticated storage state is provided. Automated checks do not replace expert review of visual quality, business language, color contrast, screen-reader output, or real customer workflows.
`
const paths = writeEvidence('VISUAL_ACCEPTANCE', evidence, markdown)
console.log(`\nRESULT: ${status}`)
console.log(`Evidence: ${paths.latestMarkdown}`)
process.exitCode = failures.length ? 1 : 0
