import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
let checks = 0
const failures = []
function check(condition, label) {
  checks += 1
  if (!condition) failures.push(label)
  else console.log(`✅ ${label}`)
}
function read(rel) { return fs.readFileSync(path.join(root, rel), 'utf8') }
function exists(rel) { return fs.existsSync(path.join(root, rel)) }

const runtimeFiles = [
  'lib/runtime/customer-platform/types.ts',
  'lib/runtime/customer-platform/config.ts',
  'lib/runtime/customer-platform/ingress.ts',
  'lib/runtime/customer-platform/redis.ts',
  'lib/runtime/customer-platform/metrics.ts',
  'lib/runtime/customer-platform/event-loop.ts',
  'lib/runtime/customer-platform/semaphore.ts',
  'lib/runtime/customer-platform/governor.ts',
  'lib/runtime/customer-platform/performance.ts',
]
for (const file of runtimeFiles) check(exists(file), `runtime exists: ${file}`)

const pkg = JSON.parse(read('package.json'))
check(pkg.dependencies?.redis === '5.12.1', 'redis dependency pinned to 5.12.1')

const proxy = read('proxy.ts')
const ingress = read('lib/runtime/customer-platform/ingress.ts')
check(proxy.includes('admitCustomerPlatformIngress'), 'proxy ingress shield integrated')
check(proxy.includes("'/api/:path*'"), 'proxy covers API universe')
check(proxy.includes("'/angelcare-marketplace/:path*'"), 'proxy covers Marketplace pages')
check(proxy.includes("'/angelcare-360-command-center/:path*'"), 'proxy covers AngelCare 360 pages')
check(ingress.includes('CUSTOMER_PLATFORM_INGRESS_SATURATED'), 'controlled ingress saturation response')

check(ingress.includes('CUSTOMER_PLATFORM_PAYLOAD_TOO_LARGE'), 'payload oversize contract exists')
check(ingress.includes('4_096'), 'ingress bucket memory is bounded')
check(!ingress.includes("const PROVIDER = ['/provider'"), 'service-provider workforce is not misclassified as external provider')

const request = read('angelcare-marketplace/server/request.ts')
check(request.includes('maxJsonBodyBytes'), 'Marketplace JSON body bounded')
check(request.includes('TextEncoder'), 'chunked/undeclared JSON measured after parse')

const performance = read('angelcare-marketplace/final-authority/repository.ts')
check(performance.includes('getCustomerPlatformPerformanceObservations'), 'existing Performance Command receives live runtime telemetry')

const semaphore = read('lib/runtime/customer-platform/semaphore.ts')
for (const marker of ['ZREMRANGEBYSCORE','failClosedWhenRedisConfigured','tenantLimit','angelcare:customer-platform:governor']) {
  check(semaphore.includes(marker), `distributed governor marker: ${marker}`)
}
const governor = read('lib/runtime/customer-platform/governor.ts')
check(governor.includes("createHash('sha256')"), 'tenant/session fairness scopes are hashed')
check(governor.includes('x-angelcare-customer-governor'), 'governed saturation responses observable')

const expectedRoutes = [
  "app/api/angelcare-marketplace/admin/category-native/imports/[jobId]/[action]/route.ts",
  "app/api/angelcare-marketplace/admin/category-native/imports/[jobId]/route.ts",
  "app/api/angelcare-marketplace/admin/category-native/imports/route.ts",
  "app/api/angelcare-marketplace/admin/commerce/export/[resource]/route.ts",
  "app/api/angelcare-marketplace/admin/commerce/import/[resource]/route.ts",
  "app/api/angelcare-marketplace/admin/footer-studio/analytics/route.ts",
  "app/api/angelcare-marketplace/admin/live-experience/analytics/route.ts",
  "app/api/angelcare-marketplace/admin/wallet/imports/route.ts",
  "app/api/angelcare-marketplace/analytics/data-quality/route.ts",
  "app/api/angelcare-marketplace/analytics/metrics/route.ts",
  "app/api/angelcare-marketplace/analytics/refresh/route.ts",
  "app/api/angelcare-marketplace/analytics/snapshots/route.ts",
  "app/api/angelcare-marketplace/analytics/summary/route.ts",
  "app/api/angelcare-marketplace/foundation/audit/export/route.ts",
  "app/api/angelcare-marketplace/intelligence/executive/route.ts",
  "app/api/angelcare-marketplace/intelligence/metrics/route.ts",
  "app/api/angelcare-marketplace/intelligence/observations/route.ts",
  "app/api/angelcare-marketplace/localization/exports/route.ts",
  "app/api/angelcare-marketplace/localization/imports/route.ts",
  "app/api/angelcare-marketplace/localization/scans/route.ts",
  "app/api/angelcare-marketplace/operations/providers/route.ts",
  "app/api/angelcare-marketplace/operations/reports/route.ts",
  "app/api/angelcare-marketplace/payments/webhooks/[provider]/route.ts",
  "app/api/angelcare-marketplace/providers/[providerId]/availability/route.ts",
  "app/api/angelcare-marketplace/providers/[providerId]/documents/[documentId]/review/route.ts",
  "app/api/angelcare-marketplace/providers/[providerId]/eligibility/recalculate/route.ts",
  "app/api/angelcare-marketplace/providers/[providerId]/route.ts",
  "app/api/angelcare-marketplace/providers/assignments/route.ts",
  "app/api/angelcare-marketplace/providers/certifications/route.ts",
  "app/api/angelcare-marketplace/providers/documents/route.ts",
  "app/api/angelcare-marketplace/providers/payable/[payableId]/decision/route.ts",
  "app/api/angelcare-marketplace/providers/payable/route.ts",
  "app/api/angelcare-marketplace/providers/route.ts",
  "app/api/angelcare-marketplace/providers/summary/route.ts",
  "app/api/angelcare-marketplace/territories/export/route.ts",
  "app/api/angelcare360/claims/route.ts",
  "app/api/angelcare360/communication-command/route.ts",
  "app/api/angelcare360/customer-broadcasts/route.ts",
  "app/api/angelcare360/inventory-command/route.ts",
  "app/api/angelcare360/library-command/route.ts",
  "app/api/angelcare360/payroll-sovereign/route.ts",
  "app/api/angelcare360/transport-command/route.ts"
]
let wrappedMethods = 0
for (const file of expectedRoutes) {
  const source = read(file)
  check(source.includes('governCustomerPlatformRoute'), `governed route: ${file}`)
  wrappedMethods += (source.match(/governCustomerPlatformRoute\(/g) || []).length
}
check(expectedRoutes.length === 42, '42 high-risk/critical route files governed')
check(wrappedMethods >= 49, 'at least 49 route methods governed')

const ac360 = [
  'app/api/angelcare360/claims/route.ts',
  'app/api/angelcare360/communication-command/route.ts',
  'app/api/angelcare360/customer-broadcasts/route.ts',
  'app/api/angelcare360/inventory-command/route.ts',
  'app/api/angelcare360/library-command/route.ts',
  'app/api/angelcare360/payroll-sovereign/route.ts',
  'app/api/angelcare360/transport-command/route.ts',
]
for (const file of ac360) check(read(file).includes('governCustomerPlatformRoute'), `AngelCare 360 command governed: ${file}`)

const health = read('app/api/angelcare-marketplace/foundation/health/route.ts')
check(health.includes('handleHealthGet'), 'existing Marketplace health contract preserved')

const forbidden = [
  'NEXT_PUBLIC_CUSTOMER_PLATFORM_REDIS_URL',
  'NEXT_PUBLIC_REDIS_URL',
  'CUSTOMER_PLATFORM_REDIS_PASSWORD=',
]
const runtimeCombined = runtimeFiles.map(read).join('\n')
for (const marker of forbidden) check(!runtimeCombined.includes(marker), `no public/runtime secret literal: ${marker}`)

console.log('')
console.log('====================================================================')
console.log(`CUSTOMER_PLATFORM_PHASE_II_SOURCE_CHECKS=${checks}`)
console.log(`CUSTOMER_PLATFORM_PHASE_II_SOURCE_FAILURES=${failures.length}`)
console.log('====================================================================')
if (failures.length) {
  for (const failure of failures) console.error(`❌ ${failure}`)
  process.exit(1)
}
