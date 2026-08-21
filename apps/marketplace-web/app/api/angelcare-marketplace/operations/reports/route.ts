import { governCustomerPlatformRoute } from '@/lib/runtime/customer-platform/governor'
import { handleOperationsSummary } from '@/angelcare-marketplace/operations-execution/api-handlers'
const GET__customerPlatformImpl = handleOperationsSummary

export const GET = governCustomerPlatformRoute(
  { workloadClass: 'heavy', operation: 'GET:/api/angelcare-marketplace/operations/reports' },
  GET__customerPlatformImpl,
)
