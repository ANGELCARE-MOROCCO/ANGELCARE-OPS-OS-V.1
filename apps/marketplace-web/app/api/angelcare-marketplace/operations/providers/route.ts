import { governCustomerPlatformRoute } from '@/lib/runtime/customer-platform/governor'
import {handleProviders} from '@/angelcare-marketplace/operations-reconciliation/api-handlers'
const GET__customerPlatformImpl = handleProviders

export const GET = governCustomerPlatformRoute(
  { workloadClass: 'interactive', operation: 'GET:/api/angelcare-marketplace/operations/providers' },
  GET__customerPlatformImpl,
)
