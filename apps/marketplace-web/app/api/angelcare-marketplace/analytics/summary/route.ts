import { governCustomerPlatformRoute } from '@/lib/runtime/customer-platform/governor'
import { handleAnalyticsSummary } from '@/angelcare-marketplace/analytics-security/api-handlers'
const GET__customerPlatformImpl = handleAnalyticsSummary

export const GET = governCustomerPlatformRoute(
  { workloadClass: 'heavy', operation: 'GET:/api/angelcare-marketplace/analytics/summary' },
  GET__customerPlatformImpl,
)
