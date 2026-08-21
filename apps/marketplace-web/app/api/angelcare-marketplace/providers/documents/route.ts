import { governCustomerPlatformRoute } from '@/lib/runtime/customer-platform/governor'
import { handleProviderSummary } from '@/angelcare-marketplace/provider-workforce/api-handlers'
const GET__customerPlatformImpl = handleProviderSummary

export const GET = governCustomerPlatformRoute(
  { workloadClass: 'interactive', operation: 'GET:/api/angelcare-marketplace/providers/documents' },
  GET__customerPlatformImpl,
)
