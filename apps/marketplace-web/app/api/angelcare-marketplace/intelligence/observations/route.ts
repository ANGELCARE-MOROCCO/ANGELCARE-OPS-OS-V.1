import { governCustomerPlatformRoute } from '@/lib/runtime/customer-platform/governor'
import { handleObservations as GET__customerPlatformImpl } from '@/angelcare-marketplace/final-authority/api-handlers'

export const GET = governCustomerPlatformRoute(
  { workloadClass: 'heavy', operation: 'GET:/api/angelcare-marketplace/intelligence/observations' },
  GET__customerPlatformImpl,
)
