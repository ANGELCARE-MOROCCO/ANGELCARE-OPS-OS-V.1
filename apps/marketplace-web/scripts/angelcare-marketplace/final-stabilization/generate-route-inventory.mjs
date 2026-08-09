import fs from 'node:fs'
import path from 'node:path'
import { projectRoot, walk, nextRouteFromFile, routeRegex, writeEvidence, markdownTable } from './lib.mjs'

const root = projectRoot()
const startedAt = new Date().toISOString()
const files = [
  ...walk('app/angelcare-marketplace').filter((file) => /\/(?:page\.(?:ts|tsx)|route\.(?:ts|js))$/.test(file)),
  ...walk('app/api/angelcare-marketplace').filter((file) => /\/route\.(?:ts|js)$/.test(file)),
]

function audience(file, route, kind) {
  if (kind === 'api') return 'api'
  if (file.includes('/(protected)/admin/')) return 'admin'
  if (file.includes('/(family)/') || route.includes('/family/')) return 'family'
  if (file.includes('/(tenant)/') || route.includes('/partner/')) return 'tenant'
  if (file.includes('/(provider)/') || route.includes('/provider')) return 'provider'
  if (file.includes('/(trainer)/') || route.includes('/trainer')) return 'trainer'
  if (route.includes('/account')) return 'customer-account'
  if (route.includes('/[locale]')) return 'public-localized'
  return 'platform'
}

function domain(route) {
  const normalized = route.replace('/angelcare-marketplace/', '').replace('/api/angelcare-marketplace/', '')
  const parts = normalized.split('/').filter(Boolean).filter((part) => !/^\[.*\]$/.test(part))
  const ignored = new Set(['admin', 'fr', 'en', 'ar', 'api'])
  return parts.find((part) => !ignored.has(part)) || 'root'
}

const rows = files.map((file) => {
  const parsed = nextRouteFromFile(file)
  if (!parsed) return null
  return {
    file,
    route: parsed.route,
    kind: parsed.kind,
    audience: audience(file, parsed.route, parsed.kind),
    domain: domain(parsed.route),
    dynamic: /\[/.test(parsed.route),
  }
}).filter(Boolean).sort((a, b) => a.route.localeCompare(b.route) || a.file.localeCompare(b.file))

const duplicates = []
const routeOwners = new Map()
for (const row of rows) {
  const key = `${row.kind}:${row.route}`
  if (!routeOwners.has(key)) routeOwners.set(key, [])
  routeOwners.get(key).push(row.file)
}
for (const [key, owners] of routeOwners) {
  if (owners.length > 1) duplicates.push({ key, owners })
}

const routePatterns = rows.map((row) => ({ ...row, pattern: routeRegex(row.route) }))
const sourceFiles = [
  ...walk('angelcare-marketplace').filter((file) => /\.(?:ts|tsx)$/.test(file)),
  ...walk('app/angelcare-marketplace').filter((file) => /\.(?:ts|tsx)$/.test(file)),
]
const links = new Map()
const hrefPatterns = [
  /href\s*=\s*["'`]([^"'`$]+)["'`]/g,
  /href\s*:\s*["'`]([^"'`$]+)["'`]/g,
]
for (const file of sourceFiles) {
  const source = fs.readFileSync(path.join(root, file), 'utf8')
  for (const pattern of hrefPatterns) {
    for (const match of source.matchAll(pattern)) {
      const href = match[1]
      if (!href.startsWith('/angelcare-marketplace')) continue
      if (!links.has(href)) links.set(href, new Set())
      links.get(href).add(file)
    }
  }
}
const unresolvedLinks = []
for (const [href, owners] of links) {
  const pathname = href.split(/[?#]/, 1)[0].replace(/\/$/, '') || '/'
  if (!routePatterns.some((entry) => entry.pattern.test(pathname))) {
    unresolvedLinks.push({ href, owners: [...owners] })
  }
}

const csv = [
  ['route', 'kind', 'audience', 'domain', 'dynamic', 'file'],
  ...rows.map((row) => [row.route, row.kind, row.audience, row.domain, row.dynamic ? 'yes' : 'no', row.file]),
].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n') + '\n'

const evidence = {
  programme: 'ANGELCARE Marketplace Route & Navigation Authority',
  startedAt,
  completedAt: new Date().toISOString(),
  status: duplicates.length || unresolvedLinks.length ? 'FAIL' : 'PASS',
  summary: {
    totalRoutes: rows.length,
    pages: rows.filter((row) => row.kind === 'page').length,
    apis: rows.filter((row) => row.kind === 'api').length,
    literalLinks: links.size,
    duplicateRoutes: duplicates.length,
    unresolvedLinks: unresolvedLinks.length,
  },
  byAudience: Object.fromEntries([...new Set(rows.map((row) => row.audience))].sort().map((key) => [key, rows.filter((row) => row.audience === key).length])),
  byDomain: Object.fromEntries([...new Set(rows.map((row) => row.domain))].sort().map((key) => [key, rows.filter((row) => row.domain === key).length])),
  duplicates,
  unresolvedLinks,
  rows,
}

const markdown = `# ANGELCARE Marketplace Route & Navigation Authority

**Status:** ${evidence.status}
**Routes:** ${evidence.summary.totalRoutes}
**Pages:** ${evidence.summary.pages}
**APIs:** ${evidence.summary.apis}
**Literal Marketplace links:** ${evidence.summary.literalLinks}

## Audience distribution

${markdownTable(['Audience', 'Routes'], Object.entries(evidence.byAudience).map(([key, value]) => [key, value]))}

## Domain distribution

${markdownTable(['Domain', 'Routes'], Object.entries(evidence.byDomain).map(([key, value]) => [key, value]))}

## Integrity

${markdownTable(['Gate', 'Result'], [
  ['Duplicate Next.js routes', duplicates.length ? `FAIL · ${duplicates.length}` : 'PASS'],
  ['Unresolved literal Marketplace links', unresolvedLinks.length ? `FAIL · ${unresolvedLinks.length}` : 'PASS'],
])}

## Route register

${markdownTable(['Route', 'Type', 'Audience', 'Domain', 'Source'], rows.map((row) => [row.route, row.kind, row.audience, row.domain, row.file]))}
`

const paths = writeEvidence('ROUTE_INVENTORY', evidence, markdown)
const csvPath = path.join(path.dirname(paths.latestJson), 'ROUTE_INVENTORY_LATEST.csv')
fs.writeFileSync(csvPath, csv, 'utf8')
console.log(`ANGELCARE Marketplace route authority: ${evidence.status}`)
console.log(`Routes: ${rows.length} · Pages: ${evidence.summary.pages} · APIs: ${evidence.summary.apis}`)
console.log(`Evidence: ${paths.latestMarkdown}`)
console.log(`CSV: ${csvPath}`)
process.exitCode = evidence.status === 'PASS' ? 0 : 1
