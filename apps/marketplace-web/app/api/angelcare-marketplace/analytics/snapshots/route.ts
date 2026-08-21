import { governCustomerPlatformRoute } from '@/lib/runtime/customer-platform/governor'
import { handleSnapshots } from '@/angelcare-marketplace/analytics-security/api-handlers'
const GET__customerPlatformImpl = handleSnapshots

export const GET = governCustomerPlatformRoute(
  { workloadClass: 'heavy', operation: 'GET:/api/angelcare-marketplace/analytics/snapshots' },
  GET__customerPlatformImpl,
)
