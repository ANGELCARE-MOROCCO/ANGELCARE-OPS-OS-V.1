import { governCustomerPlatformRoute } from '@/lib/runtime/customer-platform/governor'
import { handleLiveSummary } from '@/angelcare-marketplace/live-experience-command/api-handlers'
const GET__customerPlatformImpl = handleLiveSummary

export const GET = governCustomerPlatformRoute(
  { workloadClass: 'heavy', operation: 'GET:/api/angelcare-marketplace/admin/live-experience/analytics' },
  GET__customerPlatformImpl,
)
