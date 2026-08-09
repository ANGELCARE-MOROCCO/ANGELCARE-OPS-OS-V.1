import fs from 'node:fs'
import path from 'node:path'
import { projectRoot, walk, writeEvidence, markdownTable, routeRegex } from './lib.mjs'

const root = projectRoot()
const startedAt = new Date().toISOString()
const routes = new Set(walk('app/angelcare-marketplace').filter((file) => /\/page\.(?:ts|tsx)$/.test(file)).map((file) => {
  const parts = file.replace(/^app\//, '').split('/').slice(0, -1).filter((part) => !(part.startsWith('(') && part.endsWith(')')))
  return `/${parts.join('/')}`
}))

const experiences = [
  ['Homepage Flagship', '/angelcare-marketplace/[locale]', 'public', 'campaign theatre, search, territory, audience, commercial sections'],
  ['Marketplace Index', '/angelcare-marketplace/[locale]/marketplace', 'public', 'catalog discovery, search, category distribution'],
  ['Marketplace Search', '/angelcare-marketplace/[locale]/marketplace/search', 'public', 'query, filters, sorting, no-result recovery'],
  ['Category Storefront', '/angelcare-marketplace/[locale]/marketplace/category/[categoryKey]', 'public', 'purpose-built category identity and inventory'],
  ['Sellable Item Dossier', '/angelcare-marketplace/[locale]/marketplace/[slug]', 'public', 'media, pricing authority, availability, Trust, CTA'],
  ['Basket', '/angelcare-marketplace/[locale]/basket', 'conversion', 'transactional lines, totals, compatibility'],
  ['Quote Basket', '/angelcare-marketplace/[locale]/quote-basket', 'conversion', 'quotation-only commercial scope'],
  ['Checkout', '/angelcare-marketplace/[locale]/checkout', 'conversion', 'identity, configuration, consent, review'],
  ['Service Booking', '/angelcare-marketplace/[locale]/booking/[itemSlug]', 'conversion', 'schedule, territory, child/service context'],
  ['Academy Enrollment', '/angelcare-marketplace/[locale]/enrollment/[itemSlug]', 'conversion', 'learner, cohort, prerequisite, seat'],
  ['B2B Quotation', '/angelcare-marketplace/[locale]/quotation/[itemSlug]', 'conversion', 'organization, sites, capacity, CRM handover'],
  ['Partner Subscription', '/angelcare-marketplace/[locale]/subscription/[itemSlug]', 'conversion', 'plan, modules, usage, tenant handover'],
  ['Mon ANGELCARE', '/angelcare-marketplace/[locale]/account', 'customer', 'active journeys, next actions, documents, changes'],
  ['Customer Action Center', '/angelcare-marketplace/[locale]/account/action-center', 'customer', 'real outstanding obligations and deadlines'],
  ['Customer Journeys', '/angelcare-marketplace/[locale]/account/journeys', 'customer', 'evidence-backed journey timelines'],
  ['Journey Command', '/angelcare-marketplace/admin/journeys', 'admin', 'journey queues, handovers, exceptions, recovery'],
  ['Operations Command', '/angelcare-marketplace/admin/operations', 'admin', 'fulfillment, evidence, SLA, reconciliation'],
  ['Vendor Commerce', '/angelcare-marketplace/admin/vendors', 'admin', 'vendor readiness, obligations, quality, settlements'],
  ['Provider Commerce', '/angelcare-marketplace/admin/providers/commerce', 'admin', 'eligibility, missions, evidence, payables'],
  ['Executive Intelligence', '/angelcare-marketplace/admin/intelligence', 'executive', 'governed metrics and source evidence'],
  ['Growth Command', '/angelcare-marketplace/admin/growth', 'executive', 'evidence-based opportunities and experiments'],
  ['Performance Command', '/angelcare-marketplace/admin/platform-performance', 'executive', 'routes, APIs, database, search, media'],
  ['Security Command', '/angelcare-marketplace/admin/security', 'security', 'RBAC, SoD, isolation, incidents'],
  ['QA Authority', '/angelcare-marketplace/admin/qa', 'qa', 'runs, checks, defects, regression evidence'],
  ['Final Launch Authority', '/angelcare-marketplace/admin/launch', 'executive', 'gates, approvals, release, rollback, monitoring'],
]

function routeExists(route) {
  if (routes.has(route)) return true
  const sample = route
    .replace('[locale]', 'fr')
    .replace('[categoryKey]', 'families')
    .replace('[slug]', 'sample')
    .replace('[itemSlug]', 'sample')
  return [...routes].some((candidate) => routeRegex(candidate).test(sample))
}

const cssFiles = walk('angelcare-marketplace').filter((file) => file.endsWith('.module.css'))
const css = cssFiles.map((file) => fs.readFileSync(path.join(root, file), 'utf8')).join('\n')
const responsive = /@media\s*\([^)]*max-width/i.test(css)
const rtl = /\[dir=['"]?rtl|\.rtl\b|:dir\(rtl\)/i.test(css)
const reducedMotion = /prefers-reduced-motion/i.test(css)

const rows = experiences.map(([name, route, audience, purpose]) => ({
  name,
  route,
  audience,
  purpose,
  sourcePresent: routeExists(route),
  desktop: 'runtime evidence required',
  tablet: responsive ? 'responsive source present · runtime evidence required' : 'missing responsive source',
  mobile: responsive ? 'responsive source present · runtime evidence required' : 'missing responsive source',
  fr: 'source present · runtime copy review required',
  en: route.includes('[locale]') ? 'localized route present · runtime copy review required' : 'not locale-routed',
  ar: route.includes('[locale]') ? `${rtl ? 'RTL source present' : 'RTL source missing'} · runtime review required` : 'not locale-routed',
}))
const missingRoutes = rows.filter((row) => !row.sourcePresent)
const status = missingRoutes.length || !responsive || !rtl || !reducedMotion ? 'FAIL' : 'SOURCE_ACCEPTED_RUNTIME_PENDING'
const evidence = {
  programme: 'ANGELCARE Marketplace UI/UIX Acceptance Matrix',
  startedAt,
  completedAt: new Date().toISOString(),
  status,
  sourcePrimitives: { responsive, rtl, reducedMotion, cssModules: cssFiles.length },
  missingRoutes,
  rows,
}
const markdown = `# ANGELCARE Marketplace UI/UIX Acceptance Matrix

**Status:** ${status}
**Purpose-built experiences:** ${rows.length}
**CSS Modules:** ${cssFiles.length}
**Responsive source:** ${responsive ? 'PASS' : 'FAIL'}
**RTL source:** ${rtl ? 'PASS' : 'FAIL'}
**Reduced-motion source:** ${reducedMotion ? 'PASS' : 'FAIL'}

## Truth boundary

Source presence and visual primitives are verified here. Desktop, tablet, mobile, FR, EN and Arabic acceptance remains **runtime pending** until browser screenshots and interaction evidence are captured against the actual application with real records.

${markdownTable(['Experience', 'Route', 'Audience', 'Purpose', 'Source', 'Desktop', 'Tablet', 'Mobile', 'FR', 'EN', 'AR'], rows.map((row) => [row.name, row.route, row.audience, row.purpose, row.sourcePresent ? 'PASS' : 'FAIL', row.desktop, row.tablet, row.mobile, row.fr, row.en, row.ar]))}
`
const paths = writeEvidence('UIUX_ACCEPTANCE_MATRIX', evidence, markdown)
console.log(`ANGELCARE Marketplace UI/UIX matrix: ${status}`)
console.log(`Evidence: ${paths.latestMarkdown}`)
process.exitCode = status === 'FAIL' ? 1 : 0
