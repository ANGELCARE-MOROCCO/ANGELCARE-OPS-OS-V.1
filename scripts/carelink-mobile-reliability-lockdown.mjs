#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const failures = []
const warnings = []
const passes = []

function rel(...parts) {
  return path.join(root, ...parts)
}

function exists(file) {
  return fs.existsSync(rel(file))
}

function read(file) {
  const full = rel(file)
  if (!fs.existsSync(full)) {
    failures.push(`Missing required file: ${file}`)
    return ''
  }
  return fs.readFileSync(full, 'utf8')
}

function pass(label) {
  passes.push(label)
}

function fail(label) {
  failures.push(label)
}

function warn(label) {
  warnings.push(label)
}

function expectFile(file, label = file) {
  if (exists(file)) pass(`file:${label}`)
  else fail(`Missing ${label}: ${file}`)
}

function expectIncludes(file, needles, label = file) {
  const content = read(file)
  for (const needle of needles) {
    if (!content.includes(needle)) fail(`${label} missing token: ${needle}`)
  }
}

function routeFileFromEndpoint(endpoint) {
  let file = endpoint
    .replace(/^\/api\//, 'app/api/')
    .replace(/\$\{mission\.id\}/g, '[id]')
    .replace(/\$\{nextMission\.id\}/g, '[id]')
    .replace(/\$\{item\.id\}/g, '[id]')
    .replace(/\$\{alert\.id\}/g, '[id]')
    .replace(/\$\{thread\.id\}/g, '[id]')
  return `${file}/route.ts`
}

const mobilePages = [
  'app/carelink/page.tsx',
  'app/carelink/login/page.tsx',
  'app/carelink/missions/page.tsx',
  'app/carelink/missions/[id]/page.tsx',
  'app/carelink/schedule/page.tsx',
  'app/carelink/calendar/page.tsx',
  'app/carelink/messages/page.tsx',
  'app/carelink/notifications/page.tsx',
  'app/carelink/alerts/page.tsx',
  'app/carelink/history/page.tsx',
  'app/carelink/payments/page.tsx',
  'app/carelink/readiness/page.tsx',
  'app/carelink/support/page.tsx',
  'app/carelink/profile/page.tsx',
  'app/carelink/safety/page.tsx',
  'app/carelink/offline/page.tsx',
]

const coreFiles = [
  'components/carelink/CareLinkMobileClient.tsx',
  'components/carelink/mobile/CareLinkFieldAgentPremiumApp.tsx',
  'components/carelink/mobile/CareLinkAgentEnterpriseScreens.tsx',
  'lib/carelink/mobile-adapter.ts',
  'lib/carelink/mobile-auth.ts',
  'lib/carelink/mobile-persistence.ts',
  'lib/carelink/offline-queue.ts',
  'lib/carelink/realtime.ts',
]

for (const file of mobilePages) expectFile(file, `mobile route ${file}`)
for (const file of coreFiles) expectFile(file)

const mobileApp = read('components/carelink/mobile/CareLinkFieldAgentPremiumApp.tsx')
const enterpriseScreens = read('components/carelink/mobile/CareLinkAgentEnterpriseScreens.tsx')
const adapter = read('lib/carelink/mobile-adapter.ts')
const persistence = read('lib/carelink/mobile-persistence.ts')

const expectedViews = [
  'home',
  'missions',
  'mission',
  'schedule',
  'calendar',
  'notifications',
  'alerts',
  'history',
  'payments',
  'readiness',
  'support',
  'messages',
  'profile',
  'safety',
  'offline',
]

for (const view of expectedViews) {
  if (!mobileApp.includes(`${view}: {`) && !mobileApp.includes(`view === '${view}'`) && view !== 'home') {
    fail(`Mobile view is not clearly wired in CareLinkFieldAgentPremiumApp: ${view}`)
  }
}

expectIncludes('components/carelink/mobile/CareLinkFieldAgentPremiumApp.tsx', [
  'useCareLinkOfflineQueue',
  'useCareLinkRealtime',
  'NotificationsScreen',
  'AlertsScreen',
  'MessagesScreen',
  'EnterprisePaymentsScreen',
  'EnterpriseReadinessScreen',
  'EnterpriseAgentProfileScreen',
  'EnterpriseSafetyScreen',
  'EnterpriseOfflineScreen',
], 'mobile app shell')

expectIncludes('lib/carelink/mobile-adapter.ts', [
  'notifications:',
  'messages:',
  'alerts:',
  'payments:',
  'readiness:',
  'schedule:',
  'history:',
  'enterpriseDossier',
  'paymentDisputes',
  'availabilityUpdates',
  'presenceProofs',
  'reportCorrections',
  'sosEvents',
], 'mobile adapter workspace contract')

expectIncludes('lib/carelink/mobile-persistence.ts', [
  'createNotification',
  'createDispatchMessage',
  'loadNotifications',
  'loadDispatchMessages',
  'loadPaymentDisputes',
  'loadMobileSosEvents',
], 'mobile persistence contract')

const requiredApiRoutes = [
  'app/api/carelink/messages/route.ts',
  'app/api/carelink/messages/[id]/read/route.ts',
  'app/api/carelink/messages/threads/route.ts',
  'app/api/carelink/notifications/route.ts',
  'app/api/carelink/notifications/[id]/acknowledge/route.ts',
  'app/api/carelink/alerts/route.ts',
  'app/api/carelink/alerts/[id]/acknowledge/route.ts',
  'app/api/carelink/payments/disputes/route.ts',
  'app/api/carelink/profile/documents/route.ts',
  'app/api/carelink/profile/corrections/route.ts',
  'app/api/carelink/readiness/route.ts',
  'app/api/carelink/readiness/review-request/route.ts',
  'app/api/carelink/support/route.ts',
  'app/api/carelink/sos/route.ts',
  'app/api/carelink/availability/route.ts',
]

for (const file of requiredApiRoutes) expectFile(file, `mobile API ${file}`)

const missionActions = [
  'accept',
  'decline',
  'confirm-readiness',
  'en-route',
  'delay',
  'arrive',
  'arrived',
  'check-in',
  'start',
  'report',
  'incident',
  'request-replacement',
  'complete',
  'brief-acknowledge',
  'route-execution',
  'program-activity',
  'checklist',
  'report-correction',
  'presence-proof',
]

for (const action of missionActions) {
  expectFile(`app/api/carelink/missions/[id]/${action}/route.ts`, `mission action ${action}`)
}

const extractedEndpoints = new Set()
for (const match of mobileApp.matchAll(/[`'"](\/api\/carelink\/[^`'"]+)[`'"]/g)) {
  extractedEndpoints.add(match[1])
}
for (const endpoint of extractedEndpoints) {
  const file = routeFileFromEndpoint(endpoint)
  if (!exists(file)) {
    // Dynamic action endpoint `/api/carelink/missions/${mission.id}/${action}` is covered by missionActions.
    if (!endpoint.includes('${mission.id}/${action}')) fail(`Mobile UI references API endpoint without route file: ${endpoint} -> ${file}`)
  }
}

const pageToCloseCycle = [
  {
    page: 'schedule-r4b',
    file: enterpriseScreens,
    tokens: ['/api/carelink/availability', 'setLocalRows', 'blackoutDate', 'weeklyWindows', 'preferredZones', 'ScheduleToggleCard'],
  },
  {
    page: 'notifications',
    tokens: ['NotificationsScreen', '/api/carelink/notifications/${item.id}/acknowledge', '/carelink/notifications'],
  },
  {
    page: 'alerts',
    tokens: ['AlertsScreen', '/api/carelink/alerts/${alert.id}/acknowledge', '/carelink/messages'],
  },
  {
    page: 'messages',
    tokens: ['MessagesScreen', '/api/carelink/messages', 'setLocalMessages'],
  },
  {
    page: 'payments',
    tokens: ['EnterprisePaymentsScreen', '/api/carelink/payments/disputes'],
    file: enterpriseScreens,
  },
  {
    page: 'readiness',
    tokens: ['EnterpriseReadinessScreen', '/api/carelink/readiness/review-request'],
    file: enterpriseScreens,
  },
  {
    page: 'profile',
    tokens: ['EnterpriseAgentProfileScreen', '/api/carelink/profile/corrections', '/api/carelink/profile/documents'],
    file: enterpriseScreens,
  },
  {
    page: 'safety',
    tokens: ['EnterpriseSafetyScreen', '/api/carelink/sos'],
    file: enterpriseScreens,
  },
  {
    page: 'offline',
    tokens: ['EnterpriseOfflineScreen', 'pendingCount', 'syncing', 'online'],
    file: enterpriseScreens,
  },
]

for (const cycle of pageToCloseCycle) {
  // R1 audit correction:
  // Some close-cycle endpoints live in the mobile shell while the enterprise screen token
  // lives in CareLinkAgentEnterpriseScreens. A valid mobile close-cycle may span both files.
  const source = cycle.file ? `${cycle.file}\n${mobileApp}` : mobileApp
  for (const token of cycle.tokens) {
    if (!source.includes(token)) fail(`Mobile close-cycle '${cycle.page}' missing token: ${token}`)
  }
}

const opsVisibilityRoutes = [
  'app/api/carelink/ops/notifications/route.ts',
  'app/api/carelink/ops/notifications/[id]/acknowledge/route.ts',
  'app/api/carelink/ops/messages/route.ts',
  'app/api/carelink/ops/messages/[id]/read/route.ts',
  'app/api/carelink/ops/payments/disputes/route.ts',
  'app/api/carelink/ops/payments/disputes/[id]/review/route.ts',
  'app/api/carelink/ops/readiness/route.ts',
  'app/api/carelink/ops/agents/[id]/profile/route.ts',
  'app/api/carelink/ops/agents/[id]/command/route.ts',
]
for (const file of opsVisibilityRoutes) expectFile(file, `OPS visibility route ${file}`)

const riskyStaticPatterns = [
  { pattern: /onClick=\{\(\) => \{\}\}/g, label: 'empty onClick handler' },
  { pattern: /href=["']#["']/g, label: 'dead # link' },
  { pattern: /TODO|FIXME|not implemented|coming soon/gi, label: 'unfinished marker' },
]
for (const { pattern, label } of riskyStaticPatterns) {
  const appHits = [...mobileApp.matchAll(pattern)].length + [...enterpriseScreens.matchAll(pattern)].length
  if (appHits) warn(`Potential unfinished UI marker: ${label} (${appHits} hit/s)`)
}

if (!mobileApp.includes('BottomNav')) warn('BottomNav token missing from mobile shell')
if (!adapter.includes('source: \'live-db\'') && !adapter.includes('source: "live-db"')) warn('Mobile adapter does not clearly label live-db source')
if (!persistence.includes('recordMissionEvent')) warn('Persistence layer does not clearly record mission events')

console.log('\nCARELINK MOBILE RELIABILITY LOCKDOWN')
console.log('-------------------------------------')
console.log(`Passed static checks: ${passes.length}`)
if (warnings.length) {
  console.log(`Warnings: ${warnings.length}`)
  for (const item of warnings) console.log(`⚠ ${item}`)
}
if (failures.length) {
  console.error(`Failures: ${failures.length}`)
  for (const item of failures) console.error(`✖ ${item}`)
  process.exit(1)
}

console.log('✅ CareLink mobile reliability lockdown static gate passed')
