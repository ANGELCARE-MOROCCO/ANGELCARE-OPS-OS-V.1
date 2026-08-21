import { governCustomerPlatformRoute } from '@/lib/runtime/customer-platform/governor'
import { handleProviders } from '@/angelcare-marketplace/provider-workforce/api-handlers'
const GET__customerPlatformImpl = handleProviders
const POST__customerPlatformImpl = handleProviders

export const GET = governCustomerPlatformRoute(
  { workloadClass: 'interactive', operation: 'GET:/api/angelcare-marketplace/providers' },
  GET__customerPlatformImpl,
)

export const POST = governCustomerPlatformRoute(
  { workloadClass: 'mutation', operation: 'POST:/api/angelcare-marketplace/providers' },
  POST__customerPlatformImpl,
)
