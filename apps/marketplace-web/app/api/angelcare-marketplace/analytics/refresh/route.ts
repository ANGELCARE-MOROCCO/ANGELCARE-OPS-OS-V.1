import { governCustomerPlatformRoute } from '@/lib/runtime/customer-platform/governor'
import { handleAnalyticsRefresh } from '@/angelcare-marketplace/analytics-security/api-handlers'
const POST__customerPlatformImpl = handleAnalyticsRefresh

export const POST = governCustomerPlatformRoute(
  { workloadClass: 'heavy', operation: 'POST:/api/angelcare-marketplace/analytics/refresh' },
  POST__customerPlatformImpl,
)
