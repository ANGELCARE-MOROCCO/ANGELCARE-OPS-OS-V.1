import { governCustomerPlatformRoute } from '@/lib/runtime/customer-platform/governor'
import { handleDataQuality } from '@/angelcare-marketplace/analytics-security/api-handlers'
const GET__customerPlatformImpl = handleDataQuality

export const GET = governCustomerPlatformRoute(
  { workloadClass: 'heavy', operation: 'GET:/api/angelcare-marketplace/analytics/data-quality' },
  GET__customerPlatformImpl,
)
