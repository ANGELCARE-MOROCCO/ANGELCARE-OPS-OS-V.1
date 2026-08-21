import { governCustomerPlatformRoute } from '@/lib/runtime/customer-platform/governor'
import { handleMetrics } from '@/angelcare-marketplace/analytics-security/api-handlers'
const GET__customerPlatformImpl = handleMetrics

export const GET = governCustomerPlatformRoute(
  { workloadClass: 'heavy', operation: 'GET:/api/angelcare-marketplace/analytics/metrics' },
  GET__customerPlatformImpl,
)
